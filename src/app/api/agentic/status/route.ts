import { NextResponse } from "next/server";
import { getAgenticOrgClient } from "@/lib/agenticorg/client";

export async function GET() {
  const { isConfigured, baseUrl } = getAgenticOrgClient();

  return NextResponse.json({
    status: isConfigured ? "connected" : "unconfigured",
    isConfigured,
    baseUrl,
    timestamp: new Date().toISOString(),
    capabilities: [
      "agents.run",
      "agents.generate",
      "sop.parseText",
      "sop.deploy",
      "knowledge.search",
      "workflows.generate",
      "workflows.run",
      "mcp.tools",
      "a2a.agentCard",
    ],
  });
}
