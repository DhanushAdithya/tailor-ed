import { NextRequest, NextResponse } from "next/server";
import { extractConceptsFromNotes } from "@/lib/agenticorg/epistemic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    const slot = Number(body.slot ?? 0);
    const domainHint = body.domainHint ? String(body.domainHint) : "computer-science";

    if (!text) {
      return NextResponse.json({ error: "Missing 'text' field in request payload." }, { status: 400 });
    }

    const result = await extractConceptsFromNotes(text, slot, domainHint);
    return NextResponse.json(result);
  } catch (error) {
    console.error("API extract error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal extraction error" },
      { status: 500 },
    );
  }
}
