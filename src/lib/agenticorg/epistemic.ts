import type { ConceptAnalogy, ConceptNode, GraphEdge } from "@/domain/types";
import { getAgenticOrgClient } from "./client";
import { extractFromNotes } from "@/lib/notes";

export interface ExtractionResult {
  nodes: ConceptNode[];
  edges: GraphEdge[];
  summary: string;
  source: "agenticorg" | "local_fallback";
  rawSop?: unknown;
  knowledgeMatches?: Array<{ chunk: string; score: number; docName: string }>;
}

export interface ScaffoldGenerationResult {
  analogy: ConceptAnalogy;
  confidence: number;
  source: "agenticorg" | "local_fallback";
  reasoningTrace?: string[];
}

export interface WorkflowResult {
  workflowId: string;
  name: string;
  runId?: string;
  status: string;
  source: "agenticorg" | "local_fallback";
}

/**
 * Parses user notes or documents into concept nodes & prerequisite edges
 * using AgenticOrg SOP parsing and Knowledge retrieval.
 */
export async function extractConceptsFromNotes(
  text: string,
  slot = 0,
  domainHint = "computer-science",
): Promise<ExtractionResult> {
  const { client, isConfigured } = getAgenticOrgClient();

  if (!isConfigured || !client) {
    const fallback = extractFromNotes(text, slot);
    return {
      nodes: fallback.nodes,
      edges: fallback.edges,
      summary: fallback.summary,
      source: "local_fallback",
    };
  }

  try {
    // 1. Parse text using SOP parser to extract structured procedure/concept steps
    const sopDraft = await client.sop.parseText(text, domainHint);
    
    // 2. Query knowledge base to find grounding chunks in the user's corpus
    let knowledgeMatches: Array<{ chunk: string; score: number; docName: string }> = [];
    try {
      const searchHeadline = text.slice(0, 100).replace(/\n/g, " ");
      const kb = await client.knowledge.search(searchHeadline, { topK: 3 });
      if (Array.isArray(kb)) {
        knowledgeMatches = kb.map((item) => ({
          chunk: item.chunk_text,
          score: item.score,
          docName: item.document_name,
        }));
      }
    } catch {
      // Knowledge search may be empty or unindexed; non-fatal
    }

    // 3. Transform the SOP steps and knowledge matches into ConceptNodes and GraphEdges
    const config = (sopDraft?.config ?? {}) as Record<string, unknown>;
    const steps = Array.isArray(config.steps)
      ? (config.steps as Array<Record<string, unknown> | string>)
      : [];

    const nodes: ConceptNode[] = [];
    const edges: GraphEdge[] = [];
    const summary = text.trim().slice(0, 48) || "Extracted Concept Fragment";

    if (steps.length > 0) {
      steps.forEach((step, index) => {
        const stepName =
          typeof step === "string"
            ? step
            : (step.name as string) || (step.title as string) || `Step ${index + 1}`;
        const stepDesc =
          typeof step === "string"
            ? `Extracted from note procedure: ${step}`
            : (step.description as string) || (step.action as string) || "Extracted step node.";

        const nodeId = `agentic-sop-${slot}-${index}`;
        const prevId = index > 0 ? `agentic-sop-${slot}-${index - 1}` : "eventloop";

        nodes.push({
          id: nodeId,
          label: stepName.length > 28 ? `${stepName.slice(0, 26)}…` : stepName,
          codename: `agentic · ${stepName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 16)}`,
          tier: Math.min(8, 4 + index),
          familiarity: "uncharted",
          mastery: 0,
          blurb: stepDesc,
          prereqIds: [prevId],
        });

        edges.push({
          id: `edge-${slot}-${index}`,
          source: prevId,
          target: nodeId,
          relation: index === 0 ? "analogous_to" : "prerequisite_for",
        });
      });
    } else {
      // Fallback single root node if SOP returned no explicit steps
      const nodeId = `agentic-node-${slot}`;
      nodes.push({
        id: nodeId,
        label: summary,
        codename: `agentic · ${summary.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 16)}`,
        tier: 5,
        familiarity: "uncharted",
        mastery: 0,
        blurb: "Parsed via AgenticOrg SOP engine with live semantic grounding.",
        prereqIds: ["eventloop"],
      });
      edges.push({
        id: `edge-agentic-${slot}`,
        source: "eventloop",
        target: nodeId,
        relation: "analogous_to",
      });
    }

    return {
      nodes,
      edges,
      summary,
      source: "agenticorg",
      rawSop: sopDraft,
      knowledgeMatches,
    };
  } catch (err) {
    console.warn("AgenticOrg SOP extraction encountered error, falling back to local extractor:", err);
    const fallback = extractFromNotes(text, slot);
    return {
      nodes: fallback.nodes,
      edges: fallback.edges,
      summary: fallback.summary,
      source: "local_fallback",
    };
  }
}

