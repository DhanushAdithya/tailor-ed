import type { ConceptAnalogy, ConceptNode, GraphEdge } from "@/domain/types";
import { extractFromNotes } from "./notes";

export interface ExtractAPIResponse {
  nodes: ConceptNode[];
  edges: GraphEdge[];
  summary: string;
  source: "agenticorg" | "local_fallback";
}

export interface ScaffoldAPIResponse {
  analogy: ConceptAnalogy;
  confidence: number;
  source: "agenticorg" | "local_fallback";
  reasoningTrace?: string[];
}

export async function checkAgenticStatus(): Promise<{
  status: string;
  isConfigured: boolean;
}> {
  try {
    const res = await fetch("/api/agentic/status");
    if (!res.ok) throw new Error("Status endpoint failed");
    return await res.json();
  } catch {
    return { status: "offline", isConfigured: false };
  }
}

export async function extractConceptsAPI(text: string, slot: number): Promise<ExtractAPIResponse> {
  try {
    const res = await fetch("/api/agentic/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, slot }),
    });
    if (!res.ok) throw new Error(`Extract failed with status ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using local fallback extraction:", err);
    const fallback = extractFromNotes(text, slot);
    return {
      nodes: fallback.nodes,
      edges: fallback.edges,
      summary: fallback.summary,
      source: "local_fallback",
    };
  }
}

export async function generateScaffoldAPI(params: {
  targetId: string;
  targetLabel: string;
  anchorId: string;
  anchorLabel: string;
}): Promise<ScaffoldAPIResponse> {
  try {
    const res = await fetch("/api/agentic/scaffold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error(`Scaffold API failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Scaffold generation failed, falling back:", err);
    return {
      analogy: {
        anchorId: params.anchorId,
        anchorTitle: params.anchorLabel,
        anchorSource: "Mastered Anchor",
        targetTitle: params.targetLabel,
        targetSource: "Frontier",
        summary: `Epistemic scaffold connecting ${params.targetLabel} with ${params.anchorLabel}.`,
        mapping: [
          {
            from: `${params.anchorLabel} Pattern`,
            to: `${params.targetLabel} Architecture`,
            note: "Invariant preserved across domains.",
          },
        ],
        delta: [
          {
            title: "Boundary Conditions",
            body: "Distributed synchronization requirements apply.",
          },
        ],
      },
      confidence: 0.8,
      source: "local_fallback",
    };
  }
}

export async function runAgenticDemoAPI(
  action: "all" | "agent_run" | "commerce" | "generate" | "workflow",
  inputs?: Record<string, unknown>,
) {
  try {
    const res = await fetch("/api/agentic/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, inputs }),
    });
    if (!res.ok) throw new Error(`Demo action ${action} failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`AgenticOrg demo call (${action}) error:`, err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function sendDirectAgentChat(message: string): Promise<{
  success: boolean;
  status?: string;
  confidence?: number;
  output?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return await res.json();
  } catch (err) {
    console.error("Direct chat error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}


