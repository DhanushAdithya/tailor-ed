import type { ConceptNode, GraphEdge } from "@/domain/types";

export interface GraphUpdateResult {
  newNodes: ConceptNode[];
  newEdges: GraphEdge[];
  newPositions: Record<string, { x: number; y: number }>;
  updatedExistingNodes: ConceptNode[];
  summaryMessage: string;
}

function cleanTitle(raw: string, maxLen = 26): string {
  let cleaned = raw
    .replace(/^[-*•\d.)\s]+/, "") // remove bullets, numbers
    .replace(/^(help you|i can help you|to|how to)\s+/i, "")
    .trim();
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen - 1).trim() + "…";
  }
  // Capitalize first letter of each word if all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return cleaned || "Learning Concept";
}

function createCodename(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
  return `tutor · ${slug || "concept"}`;
}

/**
 * Parses user queries and AI tutor responses to extract concept candidates,
 * updates mastery of existing nodes, and spawns new connected graph nodes.
 */
export function extractGraphUpdateFromInteraction(
  userQuery: string,
  aiText: string,
  existingNodes: ConceptNode[],
  existingPositions: Record<string, { x: number; y: number }>,
): GraphUpdateResult {
  const lowerQuery = userQuery.toLowerCase();
  const lowerAi = aiText.toLowerCase();

  // 1. Check if existing nodes are mentioned in query or AI response to update mastery
  const updatedExistingNodes = existingNodes.map((node) => {
    const labelLower = node.label.toLowerCase();
    const idLower = node.id.toLowerCase();
    const isMentioned = lowerQuery.includes(labelLower) || lowerAi.includes(labelLower) || lowerQuery.includes(idLower);

    if (isMentioned && node.mastery < 1) {
      const nextMastery = Math.min(1, Math.round((node.mastery + 0.15) * 100) / 100);
      return {
        ...node,
        mastery: nextMastery,
        familiarity: (nextMastery >= 0.85 ? "mastered" : "emerging") as "mastered" | "emerging",
      };
    }
    return node;
  });

  // 2. Extract concept candidates from bullet points, numbered items, or sentences
  const candidateLines: Array<{ title: string; blurb: string }> = [];

  // Match bullet points or numbered lists
  const listMatches = aiText.match(/^[-*•\d.)]\s+([^\n]+)/gm);
  if (listMatches && listMatches.length > 0) {
    listMatches.slice(0, 4).forEach((line) => {
      const text = line.replace(/^[-*•\d.)]\s+/, "").trim();
      if (text.length > 3) {
        candidateLines.push({
          title: cleanTitle(text),
          blurb: text,
        });
      }
    });
  }

  // If no bullet points found, extract sentences or topic keywords
  if (candidateLines.length === 0) {
    // Extract user target topic if it has substance
    const strippedQuery = userQuery
      .replace(/^(hi|hello|hey|help me with|teach me|explain|what is|how does)\s+/i, "")
      .trim();

    if (strippedQuery.length > 2 && strippedQuery.length < 40) {
      candidateLines.push({
        title: cleanTitle(strippedQuery),
        blurb: `Topic inquiry: ${userQuery}`,
      });
    }

    // Extract first 2 informative sentences from AI response
    const sentences = aiText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && s.length < 120 && !s.includes("?"));

    sentences.slice(0, 2).forEach((s) => {
      candidateLines.push({
        title: cleanTitle(s),
        blurb: s,
      });
    });
  }

  // 3. Filter out concepts that are already identical to existing nodes
  const newCandidateItems = candidateLines.filter((cand) => {
    const candLower = cand.title.toLowerCase();
    return !existingNodes.some(
      (node) => node.label.toLowerCase() === candLower || candLower.includes(node.label.toLowerCase()),
    );
  });

  // Find a solid mastered anchor node to wire the new concepts to
  const anchorNode =
    updatedExistingNodes.find((n) => n.mastery >= 0.8) ??
    updatedExistingNodes[0] ?? { id: "eventloop", label: "Core Foundation" };

  const anchorPos = existingPositions[anchorNode.id] ?? { x: 0.5, y: 0.5 };

  const newNodes: ConceptNode[] = [];
  const newEdges: GraphEdge[] = [];
  const newPositions: Record<string, { x: number; y: number }> = {};

  const timestamp = Date.now().toString(36).slice(-4);

  newCandidateItems.forEach((cand, idx) => {
    const id = `concept-tutor-${timestamp}-${idx}`;
    const prevNodeId = idx === 0 ? anchorNode.id : newNodes[idx - 1].id;

    newNodes.push({
      id,
      label: cand.title,
      codename: createCodename(cand.title),
      tier: Math.min(8, 4 + idx),
      familiarity: "emerging",
      mastery: 0.25,
      blurb: cand.blurb,
      prereqIds: [prevNodeId],
    });

    newEdges.push({
      id: `edge-${timestamp}-${idx}`,
      source: prevNodeId,
      target: id,
      relation: idx === 0 ? "analogous_to" : "prerequisite_for",
    });

    // Compute distinct non-overlapping placement on canvas (bottom/side arc)
    const angle = (idx / Math.max(1, newCandidateItems.length)) * Math.PI * 0.7 - Math.PI * 0.35;
    const radius = 0.22 + (idx % 2) * 0.08;
    const targetX = Math.max(0.12, Math.min(0.88, anchorPos.x + Math.sin(angle) * radius));
    const targetY = Math.max(0.15, Math.min(0.88, anchorPos.y + Math.cos(angle) * radius));

    newPositions[id] = {
      x: Math.round(targetX * 100) / 100,
      y: Math.round(targetY * 100) / 100,
    };
  });

  const count = newNodes.length;
  const summaryMessage =
    count > 0
      ? `Mental model updated: +${count} concept node${count > 1 ? "s" : ""} wired from tutor response.`
      : "Mental model updated: reinforcement signals recorded for mentioned concepts.";

  return {
    newNodes,
    newEdges,
    newPositions,
    updatedExistingNodes,
    summaryMessage,
  };
}
