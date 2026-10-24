import { NextRequest, NextResponse } from "next/server";
import { getAgenticOrgClient } from "@/lib/agenticorg/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = String(body.message ?? body.query ?? body.text ?? "").trim();

    if (!message) {
      return NextResponse.json({ error: "Missing 'message' in request body." }, { status: 400 });
    }

    const { client, isConfigured } = getAgenticOrgClient();

    if (!isConfigured || !client) {
      return NextResponse.json(
        { error: "AgenticOrg client is not configured. Please check your AGENTICORG_API_KEY." },
        { status: 500 },
      );
    }

    const agentId =
      process.env.AGENTICORG_AGENT_ID?.trim() || "20a9ea93-6f7a-4296-b09b-de829814b4e3";

    // Run the specified agent directly with the user's message
    const result = await client.agents.run(agentId, {
      inputs: {
        message,
        query: message,
        prompt: message,
        input: message,
        text: message,
      },
    });

    return NextResponse.json({
      success: true,
      agentId,
      status: result.status,
      confidence: result.confidence,
      output: result.output,
      reasoningTrace: result.reasoning_trace,
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
