import { NextRequest, NextResponse } from "next/server";
import {
  createAgenticClient,
  generateCustomAgent,
  runAllOperations,
  runCommerceDiscovery,
  runKnowledgeWorkflow,
  runProcessorAgent,
} from "@/lib/agenticorg/operations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "all");
    const apiKey = body.apiKey ? String(body.apiKey) : undefined;

    const client = createAgenticClient(apiKey);

    switch (action) {
      case "agent_run": {
        const invoiceId = body.inputs?.invoice_id ? String(body.inputs.invoice_id) : "INV-001";
        const result = await runProcessorAgent(client, invoiceId);
        return NextResponse.json({ success: true, result });
      }

      case "commerce": {
        const query = body.inputs?.query
          ? String(body.inputs.query)
          : "Show available laptop stands under Rs 3000";
        const result = await runCommerceDiscovery(client, query);
        return NextResponse.json({ success: true, result });
      }

      case "generate": {
        const prompt = body.inputs?.prompt
          ? String(body.inputs.prompt)
          : "Create a contract intelligence agent using Confluence, Jira, and vendor policy KB.";
        const result = await generateCustomAgent(client, prompt);
        return NextResponse.json({ success: true, result });
      }

      case "workflow": {
        const query = body.inputs?.query ? String(body.inputs.query) : "vendor renewal policy";
        const description = body.inputs?.description
          ? String(body.inputs.description)
          : "Review vendor renewal risk using KB and Jira, then notify vendor_manager.";
        const result = await runKnowledgeWorkflow(client, query, description);
        return NextResponse.json({ success: true, result });
      }

      case "all":
      default: {
        const results = await runAllOperations(apiKey);
        return NextResponse.json({ success: true, results });
      }
    }
  } catch (error) {
    console.error("AgenticOrg demo execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal error executing AgenticOrg operations",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    description: "AgenticOrg Operations Test Runner",
    availableActions: ["all", "agent_run", "commerce", "generate", "workflow"],
    usage: "POST /api/agentic/demo with JSON body { action: 'agent_run' | 'commerce' | 'generate' | 'workflow' | 'all' }",
  });
}
