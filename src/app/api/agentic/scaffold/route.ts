import { NextRequest, NextResponse } from "next/server";
import { generateGroundedScaffold } from "@/lib/agenticorg/epistemic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetId, targetLabel, anchorId, anchorLabel, userCorpusSnippet } = body;

    if (!targetLabel || !anchorLabel) {
      return NextResponse.json(
        { error: "Both 'targetLabel' and 'anchorLabel' are required." },
        { status: 400 },
      );
    }

    const result = await generateGroundedScaffold({
      targetId: String(targetId ?? "target"),
      targetLabel: String(targetLabel),
      anchorId: String(anchorId ?? "anchor"),
      anchorLabel: String(anchorLabel),
      userCorpusSnippet: userCorpusSnippet ? String(userCorpusSnippet) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("API scaffold error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal scaffold generation error" },
      { status: 500 },
    );
  }
}
