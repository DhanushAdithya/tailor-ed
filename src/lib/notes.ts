import type { ConceptNode, GraphEdge } from "@/domain/types";
import { INITIAL_POSITIONS, NOTE_SEEDS } from "@/domain/data";

export interface IngestedFragment {
  nodes: ConceptNode[];
  edges: GraphEdge[];
  positions: Record<string, { x: number; y: number }>;
  summary: string;
}

function placeNextTo(factoryIndex: number, count: number): { x: number; y: number } {
  const anchor =
    INITIAL_POSITIONS.eventloop ?? { x: 0.5, y: 0.5 };
  return {
    x: 0.14 + (factoryIndex % 4) * 0.17,
    y: Math.min(0.94, anchor.y + 0.16 + Math.floor(factoryIndex / 4) * 0.18 + count * 0.02),
  };
}

/**
 * Deterministic client-side stand-in for concept extraction: routes the raw
 * note text against seed patterns, otherwise spawns a generic fragment node
 * wired to the user's mastered corpus. Slot keeps repeated ingests collision-free.
 */
export function extractFromNotes(text: string, slot: number): IngestedFragment {
  const query = text.toLowerCase();
  const matched =
    NOTE_SEEDS.filter((seed) => seed.keys.some((key) => query.includes(key))) ||
    [];
  const summary = text.trim().slice(0, 42) || "Untitled fragment";

  const chosen =
    matched.length > 0
      ? matched.map((seed) => ({
          anchorId: seed.anchorId,
          relation: seed.relation,
          id: seed.node.id,
          label: seed.node.label,
          codename: seed.node.codename,
          tier: seed.node.tier,
          blurb: seed.node.blurb,
          prereqIds: seed.node.prereqIds,
        }))
      : [
          {
            anchorId: "eventloop",
            relation: "analogous_to" as const,
            id: "fragment",
            label: summary,
            codename: "ingest · fragment",
            tier: 6,
            blurb:
              "Freshly ingested note fragment awaiting concept extraction and grounding checks.",
            prereqIds: [],
          },
        ];

  const nodes: ConceptNode[] = [];
  const edges: GraphEdge[] = [];
  const positions: Record<string, { x: number; y: number }> = {};

  chosen.forEach((seed, offset) => {
    const id = `${seed.id}-${slot}`;
    nodes.push({
      id,
      label: seed.label,
      codename: seed.codename,
      tier: seed.tier,
      familiarity: "uncharted",
      mastery: 0,
      blurb: seed.blurb,
      prereqIds: seed.prereqIds,
    });
    edges.push({
      id: `ingest-${slot}-${offset}`,
      source: seed.anchorId,
      target: id,
      relation: seed.relation,
    });
    positions[id] = placeNextTo(slot * 2 + offset, offset);
  });

  return { nodes, edges, positions, summary };
}
