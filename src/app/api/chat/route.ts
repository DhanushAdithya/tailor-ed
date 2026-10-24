import { NextRequest, NextResponse } from "next/server";
import { getAgenticOrgClient } from "@/lib/agenticorg/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? body.query ?? body.text ?? body.prompt ?? body.task ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Missing 'message' in request body." }, { status: 400 });
    }

    const { isConfigured, baseUrl } = getAgenticOrgClient();
    const apiKey = process.env.AGENTICORG_API_KEY?.trim() || "";
    const agentId = process.env.AGENTICORG_AGENT_ID?.trim() || "20a9ea93-6f7a-4296-b09b-de829814b4e3";

    if (!isConfigured && !apiKey) {
      return NextResponse.json(
        { error: "AgenticOrg client is not configured. Please check your AGENTICORG_API_KEY." },
        { status: 500 },
      );
    }

    const cleanedBaseUrl = (baseUrl || process.env.AGENTICORG_BASE_URL || "https://agenticorg.hackathon.pinelabs.com").replace(/\/$/, "");

    // Prepare payload with top-level task/prompt required by the backend
    const payload = {
      task: message,
      prompt: message,
      message,
      query: message,
      action: "process",
      inputs: {
        task: message,
        prompt: message,
        message,
        query: message,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
    };

    // Candidate endpoints supported by Pine Labs / AgenticOrg deployments
    const endpoints = [
      `${cleanedBaseUrl}/api/v1/agents/${agentId}/run`,
      `${cleanedBaseUrl}/v1/agents/${agentId}/runs`,
      `${cleanedBaseUrl}/agents/${agentId}/chat`,
      `${cleanedBaseUrl}/agents/${agentId}/run`,
    ];

    let lastError: string | null = null;
    let data: Record<string, unknown> | null = null;

    for (const url of endpoints) {
      try {
        const resp = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(45000),
        });

        if (resp.ok) {
          const json = await resp.json();
          data = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : { response: String(json) };
          break;
        } else if (resp.status === 404) {
          continue; // Try next candidate endpoint
        } else {
          const errText = await resp.text();
          lastError = `HTTP ${resp.status}: ${errText}`;
        }
      } catch (fetchErr) {
        lastError = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      }
    }

    if (!data) {
      // Fallback: Try SDK agents.run if HTTP endpoints didn't match
      const { client } = getAgenticOrgClient();
      if (client) {
        try {
          const sdkResult = await client.agents.run(agentId, {
            inputs: {
              task: message,
              prompt: "You are an AI learning tutor and exam-preparation coach. Help learners understand subjects, build personalized study roadmaps, prepare for examinations, practice with questions, review answers, identify knowledge gaps, and maintain a structured learning plan. Teach like a patient, encouraging instructor: explain concepts clearly, adapt difficulty to the learner’s level, use examples and analogies, ask diagnostic questions, and provide concise summaries and revision techniques. When creating a roadmap, clarify the learner’s goal, exam date, current proficiency, available study time, syllabus, preferred learning style, and constraints before proposing milestones. Break plans into achievable sessions with priorities, practice activities, checkpoints, and revision cycles. For exam preparation, generate practice questions, mock tests, flashcards, worked solutions, and feedback while distinguishing confirmed facts from assumptions. Use available organizational learning content when relevant, and cite or identify the source when relying on retrieved material. Do not fabricate curricula, credentials, grades, exam policies, or source content. Protect learner privacy and avoid making high-stakes academic decisions on the learner’s behalf. If a request is outside education, learning, study planning, tutoring, or exam preparation, politely explain that you can only assist with learning-related matters and invite the user to ask a relevant question. If the request is unclear, ask focused clarifying questions rather than guessing.## User-provided requirements (authoritative)AI tutor to help create roadmaps and to prepare for exams like a teacher. For any queries from user that's outside the learning scope should be rejected gracefully.",
              query: message,
            },
          });
          data = {
            status: sdkResult.status,
            confidence: sdkResult.confidence,
            output: sdkResult.output,
            reasoningTrace: sdkResult.reasoning_trace,
          };
        } catch (sdkErr) {
          console.error("SDK fallback also failed:", sdkErr);
          throw new Error(lastError || (sdkErr instanceof Error ? sdkErr.message : String(sdkErr)));
        }
      } else {
        throw new Error(lastError || "Failed connecting to AgenticOrg agent endpoint");
      }
    }

    // Normalize output fields
    const output = (data.output as Record<string, unknown>) || data;
    const rawOutputText =
      (typeof data.raw_output === "string" && data.raw_output) ||
      (typeof (output as Record<string, unknown>).raw_output === "string" &&
        ((output as Record<string, unknown>).raw_output as string)) ||
      (typeof (output as Record<string, unknown>).response === "string" &&
        ((output as Record<string, unknown>).response as string)) ||
      (typeof data.response === "string" && data.response) ||
      (typeof data.reply === "string" && data.reply) ||
      "";

    const confidence = typeof data.confidence === "number" ? data.confidence : 1.0;
    const status = String(data.status || "completed");
    const reasoningTrace = Array.isArray(data.reasoning_trace)
      ? data.reasoning_trace
      : Array.isArray(data.reasoningTrace)
        ? data.reasoningTrace
        : [];

    return NextResponse.json({
      success: true,
      agentId,
      status,
      confidence,
      output,
      raw_output: rawOutputText,
      reasoningTrace,
    });
  } catch (error) {
    console.error("Direct agent execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error executing agent",
      },
      { status: 500 },
    );
  }
}
