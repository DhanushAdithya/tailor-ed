import { NextResponse } from "next/server";
import { getAgenticA2AAndMCP } from "@/lib/agenticorg/epistemic";

export async function GET() {
  try {
    const data = await getAgenticA2AAndMCP();
    return NextResponse.json(data);
  } catch (error) {
    console.error("API mcp-a2a error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error fetching MCP/A2A data" },
      { status: 500 },
    );
  }
}