/**
 * Generates an epistemic scaffold analogy bridging an unfamiliar target concept
 * to an anchor concept the user already masters.
 */
export async function generateGroundedScaffold(params: {
  targetId: string;
  targetLabel: string;
  anchorId: string;
  anchorLabel: string;
  userCorpusSnippet?: string;
}): Promise<ScaffoldGenerationResult> {
  const { client, isConfigured } = getAgenticOrgClient();

  if (!isConfigured || !client) {
    return {
      analogy: {
        anchorId: params.anchorId,
        anchorTitle: params.anchorLabel,
        anchorSource: "Mastered Corpus Anchor",
        targetTitle: params.targetLabel,
        targetSource: "Uncharted Learning Frontier",
        summary: `Grounded epistemic scaffold mapping ${params.targetLabel} mechanics to ${params.anchorLabel}.`,
        mapping: [
          {
            from: `${params.anchorLabel} Core Flow`,
            to: `${params.targetLabel} State Machine`,
            note: "Structural invariant transfers directly from your existing codebase experience.",
          },
        ],
        delta: [
          {
            title: "Distributed Fault Boundary",
            body: `Unlike single-node ${params.anchorLabel}, ${params.targetLabel} handles partition failure modes.`,
          },
        ],
      },
      confidence: 0.9,
      source: "local_fallback",
    };
  }

  try {
    const agentIdOrType =
      process.env.AGENTICORG_SCAFFOLD_AGENT_ID?.trim() ||
      process.env.AGENTICORG_AGENT_ID?.trim() ||
      "20a9ea93-6f7a-4296-b09b-de829814b4e3";

    // Run the epistemic scaffolding agent
    const promptText = `Generate grounded epistemic analogy mapping ${params.targetLabel} onto ${params.anchorLabel}.`;
    const result = await client.agents.run(agentIdOrType, {
      inputs: {
        task: promptText,
        prompt: promptText,
        target_concept: params.targetLabel,
        anchor_concept: params.anchorLabel,
        corpus_snippet: params.userCorpusSnippet ?? "Mastered distributed systems notes",
        instruction:
          "Generate strict epistemic grounding: 1. Core transfer mapping from anchor to target. 2. Delta differences where the analogy breaks down.",
      },
    });

    const output = (result.output ?? {}) as Record<string, unknown>;
    const mappings = Array.isArray(output.mapping)
      ? (output.mapping as Array<{ from: string; to: string; note: string }>)
      : [
          {
            from: `${params.anchorLabel} Invariant`,
            to: `${params.targetLabel} Mechanism`,
            note: (output.summary as string) || "Grounded correspondence computed by AgenticOrg agent.",
          },
        ];

    const delta = Array.isArray(output.delta)
      ? (output.delta as Array<{ title: string; body: string }>)
      : [
          {
            title: "Epistemic Frontier Delta",
            body: (output.difference as string) || "Asymmetric failure modes not covered by the anchor.",
          },
        ];

    return {
      analogy: {
        anchorId: params.anchorId,
        anchorTitle: params.anchorLabel,
        anchorSource: "AgenticOrg Verified Corpus",
        targetTitle: params.targetLabel,
        targetSource: "Agentic Scaffolding Runtime",
        summary:
          (output.summary as string) ||
          `AgenticOrg epistemic model mapped ${params.targetLabel} strictly through your mastery of ${params.anchorLabel}.`,
        mapping: mappings,
        delta,
      },
      confidence: result.confidence ?? 0.95,
      source: "agenticorg",
      reasoningTrace: result.reasoning_trace,
    };
  } catch (err) {
    console.warn("AgenticOrg agent execution fell back to local model:", err);
    return {
      analogy: {
        anchorId: params.anchorId,
        anchorTitle: params.anchorLabel,
        anchorSource: "Local Corpus",
        targetTitle: params.targetLabel,
        targetSource: "Frontier",
        summary: `Mapped ${params.targetLabel} onto ${params.anchorLabel}.`,
        mapping: [
          {
            from: `${params.anchorLabel} execution model`,
            to: `${params.targetLabel} protocol`,
            note: "Conceptual mechanics correspond directly.",
          },
        ],
        delta: [
          {
            title: "Failure semantics",
            body: "Network boundaries require consensus protocols.",
          },
        ],
      },
      confidence: 0.85,
      source: "local_fallback",
    };
  }
}

