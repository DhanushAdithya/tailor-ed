"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BarMode, ConceptNode, GraphEdge, UserProfile } from "@/domain/types";
import {
  BRIDGE_KEYWORDS,
  CONCEPT_EDGES,
  CONCEPT_NODES,
  INITIAL_POSITIONS,
  ROADMAP_STEPS,
  TRACKS,
} from "@/domain/data";
import {
  deriveStepStatus,
  indexNodes,
  prerequisiteGate,
  routeConceptFromQuery,
  shortestPathToTarget,
} from "@/lib/graph";
import { extractFromNotes } from "@/lib/notes";
import {
  extractConceptsAPI,
  generateScaffoldAPI,
  runAgenticDemoAPI,
  sendDirectAgentChat,
} from "@/lib/api-client";
import { extractGraphUpdateFromInteraction } from "@/lib/graph-updater";
import { AuthHero } from "./AuthHero";
import { Header, type SessionStatus } from "./Header";
import { InteractionBar } from "./InteractionBar";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { RoadmapRail } from "./RoadmapRail";
import { ScaffoldDrawer, type AgentOutputData } from "./ScaffoldDrawer";
import { TrackOverview } from "./TrackOverview";
import { OnboardingWizard, type OnboardingPlanData } from "./OnboardingWizard";
import { NotesModal, type ArchivedNote } from "./NotesModal";

const SESSION_SEQUENCE: SessionStatus[] = ["Connected", "Listening", "Standby"];

const INITIAL_NOTES: ArchivedNote[] = [
  {
    id: "note-seed-1",
    title: "System Design & Distributed Systems Roadmap",
    createdAt: "Starter Plan",
    category: "Technical Interview Prep",
    targetGoal: "SDE II / III System Design",
    timeline: "1-month",
    dailyPace: "45 mins/day",
    content: `### 🎯 Targeted Milestones
- **Reliability & Distributed Fallacies**: Latency is non-zero; network partitions are guaranteed.
- **Write-Ahead Logging (WAL)**: Append-only disk persistence before in-memory mutations.
- **Consensus Algorithms (Raft/Paxos)**: Quorum-based leader election and replicated state machines.
- **Consistent Hashing & Partitioning**: Virtual nodes minimizing key remap overhead.
- **Fault-Tolerant Cache Invalidation**: Write-through vs Write-around vs Cache-aside patterns.

### 📌 Knowledge Gap Analysis
- Identified strong foundation in single-threaded event loops (Node.js/Python).
- Need conceptual bridge from synchronous event-driven I/O to multi-leader asynchronous distributed coordination.`,
  },
];

function pct(mastery: number) {
  return `${Math.round(mastery * 100)}%`;
}

