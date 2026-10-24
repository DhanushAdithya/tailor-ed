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
  USER_PROFILE,
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
import { AuthHero } from "./AuthHero";
import { Header, type SessionStatus } from "./Header";
import { InteractionBar } from "./InteractionBar";
import { KnowledgeGraph } from "./KnowledgeGraph";
import { RoadmapRail } from "./RoadmapRail";
import { ScaffoldDrawer, type AgentOutputData } from "./ScaffoldDrawer";
import { TrackOverview } from "./TrackOverview";

const SESSION_SEQUENCE: SessionStatus[] = ["Connected", "Listening", "Standby"];

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

  const byId = useMemo(() => indexNodes(nodes), [nodes]);
  const ingestCount = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSessionStatus((current) => {
        const index = SESSION_SEQUENCE.indexOf(current);
        return SESSION_SEQUENCE[(index + 1) % SESSION_SEQUENCE.length];
      });
    }, 5200);
    return () => window.clearInterval(id);
  }, []);

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
    announce("Tier focus cleared — full corpus graph restored.");
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

  const signOut = () => {
    setUser(null);
    setView("overview");
    setSelectedId(null);
    setTracePath(null);
    setFocusTierIds(null);
    setIngestion(null);
    setSituation(null);
    setBarMode("chat");
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
          (typeof out.response === "string" && out.response) ||
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
        announce(`Agent completed (status: ${res.status ?? "done"})`);
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

      later(() => announce("Extracting concepts · grounding checks against your corpus…"), 500);
      later(() => announce("Matching against mental model graph…"), 1100);
      later(() => {
        setNodes((current) => [...current, ...fragment.nodes]);
        setEdges((current) => [...current, ...fragment.edges]);
        setPositions((current) => ({ ...current, ...newPositions }));
        setView("engine");
        announce(
          fragment.source === "agenticorg"
            ? `AgenticOrg live extraction: wired ${fragment.nodes.length} grounded concept nodes into your graph.`
            : `Wired ${fragment.nodes.length} new concept node${fragment.nodes.length === 1 ? "" : "s"} into your mental model graph.`,
        );
      }, 1600);
      later(() => setIngestion(null), 3200);
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

  if (!user) {
    return (
      <div className="flex h-dvh flex-col bg-canvas">
        <TitleBoard />
        <AuthHero
          onDemoSignIn={() => {
            setUser(USER_PROFILE);
            announce("Workspace synced — 3 sources · 1 active track.");
          }}
          onGoogleSignIn={() => {
            setUser(USER_PROFILE);
            announce("Google workspaces linked — epistemic graph bootstrapped.");
          }}
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
    </div>
  );
}

/** Minimal brand footer strip shown on the unauthenticated screen. */
function TitleBoard() {
  return (
    <div className="flex items-center justify-center gap-3 border-b border-line/60 bg-panel/60 px-6 py-3.5">
      <span className="font-mono text-[10px] tracking-[0.3em] text-faint uppercase">
        tailor-ed · epistemic scaffolding engine
      </span>
    </div>
  );
}