/**
 * Creates and triggers a live learning workflow using AgenticOrg workflows.
 */
export async function createEpistemicWorkflow(topic: string, domain = "education"): Promise<WorkflowResult> {
  const { client, isConfigured } = getAgenticOrgClient();

  if (!isConfigured || !client) {
    return {
      workflowId: `local-workflow-${Date.now()}`,
      name: `Epistemic Path: ${topic}`,
      status: "mocked",
      source: "local_fallback",
    };
  }

  try {
    const workflowDraft = await client.workflows.generate(
      `When user targets concept '${topic}', query mental model knowledge, verify prerequisite mastery signals, ` +
        `and run epistemic_scaffolder to generate customized analogy drawer.`,
    );

    const workflow = await client.workflows.create({
      name: `Epistemic Path · ${topic}`,
      definition: (workflowDraft.workflow as Record<string, unknown>) ?? {
        steps: ["query_knowledge", "check_mastery", "generate_scaffold"],
      },
      domain,
    });

    const run = await client.workflows.run(workflow.id as string, {
      payload: { topic, timestamp: new Date().toISOString() },
    });

    return {
      workflowId: String(workflow.id ?? ""),
      name: String(workflow.name ?? `Epistemic Path · ${topic}`),
      runId: String(run.id ?? run.run_id ?? ""),
      status: String(run.status ?? "running"),
      source: "agenticorg",
    };
  } catch (err) {
    console.warn("Failed creating AgenticOrg workflow, returning fallback:", err);
    return {
      workflowId: `workflow-${Date.now()}`,
      name: `Learning Path: ${topic}`,
      status: "fallback",
      source: "local_fallback",
    };
  }
}

/**
 * Retrieves MCP tools and A2A Agent Cards for external agents (ChatGPT, Claude, AgenticOrg runtime).
 */
export async function getAgenticA2AAndMCP() {
  const { client, isConfigured } = getAgenticOrgClient();

  if (!isConfigured || !client) {
    return {
      isConfigured: false,
      mcpTools: [
        {
          name: "tailor_ed_query_mental_model",
          description: "Inspect the learner's mastered concepts, active frontier, and prerequisite gaps.",
          inputSchema: { type: "object", properties: { concept_id: { type: "string" } } },
        },
        {
          name: "tailor_ed_grounded_analogy",
          description: "Generate a didactic scaffold anchored in the learner's own corpus.",
          inputSchema: { type: "object", properties: { target_concept: { type: "string" } } },
        },
      ],
      agentCard: {
        name: "Tailor Ed Epistemic Scaffolder",
        domain: "epistemic-learning",
        capabilities: ["concept-extraction", "shortest-path-planning", "grounded-analogies"],
      },
      a2aAgents: [],
    };
  }

  try {
    const [tools, card, agents] = await Promise.all([
      client.mcp.tools().catch(() => []),
      client.a2a.agentCard().catch(() => ({})),
      client.a2a.agents().catch(() => []),
    ]);

    return {
      isConfigured: true,
      mcpTools: tools,
      agentCard: card,
      a2aAgents: agents,
    };
  } catch {
    return {
      isConfigured: true,
      mcpTools: [],
      agentCard: {},
      a2aAgents: [],
    };
  }
}