export function AppShell() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [nodes, setNodes] = useState<ConceptNode[]>(CONCEPT_NODES);
  const [edges, setEdges] = useState<GraphEdge[]>(CONCEPT_EDGES);
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tracePath, setTracePath] = useState<string[] | null>(null);
  const [focusTierIds, setFocusTierIds] = useState<Set<string> | null>(null);
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [activeTrackId, setActiveTrackId] = useState("ds");
  const [view, setView] = useState<"overview" | "engine">("overview");
  const [railOpen, setRailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [barMode, setBarMode] = useState<BarMode>("chat");
  const [ingestPing, setIngestPing] = useState(0);
  const [situation, setSituation] = useState<string | null>(null);
  const [ingestion, setIngestion] = useState<Set<string> | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("Connected");
  const [agentOutput, setAgentOutput] = useState<AgentOutputData | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isPlaceholderConfig, setIsPlaceholderConfig] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [savedNotes, setSavedNotes] = useState<ArchivedNote[]>(INITIAL_NOTES);

  const byId = useMemo(() => indexNodes(nodes), [nodes]);
  const ingestCount = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined") {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        if (params.has("code") || (params.has("error") && params.has("state"))) {
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/api/auth/google/callback${search}`);
          return;
        }
      }
    }

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: { user: UserProfile | null; isPlaceholderConfig: boolean }) => {
        if (!isMounted) return;
        setIsPlaceholderConfig(data.isPlaceholderConfig);
        if (data.user) {
          setUser(data.user);
          if (typeof window !== "undefined") {
            const hasOnboarded = localStorage.getItem("tailored_onboarded");
            if (!hasOnboarded) {
              setShowOnboarding(true);
            }
          }
        }
      })
      .catch((err) => {
        console.error("Session check failed:", err);
      })
      .finally(() => {
        if (isMounted) setIsCheckingSession(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSessionStatus((current) => {
        const index = SESSION_SEQUENCE.indexOf(current);
        return SESSION_SEQUENCE[(index + 1) % SESSION_SEQUENCE.length];
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("tailored_study_notes");
        if (stored) {
          setSavedNotes(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load notes from localStorage:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && savedNotes.length > 0) {
      try {
        localStorage.setItem("tailored_study_notes", JSON.stringify(savedNotes));
      } catch (err) {
        console.error("Failed to save notes to localStorage:", err);
      }
    }
  }, [savedNotes]);

  useEffect(
    () => () => {
      for (const id of timers.current) window.clearTimeout(id);
    },
    [],
  );

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const announce = (message: string) => setSituation(message);

  /* ------------------------------------------------------------------ */

  const selectConcept = (id: string, options?: { backToTracks?: boolean }) => {
    const node = indexNodes(nodes)[id];
    if (!node) return;
    setSelectedId(id);
    setTracePath(shortestPathToTarget(nodes, edges, id));
    setFocusTierIds(null);
    if (options?.backToTracks) setView("overview");
    else setView("engine");
    setDrawerOpen(true);
  };

  const jumpToPrerequisite = (id: string) => {
    selectConcept(id);
    announce(`Redirected → ${byId[id]?.label} · mastery signal ${pct(byId[id]?.mastery ?? 0)}`);
  };

  const overrideBridge = (id: string) => {
    setOverrides((current) => new Set(current).add(id));
    announce(`Override accepted — bridging ${byId[id]?.label} past unmet signals.`);
  };

  const bridgeAndCommit = (id: string) => {
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== id) return node;
        const mastery = Math.min(1, node.mastery + 0.25);
        return {
          ...node,
          mastery,
          familiarity: mastery >= 1 ? "mastered" : "emerging",
        };
      }),
    );
    const node = byId[id];
    if (!node) return;
    const next = Math.min(1, node.mastery + 0.25);
    setOverrides((current) => {
      const updated = new Set(current);
      updated.delete(id);
      return updated;
    });
    announce(
      next >= 1
        ? `${node.label} locked in as a mastered anchor — the graph re-anchors future bridges on it.`
        : `Mastery signal recorded for ${node.label} → ${pct(next)}. Scaffold again to complete it.`,
    );
  };

  const clearFocus = () => {
    setFocusTierIds(null);
    announce("Focus cleared — full concept map restored.");
  };

  const moveNode = (id: string, x: number, y: number) => {
    setPositions((current) => ({ ...current, [id]: { x, y } }));
  };

  const railStepClick = (step: { index: number; title: string; conceptIds: string[] }) => {
    setView("engine");
    setRailOpen(false);
    setFocusTierIds(new Set(step.conceptIds));
    setSituation(`Tier focus → ${step.title} · ${step.conceptIds.length} concept(s) lit up.`);
  };

  const selectTrack = (trackId: string) => {
    setActiveTrackId(trackId);
    const track = TRACKS.find((candidate) => candidate.id === trackId);
    if (track) announce(`Active track → ${track.name} · roadmap locked in.`);
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Sign out error:", err);
    }
    setUser(null);
    setView("overview");
    setSelectedId(null);
    setTracePath(null);
    setFocusTierIds(null);
    setIngestion(null);
    setSituation(null);
    setBarMode("chat");
  };

  const handleGoogleSignIn = () => {
    // Navigate via browser to trigger server-side OAuth redirect flow
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`${window.location.origin}/api/auth/google`);
  };

  const handlePlaceholderSignIn = async () => {
    try {
      const res = await fetch("/api/auth/placeholder-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Google Account (Placeholder)",
          email: "explorer.demo@gmail.com",
        }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        announce("Signed in successfully — Welcome to TailorEd!");
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error("Placeholder sign in error:", err);
    }
  };

  const handleOnboardingComplete = (planData: OnboardingPlanData) => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("tailored_onboarded", "true");
    }

    const categoryInfo = {
      interview: {
        title: "Technical Interview Prep",
        milestoneList: [
          {
            id: "dist_fallacies",
            label: "Distributed Fallacies & Failure Modes",
            codename: "DIST_FALLACIES",
            blurb: "Network partitions, latency jitter, and asynchronous unreliability.",
            tier: 1,
            mastery: planData.baseline === "beginner" ? 0.35 : planData.baseline === "intermediate" ? 0.6 : 0.85,
            familiarity: (planData.baseline === "beginner" ? "emerging" : "mastered") as "emerging" | "mastered",
            prereqIds: ["concurrency"],
          },
          {
            id: "wal_engine",
            label: "Write-Ahead Logs & Storage Internals",
            codename: "WAL_STORAGE",
            blurb: "Append-only sequential disk writes protecting volatile in-memory state.",
            tier: 2,
            mastery: planData.baseline === "beginner" ? 0.15 : planData.baseline === "intermediate" ? 0.45 : 0.7,
            familiarity: (planData.baseline === "advanced" ? "mastered" : "emerging") as "emerging" | "mastered",
            prereqIds: ["dist_fallacies"],
          },
          {
            id: "consensus_raft",
            label: "Quorum Consensus & Raft Elections",
            codename: "RAFT_CONSENSUS",
            blurb: "Leader leases, log replication, terms, and split-brain resolution.",
            tier: 3,
            mastery: planData.baseline === "beginner" ? 0.05 : planData.baseline === "intermediate" ? 0.25 : 0.5,
            familiarity: "emerging" as const,
            prereqIds: ["wal_engine"],
          },
          {
            id: "sharding_hash",
            label: "Consistent Hashing & Ring Partitioning",
            codename: "CONSISTENT_HASH",
            blurb: "Virtual token distributions avoiding whole-cluster key remapping upon node failures.",
            tier: 4,
            mastery: 0.1,
            familiarity: "uncharted" as const,
            prereqIds: ["consensus_raft"],
          },
          {
            id: "ha_arch",
            label: "High-Availability Architecture & Circuit Breaking",
            codename: "HA_SYSTEM_ARCH",
            blurb: "Degraded fallback modes, bulkhead isolation, and rate-limiting envelopes.",
            tier: 5,
            mastery: 0.0,
            familiarity: "uncharted" as const,
            prereqIds: ["sharding_hash"],
          },
        ],
      },
      exam: {
        title: "Competitive Exam Preparation",
        milestoneList: [
          {
            id: "algo_bounds",
            label: "Discrete Foundations & Asymptotics",
            codename: "ALGO_BOUNDS",
            blurb: "Recurrence relations, master theorem, and state-space complexity bounds.",
            tier: 1,
            mastery: planData.baseline === "beginner" ? 0.4 : planData.baseline === "intermediate" ? 0.65 : 0.85,
            familiarity: "mastered" as const,
            prereqIds: ["concurrency"],
          },
          {
            id: "sync_primitives",
            label: "Process Synchronization & Semaphores",
            codename: "SYNC_PRIMITIVES",
            blurb: "Critical sections, Dekker's algorithm, mutexes, and deadlock conditions.",
            tier: 2,
            mastery: planData.baseline === "beginner" ? 0.2 : 0.45,
            familiarity: "emerging" as const,
            prereqIds: ["algo_bounds"],
          },
          {
            id: "vm_paging",
            label: "Virtual Memory Hierarchy & Paging",
            codename: "VM_PAGING",
            blurb: "Page tables, TLB hits/misses, inverted tables, and working set models.",
            tier: 3,
            mastery: 0.15,
            familiarity: "emerging" as const,
            prereqIds: ["sync_primitives"],
          },
          {
            id: "db_serializability",
            label: "ACID Serializability & 2-Phase Locking",
            codename: "DB_SERIALIZABILITY",
            blurb: "Conflict vs view serializability, recoverable schedules, and cascading aborts.",
            tier: 4,
            mastery: 0.05,
            familiarity: "uncharted" as const,
            prereqIds: ["vm_paging"],
          },
          {
            id: "mock_diagnostic",
            label: "Diagnostic Mock Checkpoints & Synthesis",
            codename: "MOCK_DIAGNOSTIC",
            blurb: "Timed exam questions, error categorization, and rapid retrieval drills.",
            tier: 5,
            mastery: 0.0,
            familiarity: "uncharted" as const,
            prereqIds: ["db_serializability"],
          },
        ],
      },
      general: {
        title: "General Tech & AI Knowledge",
        milestoneList: [
          {
            id: "transformer_attn",
            label: "Attention Mechanisms & Token Embeddings",
            codename: "TRANSFORMER_ATTN",
            blurb: "Scaled dot-product attention, query-key-value projections, and positional encodings.",
            tier: 1,
            mastery: planData.baseline === "beginner" ? 0.4 : 0.7,
            familiarity: "mastered" as const,
            prereqIds: ["eventloop"],
          },
          {
            id: "vector_hnsw",
            label: "Vector Indexing & HNSW Proximity Graphs",
            codename: "VECTOR_HNSW",
            blurb: "Hierarchical navigable small world graphs and approximate nearest neighbor search.",
            tier: 2,
            mastery: 0.3,
            familiarity: "emerging" as const,
            prereqIds: ["transformer_attn"],
          },
          {
            id: "rag_grounding",
            label: "Context Chunking & Grounded Retrieval",
            codename: "RAG_GROUNDING",
            blurb: "Semantic chunk boundaries, hybrid BM25 + dense re-ranking, and context hallucination bounds.",
            tier: 3,
            mastery: 0.2,
            familiarity: "emerging" as const,
            prereqIds: ["vector_hnsw"],
          },
          {
            id: "agentic_routing",
            label: "Agentic Tool Routing & ReAct Loops",
            codename: "AGENTIC_ROUTING",
            blurb: "Chain-of-thought, tool schema resolution, iterative execution, and fallback strategies.",
            tier: 4,
            mastery: 0.1,
            familiarity: "uncharted" as const,
            prereqIds: ["rag_grounding"],
          },
          {
            id: "prod_eval_guardrails",
            label: "Production Evaluation & Safe Guardrails",
            codename: "PROD_EVAL_GUARDRAILS",
            blurb: "Deterministic test suites, prompt injection mitigation, and telemetry monitors.",
            tier: 5,
            mastery: 0.0,
            familiarity: "uncharted" as const,
            prereqIds: ["agentic_routing"],
          },
        ],
      },
      other: {
        title: "Custom Learning Track",
        milestoneList: [
          {
            id: "custom_foundations",
            label: `${planData.targetGoal} Foundations`,
            codename: "CORE_FOUNDATIONS",
            blurb: `Core principles, essential terminology, and key concepts in ${planData.targetGoal}.`,
            tier: 1,
            mastery: planData.baseline === "beginner" ? 0.35 : 0.65,
            familiarity: (planData.baseline === "beginner" ? "emerging" : "mastered") as "emerging" | "mastered",
            prereqIds: ["concurrency"],
          },
          {
            id: "custom_arch",
            label: "Architecture & Design Patterns",
            codename: "CORE_PATTERNS",
            blurb: "Key building blocks, best practices, and standard structural patterns.",
            tier: 2,
            mastery: 0.3,
            familiarity: "emerging" as const,
            prereqIds: ["custom_foundations"],
          },
          {
            id: "custom_practical",
            label: "Hands-on Practical Build",
            codename: "PRACTICAL_BUILD",
            blurb: "Applying concepts to build practical solutions and real-world tools.",
            tier: 3,
            mastery: 0.15,
            familiarity: "emerging" as const,
            prereqIds: ["custom_arch"],
          },
          {
            id: "custom_advanced",
            label: "Advanced Problem Solving & Edge Cases",
            codename: "ADVANCED_EDGE_CASES",
            blurb: "Handling complex scenarios, scalability, optimization, and debugging.",
            tier: 4,
            mastery: 0.05,
            familiarity: "uncharted" as const,
            prereqIds: ["custom_practical"],
          },
          {
            id: "custom_synthesis",
            label: "Review, Practice & Final Assessment",
            codename: "REVIEW_SYNTHESIS",
            blurb: "End-to-end knowledge check, diagnostic practice, and conceptual mastery.",
            tier: 5,
            mastery: 0.0,
            familiarity: "uncharted" as const,
            prereqIds: ["custom_advanced"],
          },
        ],
      },
    };

    const targetCategory = categoryInfo[planData.category] || categoryInfo.interview;
    const newMilestones: ConceptNode[] = targetCategory.milestoneList;

    const newEdges: GraphEdge[] = [
      {
        id: `edge-${newMilestones[0].prereqIds[0]}-${newMilestones[0].id}`,
        source: newMilestones[0].prereqIds[0],
        target: newMilestones[0].id,
        relation: "prerequisite_for",
      },
      ...newMilestones.slice(1).map((m, idx) => ({
        id: `edge-${newMilestones[idx].id}-${m.id}`,
        source: newMilestones[idx].id,
        target: m.id,
        relation: "prerequisite_for" as const,
      })),
    ];

    const newPositions: Record<string, { x: number; y: number }> = {};
    newMilestones.forEach((m, idx) => {
      newPositions[m.id] = {
        x: 0.22 + idx * 0.14,
        y: 0.42 + (idx % 2 === 0 ? 0.08 : -0.06),
      };
    });

    const studyPlanNote: ArchivedNote = {
      id: `plan-${Date.now()}`,
      title: `${targetCategory.title}: ${planData.targetGoal}`,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      category: targetCategory.title,
      targetGoal: planData.targetGoal,
      timeline: planData.timeline,
      dailyPace: planData.dailyPace,
      content: `### 🎯 Study Roadmap: ${planData.targetGoal}

