import { NextRequest, NextResponse } from "next/server";
import { createEpistemicWorkflow } from "@/lib/agenticorg/epistemic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const topic = String(body.topic ?? "").trim();
    const domain = body.domain ? String(body.domain) : "distributed-systems";

    if (!topic) {
      return NextResponse.json({ error: "Missing 'topic' field." }, { status: 400 });
    }

    const result = await createEpistemicWorkflow(topic, domain);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API workflow error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal workflow error" },
      { status: 500 },
    );
  }
}
