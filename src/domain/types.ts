/**
 * Domain vocabulary for Tailor Ed.
 * Terms follow AGENTS.md — keep names consistent in code, UI copy, and docs.
 */

export type Relation =
  | "prerequisite_for"
  | "subsystem_of"
  | "analogous_to"
  | "implements";

export type Familiarity = "mastered" | "emerging" | "uncharted";

export type BarMode = "chat" | "notes";

export interface AnalogyMapping {
  /** A mechanic inside the anchor concept the user mastered. */
  from: string;
  /** The corresponding mechanic inside the target concept. */
  to: string;
  /** How the transfer works, phrased against the user's own corpus. */
  note: string;
}

export interface ConceptAnalogy {
  anchorId: string;
  anchorTitle: string;
  anchorSource: string;
  targetTitle: string;
  targetSource: string;
  summary: string;
  mapping: AnalogyMapping[];
  delta: { title: string; body: string }[];
}

export interface ConceptNode {
  id: string;
  label: string;
  /** Mono-rendered technical identifier shown across the UI. */
  codename: string;
  tier: number;
  familiarity: Familiarity;
  mastery: number; // 0..1 — the mastery signal aggregate
  blurb: string;
  prereqIds: string[];
  /** Off-roadmap nodes are ingested fragments, not rail milestones. */
  analogy?: ConceptAnalogy;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation: Relation;
}

export type MilestoneStatus = "mastered" | "current" | "next" | "locked";

export interface RoadmapStep {
  index: number;
  title: string;
  subtitle: string;
  conceptIds: string[];
  seedStatus: MilestoneStatus;
}

export interface Track {
  id: string;
  name: string;
  domain: string;
  domainCodename: string;
  progress: number;
  milestonesDone: number;
  milestonesTotal: number;
  status: "active" | "idle";
  /** true once the track has a seeded roadmap + graph in this prototype. */
  ready: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
}

export type ScaffoldMode = "empty" | "blocked" | "open" | "override";