**Track**: ${targetCategory.title}
**Starting Baseline**: ${planData.baseline.toUpperCase()}
**Timeline**: ${planData.timeline} | **Daily Study Time**: ${planData.dailyPace}

---

### 🗺️ Planned Milestones & Concepts
${newMilestones
  .map(
    (m, idx) =>
      `${idx + 1}. **${m.label}**\n   - *Overview*: ${m.blurb}\n   - *Starting Level*: ${Math.round(m.mastery * 100)}% (${m.familiarity})`
  )
  .join("\n\n")}

---

### 💡 How to Study This Track
- **Step-by-Step Learning**: Follow the path on your concept map. Each topic builds directly on the previous one.
- **Ask Your AI Tutor**: Use the bottom chat bar anytime to ask questions, get simple analogies, or test your understanding.
- **Track Progress**: As you understand concepts, click "Mark Understood" in the guide to unlock the next milestone.
${planData.customNotes ? `\n### 📝 Notes\n${planData.customNotes}` : ""}`,
    };

    setSavedNotes((prev) => [studyPlanNote, ...prev]);

    setNodes((current) => {
      const existingIds = new Set(current.map((n) => n.id));
      const filtered = newMilestones.filter((n) => !existingIds.has(n.id));
      return [...current, ...filtered];
    });

    setEdges((current) => {
      const existingIds = new Set(current.map((e) => e.id));
      const filtered = newEdges.filter((e) => !existingIds.has(e.id));
      return [...current, ...filtered];
    });

    setPositions((current) => ({ ...current, ...newPositions }));

    setView("engine");
    const firstNodeId = newMilestones[0].id;
    setSelectedId(firstNodeId);
    setTracePath(shortestPathToTarget([...nodes, ...newMilestones], [...edges, ...newEdges], firstNodeId));
    setDrawerOpen(true);

    announce(
      `🎯 Learning roadmap created for “${planData.targetGoal}”! Topic “${newMilestones[0].label}” ready to explore.`
    );
  };

  const handleSaveToNotes = ({
    title,
    content,
    category,
  }: {
    title: string;
    content: string;
    category?: string;
  }) => {
    const newNote: ArchivedNote = {
      id: `ai-note-${Date.now()}`,
      title,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      category: category || "AI Scaffolding",
      targetGoal: "Epistemic Retention",
      timeline: "Reference",
      dailyPace: "Review as needed",
      content,
    };
    setSavedNotes((prev) => [newNote, ...prev]);
    announce(`Saved “${title}” to Study Notes.`);
  };

  /* quick actions ---------------------------------------------------- */

  const resumeTrack = () => {
    setView("engine");
    const step =
      ROADMAP_STEPS.find(
        (candidate) => deriveStepStatus(candidate, byId, ROADMAP_STEPS).status === "current",
      ) ?? ROADMAP_STEPS[2];
    const headId = step.conceptIds[0];
    if (headId) {
      setSelectedId(headId);
      setTracePath(shortestPathToTarget(nodes, edges, headId));
      setDrawerOpen(true);
      setFocusTierIds(new Set(step.conceptIds));
      announce(
        `Resumed ${step.title} · mastery ${pct(byId[headId]?.mastery ?? 0)} — conceptual path illuminated.`,
      );
    }
  };

  const inspectGraph = () => {
    setView("engine");
    setTracePath(null);
    setFocusTierIds(null);
    setSelectedId(null);
    setDrawerOpen(false);
    announce(
      `Inspecting mental model graph · ${nodes.length} concept nodes · ${edges.length} structural edges.`,
    );
  };

  const ingestNotesAction = () => {
    setBarMode("notes");
    setIngestPing((value) => value + 1);
    announce("Note ingestion armed — drop your raw thinking below.");
  };

  /* bottom bar -------------------------------------------------------- */

  const chatSubmit = async (text: string) => {
    announce(`Agent running with prompt: “${text.slice(0, 36)}”…`);
    try {
      const res = await sendDirectAgentChat(text);
      if (res.success && res.output) {
        const out = res.output;
        const answer =
          (typeof res.raw_output === "string" && res.raw_output) ||
          (typeof out.raw_output === "string" && (out.raw_output as string)) ||
          (typeof out.response === "string" && out.response) ||
          (typeof out.reply === "string" && out.reply) ||
          (typeof out.text === "string" && out.text) ||
          (typeof out.message === "string" && out.message) ||
          (typeof out.answer === "string" && out.answer) ||
          (typeof out.result === "string" && out.result) ||
          JSON.stringify(out, null, 2);

        setAgentOutput({
          prompt: text,
          rawText: answer,
          status: res.status ?? "completed",
          confidence: res.confidence,
          output: out,
        });
        setView("engine");
        setDrawerOpen(true);

        // Dynamically update the Mental Model Graph based on the user query & AI response
        const graphUpdate = extractGraphUpdateFromInteraction(text, answer, nodes, positions);

        if (graphUpdate.newNodes.length > 0) {
          const combinedNodes = [...graphUpdate.updatedExistingNodes, ...graphUpdate.newNodes];
          const combinedEdges = [...edges, ...graphUpdate.newEdges];
          setNodes(combinedNodes);
          setEdges(combinedEdges);
          setPositions((curr) => ({ ...curr, ...graphUpdate.newPositions }));
          setIngestion(new Set(graphUpdate.newNodes.map((n) => n.id)));
          later(() => setIngestion(null), 3500);

          const headNewId = graphUpdate.newNodes[0]?.id;
          if (headNewId) {
            setSelectedId(headNewId);
            setTracePath(shortestPathToTarget(combinedNodes, combinedEdges, headNewId));
          }
        } else {
          setNodes(graphUpdate.updatedExistingNodes);
        }

        announce(graphUpdate.summaryMessage);
      } else {
        announce(`Agent returned: ${res.error || "No response"}`);
      }
    } catch (err) {
      announce(`Agent error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const notesSubmit = async (text: string) => {
    const slot = ingestCount.current;
    ingestCount.current += 1;
    announce("AgenticOrg SOP parser: analyzing note structure & domain procedures…");

    try {
      const fragment = await extractConceptsAPI(text, slot);
      setIngestion(new Set(fragment.nodes.map((node) => node.id)));

      // Calculate positions on canvas for extracted nodes
      const anchor = INITIAL_POSITIONS.eventloop ?? { x: 0.5, y: 0.5 };
      const newPositions: Record<string, { x: number; y: number }> = {};
      fragment.nodes.forEach((node, idx) => {
        newPositions[node.id] = {
          x: 0.14 + ((slot * 2 + idx) % 4) * 0.17,
          y: Math.min(0.94, anchor.y + 0.16 + Math.floor((slot * 2 + idx) / 4) * 0.18 + idx * 0.02),
        };
      });

      later(() => announce("Extracting key concepts from your notes…"), 500);
      later(() => announce("Connecting topics into your concept map…"), 1100);
      later(() => {
        setNodes((current) => [...current, ...fragment.nodes]);
        setEdges((current) => [...current, ...fragment.edges]);
        setPositions((current) => ({ ...current, ...newPositions }));
        setView("engine");
        announce(
          `Added ${fragment.nodes.length} new topic${fragment.nodes.length === 1 ? "" : "s"} into your concept map.`
        );
      }, 1600);
      later(() => setIngestion(null), 3200);

      // Save user raw notes into notes archive
      const ingestedNote: ArchivedNote = {
        id: `note-user-${Date.now()}`,
        title: `Study Notes: ${text.slice(0, 36)}…`,
        createdAt: new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        category: "Study Notes",
        targetGoal: "Personal Knowledge Map",
        timeline: "Active Tracking",
        dailyPace: "Self-Paced",
        content: text,
      };
      setSavedNotes((prev) => [ingestedNote, ...prev]);
    } catch {
      const fallback = extractFromNotes(text, slot);
      setNodes((current) => [...current, ...fallback.nodes]);
      setEdges((current) => [...current, ...fallback.edges]);
      setPositions((current) => ({ ...current, ...fallback.positions }));
      setView("engine");
      announce(`Wired ${fallback.nodes.length} concept nodes into your graph.`);
    }
  };

  const barSubmit = (text: string) => {
    if (barMode === "chat") chatSubmit(text);
    else notesSubmit(text);
  };

  /* ------------------------------------------------------------------ */

  if (isCheckingSession) {
    return (
      <div className="flex h-dvh flex-col bg-canvas">
        <TitleBoard />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-cyan-400 soft-pulse" />
            <span className="font-mono text-xs text-dim">Syncing epistemic session…</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-dvh flex-col bg-canvas">
        <TitleBoard />
        <AuthHero
          isPlaceholderConfig={isPlaceholderConfig}
          onGoogleSignIn={handleGoogleSignIn}
          onPlaceholderSignIn={handlePlaceholderSignIn}
        />
      </div>
    );
  }

  const selected = selectedId ? byId[selectedId] ?? null : null;
  const gate = selected ? prerequisiteGate(selected, byId, overrides) : null;
  const scaffoldMode =
    selected && gate
      ? gate.mode === "blocked"
        ? "blocked"
        : gate.mode === "override"
          ? "override"
          : "open"
      : "empty";
  const missing = gate?.missing ?? [];
  const traceTarget = tracePath && tracePath.length > 0 ? tracePath[tracePath.length - 1] : null;

  return (
    <div className="flex h-dvh flex-col bg-canvas">
      <Header
        user={user}
        activeTrackId={activeTrackId}
        sessionStatus={sessionStatus}
        onSelectTrack={selectTrack}
        onSignOut={signOut}
        onToggleRoadmap={() => setRailOpen((value) => !value)}
        onOpenNotes={() => setShowNotesModal(true)}
        notesCount={savedNotes.length}
        onNewPlan={() => setShowOnboarding(true)}
      />

      <div className="relative flex min-h-0 flex-1">
        <RoadmapRail
          steps={ROADMAP_STEPS}
          nodes={nodes}
          focusIds={focusTierIds}
          onStepClick={railStepClick}
          open={railOpen}
          onClose={() => setRailOpen(false)}
        />

        <main className="flex min-w-0 flex-1 flex-col">
          {view === "overview" ? (
            <TrackOverview
              nodes={nodes}
              steps={ROADMAP_STEPS}
              activeTrackId={activeTrackId}
              onResumeTrack={resumeTrack}
              onInspectGraph={inspectGraph}
              onIngestNotes={ingestNotesAction}
              onSelectTrack={selectTrack}
            />
          ) : (
            <div className="flex min-h-0 flex-1">
              <KnowledgeGraph
                nodes={nodes}
                edges={edges}
                positions={positions}
                selectedId={selectedId}
                tracePath={tracePath}
                traceTarget={traceTarget}
                focusIds={focusTierIds}
                spawnIds={ingestion}
                onSelect={(id) => selectConcept(id)}
                onMove={moveNode}
                onClearFocus={clearFocus}
                onBackToTracks={() => setView("overview")}
              />

              <ScaffoldDrawer
                node={selected}
                nodes={nodes}
                edges={edges}
                mode={scaffoldMode}
                missing={missing}
                tracePath={tracePath}
                mobileOpen={drawerOpen}
                agentOutput={agentOutput}
                onClose={() => setDrawerOpen(false)}
                onJumpToPrerequisite={jumpToPrerequisite}
                onOverride={overrideBridge}
                onBridge={bridgeAndCommit}
                onFocusNode={(id) => selectConcept(id)}
                onSaveToNotes={handleSaveToNotes}
              />
            </div>
          )}

          <InteractionBar
            mode={barMode}
            onModeChange={setBarMode}
            onSubmit={barSubmit}
            ingestPing={ingestPing}
            busyLabel={situation}
          />
        </main>
      </div>

      <OnboardingWizard
        user={user}
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onDismiss={() => setShowOnboarding(false)}
      />

      <NotesModal
        isOpen={showNotesModal}
        notes={savedNotes}
        onClose={() => setShowNotesModal(false)}
      />
    </div>
  );
}

/** Minimal brand footer strip shown on the unauthenticated screen. */
function TitleBoard() {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-line/60 bg-panel/60 px-6 py-3.5">
      <span className="font-mono text-[10px] tracking-[0.3em] text-faint uppercase">
        TailorEd · Visual Mental Model Learning
      </span>
    </div>
  );
}
