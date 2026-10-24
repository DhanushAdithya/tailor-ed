import { AgenticOrg } from "agenticorg-sdk";
import { getAgenticOrgClient } from "./client";

export interface AgenticDemoResults {
  agentRun?: {
    status: string;
    confidence: number;
    output: Record<string, unknown>;
  };
  commerceDiscovery?: {
    status: string;
    output: Record<string, unknown>;
  };
  draftAgent?: Record<string, unknown>;
  knowledgeSearch?: Array<{
    chunk_text: string;
    score: number;
    document_name: string;
  }>;
  workflowRun?: {
    workflowId: string;
    runId: string;
    status: string;
  };
}

/**
 * Creates an AgenticOrg client instance with a specific API key or
 * uses the configured environment variable.
 */
export function createAgenticClient(
  keyOrOptions?: string | { apiKey?: string; api_key?: string; baseUrl?: string },
  baseUrl?: string,
): AgenticOrg {
  if (typeof keyOrOptions === "string") {
    return new AgenticOrg({ apiKey: keyOrOptions, baseUrl });
  }
  if (keyOrOptions?.apiKey || keyOrOptions?.api_key) {
    const key = keyOrOptions.apiKey || keyOrOptions.api_key;
    return new AgenticOrg({ apiKey: key, baseUrl: keyOrOptions.baseUrl || baseUrl });
  }
  const { client } = getAgenticOrgClient();
  if (!client) {
    throw new Error(
      "AgenticOrg client is not configured. Please supply an apiKey or set AGENTICORG_API_KEY in .env",
    );
  }
  return client;
}

/**
 * 1. Run an agent by type or ID (e.g. Accounts Payable processor)
 */
export async function runProcessorAgent(
  client: AgenticOrg,
  invoiceId = "INV-001",
  agentNameOrId?: string,
) {
  const agent =
    agentNameOrId ||
    process.env.AGENTICORG_PROCESSOR_AGENT_ID ||
    "ap_processor";

  const result = await client.agents.run(agent, {
    inputs: {
      task: `Process invoice ${invoiceId}`,
      prompt: `Process invoice ${invoiceId}`,
      invoice_id: invoiceId,
    },
  });

  return {
    status: result.status,
    confidence: result.confidence,
    output: result.output,
    reasoningTrace: result.reasoning_trace,
  };
}

/**
 * 2. Buyer/seller commerce discovery via the seller commerce agent
 */
export async function runCommerceDiscovery(
  client: AgenticOrg,
  query = "Show available laptop stands under Rs 3000",
  merchantId = "merchant_demo",
  agentNameOrId?: string,
) {
  const agent =
    agentNameOrId ||
    process.env.AGENTICORG_COMMERCE_AGENT_ID ||
    "commerce_sales_agent";

  const commerce = await client.agents.run(agent, {
    action: "buyer_discovery_preview",
    inputs: {
      task: query,
      prompt: query,
      merchant_id: merchantId,
      query,
    },
  });

  return {
    status: commerce.status,
    output: commerce.output,
  };
}

/**
 * 3. Generate any launchable AI-template agent from skills/tools/connectors context
 */
export async function generateCustomAgent(
  client: AgenticOrg,
  prompt = "Create a contract intelligence agent using Confluence, Jira, and vendor policy KB.",
) {
  const draftAgent = await client.agents.generate(prompt);
  return draftAgent;
}

/**
 * 4. Knowledge search + workflow generation & execution
 */
export async function runKnowledgeWorkflow(
  client: AgenticOrg,
  query = "vendor renewal policy",
  workflowDescription = "Review vendor renewal risk using KB and Jira, then notify vendor_manager.",
) {
  // Knowledge search
  const kb = await client.knowledge.search(query, { topK: 3 });

  // Generate workflow
  const workflowDraft = await client.workflows.generate(workflowDescription);

  // Create workflow
  const workflow = await client.workflows.create({
    name: "Renewal Risk Review",
    definition: (workflowDraft.workflow as Record<string, unknown>) ?? {
      steps: ["search_knowledge", "check_jira", "notify_manager"],
    },
    domain: "ops",
  });

  // Run workflow
  const run = await client.workflows.run(String(workflow.id ?? ""), {
    payload: { vendor_id: "V-100" },
  });

  return {
    kb,
    workflowId: String(workflow.id ?? ""),
    runId: String(run.id ?? run.run_id ?? ""),
    status: String(run.status ?? "running"),
  };
}

/**
 * Executes the full suite of AgenticOrg operations sequentially
 */
export async function runAllOperations(apiKey?: string): Promise<AgenticDemoResults> {
  const client = createAgenticClient(apiKey);

  const results: AgenticDemoResults = {};

  try {
    results.agentRun = await runProcessorAgent(client);
  } catch (err) {
    console.error("Processor agent run error:", err);
  }

  try {
    results.commerceDiscovery = await runCommerceDiscovery(client);
  } catch (err) {
    console.error("Commerce discovery run error:", err);
  }

  try {
    results.draftAgent = await generateCustomAgent(client);
  } catch (err) {
    console.error("Generate draft agent error:", err);
  }

  try {
    const wf = await runKnowledgeWorkflow(client);
    results.knowledgeSearch = wf.kb;
    results.workflowRun = {
      workflowId: wf.workflowId,
      runId: wf.runId,
      status: wf.status,
    };
  } catch (err) {
    console.error("Workflow run error:", err);
  }

  return results;
}
