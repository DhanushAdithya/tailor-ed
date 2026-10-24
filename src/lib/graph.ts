import type {
  ConceptNode,
  Familiarity,
  GraphEdge,
  MilestoneStatus,
  Relation,
  RoadmapStep,
  Track,
} from "@/domain/types";

export interface StepStatus {
  status: MilestoneStatus;
  progress: number; // 0..100
}

export interface Gate {
  mode: "blocked" | "open" | "override";
  missing: ConceptNode[];
}

export function indexNodes(nodes: ConceptNode[]): Record<string, ConceptNode> {
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

export function indexEdges(edges: GraphEdge[]): Record<string, GraphEdge> {
  return Object.fromEntries(edges.map((edge) => [edge.id, edge]));
}

/** All structural relationships are traversable both ways for path planning. */
export function adjacency(edges: GraphEdge[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  const push = (a: string, b: string) => {
    const list = map.get(a) ?? new Set<string>();
    list.add(b);
    map.set(a, list);
  };
  for (const edge of edges) {
    push(edge.source, edge.target);
    push(edge.target, edge.source);
  }
  return map;
}

export function edgeBetween(a: string, b: string, edges: GraphEdge[]) {
  return edges.find(
    (edge) =>
      (edge.source === a && edge.target === b) ||
      (edge.source === b && edge.target === a),
  );
}

/**
 * Shortest conceptual path from any mastered anchor node to the target,
 * traced over the undirected structural graph.
 */
export function shortestPathToTarget(
  nodes: ConceptNode[],
  edges: GraphEdge[],
  targetId: string,
): string[] | null {
  const byId = indexNodes(nodes);
  if (byId[targetId]?.mastery >= 1) return [targetId];
  const anchors = nodes.filter((node) => node.mastery >= 1);
  if (anchors.length === 0) return null;
  const next = adjacency(edges);
  const parents = new Map<string, string>();
  const visited = new Set(anchors.map((anchor) => anchor.id));
  const queue = [...visited];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const neighbor of next.get(current) ?? []) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parents.set(neighbor, current);
      if (neighbor === targetId) {
        const path: string[] = [];
        let cursor: string | undefined = neighbor;
        while (cursor !== undefined) {
          path.unshift(cursor);
          cursor = parents.get(cursor);
        }
        return path;
      }
      queue.push(neighbor);
    }
  }
  return null;
}

export function unmetPrerequisites(
  node: ConceptNode,
  byId: Record<string, ConceptNode>,
): ConceptNode[] {
  return node.prereqIds
    .map((id) => byId[id])
    .filter((prereq) => prereq && prereq.mastery < 1);
}

export function prerequisiteGate(
  node: ConceptNode,
  byId: Record<string, ConceptNode>,
  overrides: Set<string>,
): Gate {
  const missing = unmetPrerequisites(node, byId);
  const mode: Gate["mode"] = overrides.has(node.id)
    ? "override"
    : missing.length > 0
      ? "blocked"
      : "open";
  return { mode, missing };
}

export function familiarityOf(node: ConceptNode): Familiarity {
  if (node.mastery >= 1) return "mastered";
  if (node.mastery > 0) return "emerging";
  return "uncharted";
}

/** Roadmap strip status, derived from live mastery signals. */
export function deriveStepStatus(
  step: RoadmapStep,
  byId: Record<string, ConceptNode>,
  steps: RoadmapStep[],
): StepStatus {
  const mastered = step.conceptIds.every(
    (id) => (byId[id]?.mastery ?? 0) >= 1,
  );
  if (mastered) return { status: "mastered", progress: 100 };
  const avg = Math.round(
    (step.conceptIds.reduce((sum, id) => sum + (byId[id]?.mastery ?? 0), 0) /
      step.conceptIds.length) *
      100,
  );
  if (step.seedStatus === "mastered") {
    return { status: "current", progress: avg };
  }
  const position = steps.findIndex((candidate) => candidate.index === step.index);
  const previousAllMastered = steps
    .slice(0, position)
    .every((candidate) =>
      candidate.conceptIds.every((id) => (byId[id]?.mastery ?? 0) >= 1),
    );
  if (previousAllMastered && step.seedStatus === "next") {
    return { status: "current", progress: avg };
  }
  return { status: step.seedStatus, progress: avg };
}

export function familiarityLabel(familiarity: Familiarity): string {
  switch (familiarity) {
    case "mastered":
      return "Mastered";
    case "emerging":
      return "Emerging";
    default:
      return "Uncharted";
  }
}

export interface RelationMeta {
  label: string;
  color: string;
  dash: string | undefined;
}

export function relationMeta(relation: Relation): RelationMeta {
  switch (relation) {
    case "prerequisite_for":
      return { label: "prerequisite_for", color: "#6366f1", dash: "2.4 1.6" };
    case "analogous_to":
      return { label: "analogous_to", color: "#38bdf8", dash: "0.6 1.4" };
    case "implements":
      return { label: "implements", color: "#10b981", dash: undefined };
    default:
      return { label: "subsystem_of", color: "#9aa0a8", dash: undefined };
  }
}

/** Chat keyword router for the bridging command box. */
export function routeConceptFromQuery(
  query: string,
  keywords: { conceptId: string; keywords: string[] }[],
): string | null {
  const text = query.toLowerCase();
  for (const entry of keywords) {
    if (entry.keywords.some((keyword) => text.includes(keyword))) {
      return entry.conceptId;
    }
  }
  return null;
}

export function trackStatusLabel(track: Track): string {
  if (track.status === "active") {
    return `${track.progress}% · ${track.milestonesDone}/${track.milestonesTotal} milestones`;
  }
  return `${track.progress}% complete`;
}
