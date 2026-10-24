"use client";

import type { ConceptNode, GraphEdge, ScaffoldMode } from "@/domain/types";
import { familiarityLabel, relationMeta } from "@/lib/graph";
import {
  ArrowRightIcon,
  CheckIcon,
  CloseIcon,
  ExclaimIcon,
  RouteIcon,
} from "./Icons";

export interface AgentOutputData {
  prompt: string;
  rawText: string;
  status: string;
  confidence?: number;
  output: Record<string, unknown>;
}

interface ScaffoldDrawerProps {
  node: ConceptNode | null;
  nodes: ConceptNode[];
  edges: GraphEdge[];
  mode: ScaffoldMode;
  missing: ConceptNode[];
  tracePath: string[] | null;
  mobileOpen: boolean;
  agentOutput?: AgentOutputData | null;
  onClose: () => void;
  onJumpToPrerequisite: (id: string) => void;
  onOverride: (id: string) => void;
  onBridge: (id: string) => void;
  onFocusNode: (id: string) => void;
}

function pct(mastery: number) {
  return `${Math.round(mastery * 100)}%`;
}

export function ScaffoldDrawer({
  node,
  nodes,
  edges,
  mode,
  missing,
  tracePath,
  mobileOpen,
  agentOutput,
  onClose,
  onJumpToPrerequisite,
  onOverride,
  onBridge,
  onFocusNode,
}: ScaffoldDrawerProps) {
  const byId = Object.fromEntries(nodes.map((candidate) => [candidate.id, candidate]));
  const anchor = node?.analogy ? byId[node.analogy.anchorId] ?? null : null;
  const related = node
    ? edges.filter(
        (edge) => edge.source === node.id || edge.target === node.id,
      )
    : [];

  return (
    <>
      {/* mobile scrim */}
      {mobileOpen && node && (
        <button
          type="button"
          aria-label="Close scaffold drawer"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-sm min-w-[19rem] flex-col border-l border-line bg-panel transition-transform duration-300 lg:static lg:z-auto lg:max-w-[24rem] lg:min-w-0 lg:translate-x-0 lg:rounded-none xl:max-w-[26rem] ${
          mobileOpen && node ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-faint uppercase">
              didactic scaffolding
            </p>
            <p className="mt-0.5 font-mono text-[10px] text-dim">
              scaffold.live · prerequisite interceptor armed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line text-faint transition-colors hover:text-ink lg:opacity-0 lg:pointer-events-none"
            aria-label="Close scaffolding drawer"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
          {agentOutput && (
            <div className="rise rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-500/[0.08] to-transparent p-4">
              <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-300 font-medium">
                    Agent Run Output
                  </span>
                </div>
                {agentOutput.confidence !== undefined && (
                  <span className="font-mono text-[10px] text-cyan-300/80 rounded-full border border-cyan-400/20 px-2 py-0.5">
                    confidence: {Math.round(agentOutput.confidence * 100)}%
                  </span>
                )}
              </div>

              <div className="mt-3">
                <p className="font-mono text-[10px] text-faint">Prompt:</p>
                <p className="mt-0.5 text-xs text-dim italic">“{agentOutput.prompt}”</p>
              </div>

              <div className="mt-3.5">
                <p className="font-mono text-[10px] text-faint">Response:</p>
                <div className="mt-1.5 rounded-xl border border-line bg-panel-2/90 p-3 text-[13px] leading-relaxed text-ink whitespace-pre-wrap font-sans">
                  {agentOutput.rawText}
                </div>
              </div>

              {agentOutput.output && Object.keys(agentOutput.output).length > 1 && (
                <details className="mt-3 font-mono text-[10px] text-faint">
                  <summary className="cursor-pointer hover:text-dim transition-colors">
                    View raw JSON output
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-line bg-canvas p-2 text-[10px] text-dim">
                    {JSON.stringify(agentOutput.output, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {!node && !agentOutput && <EmptyState />}

          {node && mode === "blocked" && (
            <PrerequisiteWarning
              node={node}
              missing={missing}
              onJump={onJumpToPrerequisite}
              onOverride={onOverride}
            />
          )}

          {node && (mode === "open" || mode === "override") && node.analogy && (
            <EpistemicBridge
              node={node}
              anchor={anchor}
              mode={mode}
              missing={missing}
              related={related}
              byId={byId}
              override={mode === "override"}
              tracePath={tracePath}
              onBridge={onBridge}
              onFocusNode={onFocusNode}
            />
          )}

          {node && (mode === "open" || mode === "override") && !node.analogy && (
            <div className="rise rounded-2xl border border-line bg-panel-2 p-5">
              <p className="font-mono text-[10px] tracking-wider text-faint uppercase">
                concept dossier
              </p>
              <h3 className="mt-2 text-base font-semibold text-ink">{node.label}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-dim">{node.blurb}</p>
              <p className="mt-4 font-mono text-[10px] text-faint">
                mastery signal: {pct(node.mastery)} · anchors not grounded yet
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* empty state ------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="rise flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-panel-2">
        <RouteIcon className="h-6 w-6 text-faint" />
      </div>
      <p className="mt-4 text-sm font-medium text-dim">
        Select a concept node to inspect prerequisites.
      </p>
      <p className="mt-2 max-w-[16rem] font-mono text-[10px] leading-relaxed text-faint">
        the interceptor verifies mastery signals before opening the epistemic
        bridge.
      </p>
    </div>
  );
}

/* prerequisite interceptor ------------------------------------------------- */

function PrerequisiteWarning({
  node,
  missing,
  onJump,
  onOverride,
}: {
  node: ConceptNode;
  missing: ConceptNode[];
  onJump: (id: string) => void;
  onOverride: (id: string) => void;
}) {
  const missingNames = missing
    .map((candidate) => candidate.label)
    .slice(0, -1)
    .join(", ");
  const tail = missing.length > 1 ? missing[missing.length - 1].label : missing[0].label;
  const joined = missing.length > 1 ? `${missingNames} and ${tail}` : tail;

  return (
    <div className="rise rounded-2xl border border-rose-400/30 bg-gradient-to-b from-rose-500/[0.07] to-transparent p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/15 text-rose-300">
          <ExclaimIcon className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-rose-200">Prerequisite Warning</p>
          <p className="font-mono text-[10px] text-rose-300/60">
            interceptor · gate=blocked
          </p>
        </div>
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-dim">
        Hold on! To grasp <span className="font-medium text-ink">{node.label}</span>{" "}
        without confusion, you first need a solid grasp of{" "}
        <span className="font-medium text-rose-200">{joined}</span>. We recommend
        completing that milestone first.
      </p>

      <div className="mt-4 space-y-1.5">
        {missing.map((prereq) => (
          <button
            key={prereq.id}
            type="button"
            onClick={() => onJump(prereq.id)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-panel-2 px-3 py-2.5 text-left transition-colors hover:border-rose-400/30"
          >
            <span className="min-w-0">
              <span className="block truncate text-xs font-medium text-ink">
                {prereq.label}
              </span>
              <span className="font-mono text-[9px] text-faint">{prereq.codename}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span
                className={`font-mono text-[10px] ${
                  prereq.mastery >= 0.6 ? "text-amber-300" : "text-rose-300"
                }`}
              >
                {pct(prereq.mastery)}
              </span>
              <ArrowRightIcon className="h-3.5 w-3.5 text-faint" />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onJump(missing[0].id)}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-500/90 px-4 text-xs font-medium text-white transition-colors hover:bg-rose-500"
        >
          <RouteIcon className="h-4 w-4" />
          Jump to Missing Prerequisite
        </button>
        <button
          type="button"
          onClick={() => onOverride(node.id)}
          className="flex h-10 items-center justify-center rounded-xl border border-line-strong bg-panel-2 px-4 text-xs font-medium text-dim transition-colors hover:border-amber-400/40 hover:text-amber-200"
        >
          Override &amp; Bridge Anyway
        </button>
      </div>

      <p className="mt-3 font-mono text-[9px] leading-relaxed text-faint">
        overrides are logged to the graph as weak mastery signals — explanations
        will lean on general scaffolding instead of grounded anchors.
      </p>
    </div>
  );
}

/* epistemic bridge ---------------------------------------------------------- */

function EpistemicBridge({
  node,
  anchor,
  mode,
  missing,
  related,
  byId,
  override,
  tracePath,
  onBridge,
  onFocusNode,
}: {
  node: ConceptNode;
  anchor: ConceptNode | null;
  mode: ScaffoldMode;
  missing: ConceptNode[];
  related: GraphEdge[];
  byId: Record<string, ConceptNode>;
  override: boolean;
  tracePath: string[] | null;
  onBridge: (id: string) => void;
  onFocusNode: (id: string) => void;
}) {
  const analogy = node.analogy;
  if (!analogy) return null;

  return (
    <div className="space-y-3">
      {override && (
        <div className="rise rounded-xl border border-amber-400/30 bg-amber-400/[0.07] p-3 font-mono text-[10px] leading-relaxed text-amber-200/90">
          override active · bridging with unmet signals:{" "}
          {missing.length > 0
            ? missing.map((candidate) => candidate.label).join(", ")
            : "none"}
        </div>
      )}

      <div className="rise rounded-2xl border border-line bg-panel-2 p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-wider text-cyan-300">
            epistemic bridge
          </p>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[9px] ${
              node.mastery >= 1
                ? "bg-emerald-400/10 text-emerald-300"
                : node.mastery > 0
                  ? "bg-amber-400/10 text-amber-300"
                  : "bg-sky-400/10 text-sky-300"
            }`}
          >
            {familiarityLabel(node.familiarity)} · {pct(node.mastery)}
          </span>
        </div>

        {/* anchor block */}
        {anchor && (
          <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.05] p-3.5">
            <p className="font-mono text-[9px] tracking-widest text-emerald-300/80 uppercase">
              anchor · what you already know
            </p>
            <p className="mt-1.5 text-sm font-semibold text-ink">{analogy.anchorTitle}</p>
            <p className="mt-1 font-mono text-[9px] text-faint">{analogy.anchorSource}</p>
          </div>
        )}

        <div className="flex items-center justify-center py-2">
          <ArrowRightIcon className="h-4 w-4 rotate-90 text-faint" />
          <span className="ml-2 font-mono text-[9px] tracking-wider text-faint uppercase">
            structural analogy
          </span>
        </div>

        {/* target block */}
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.05] p-3.5">
          <p className="font-mono text-[9px] tracking-widest text-cyan-300/80 uppercase">
            target · what you are learning
          </p>
          <p className="mt-1.5 text-sm font-semibold text-ink">{analogy.targetTitle}</p>
          <p className="mt-1 font-mono text-[9px] text-faint">{analogy.targetSource}</p>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-dim">{analogy.summary}</p>
      </div>

      {/* structural mapping */}
      <div className="rise rounded-2xl border border-line bg-panel p-4">
        <p className="font-mono text-[10px] tracking-wider text-faint uppercase">
          structural map
        </p>
        <ul className="mt-3 space-y-3">
          {analogy.mapping.map((item) => (
            <li key={item.from} className="rounded-xl border border-line bg-panel-2 p-3">
              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                <span className="rounded-md bg-emerald-400/10 px-1.5 py-0.5 text-emerald-300">
                  {item.from}
                </span>
                <ArrowRightIcon className="h-3 w-3 text-faint" />
                <span className="rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-cyan-300">
                  {item.to}
                </span>
              </div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-dim">{item.note}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* the delta */}
      <div className="rise rounded-2xl border border-amber-400/25 bg-gradient-to-b from-amber-400/[0.055] to-transparent p-4">
        <p className="font-mono text-[10px] tracking-wider text-amber-300/90 uppercase">
          the delta · exact differences &amp; edge cases
        </p>
        <ul className="mt-3 space-y-2.5">
          {analogy.delta.map((item) => (
            <li key={item.title} className="rounded-xl border border-line bg-panel-2/70 p-3">
              <p className="text-xs font-semibold text-amber-200/95">{item.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-dim">{item.body}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* prerequisites + relations + footer */}
      <div className="rise rounded-2xl border border-line bg-panel p-4">
        <p className="font-mono text-[10px] tracking-wider text-faint uppercase">
          prerequisite signals
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {node.prereqIds.length === 0 && (
            <span className="font-mono text-[9px] text-faint">no prereqs · root anchor</span>
          )}
          {node.prereqIds.map((id) => {
            const prereq = byId[id];
            if (!prereq) return null;
            const done = prereq.mastery >= 1;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onFocusNode(id)}
                className={`flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[9px] transition-colors hover:brightness-125 ${
                  done
                    ? "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300"
                    : "border-rose-400/25 bg-rose-400/[0.07] text-rose-300"
                }`}
              >
                {done ? <CheckIcon className="h-3 w-3" /> : <ExclaimIcon className="h-3 w-3" />}
                {prereq.label} · {pct(prereq.mastery)}
              </button>
            );
          })}
        </div>

        <p className="mt-4 font-mono text-[10px] tracking-wider text-faint uppercase">
          structural relations
        </p>
        <ul className="mt-2 space-y-1">
          {related.map((edge) => {
            const otherId = edge.source === node.id ? edge.target : edge.source;
            const other = byId[otherId];
            if (!other) return null;
            const meta = relationMeta(edge.relation);
            return (
              <li key={edge.id}>
                <button
                  type="button"
                  onClick={() => onFocusNode(otherId)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-[10px] transition-colors hover:bg-panel-2"
                >
                  <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: meta.color }} />
                  <span className="text-dim">{meta.label}</span>
                  <span className="truncate text-faint">→ {other.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {tracePath && tracePath.length > 1 && (
          <p className="mt-3 font-mono text-[9px] leading-relaxed text-emerald-300/70">
            path illuminated: {tracePath.join(" → ")}
          </p>
        )}

        <button
          type="button"
          onClick={() => onBridge(node.id)}
          disabled={node.mastery >= 1}
          className={`mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-xs font-medium transition-all ${
            node.mastery >= 1
              ? "cursor-default border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
              : "bg-gradient-to-r from-cyan-400 to-indigo-400 text-black hover:scale-[1.015]"
          }`}
        >
          {node.mastery >= 1 ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Scaffold complete · concept mastered
            </>
          ) : (
            <>
              <RouteIcon className="h-4 w-4" />
              Bridge &amp; Update Graph
              <span className="font-mono text-[9px] opacity-70">+25% signal</span>
            </>
          )}
        </button>
      </div>

      {mode === "open" && node.prereqIds.length > 0 && (
        <p className="pb-2 text-center font-mono text-[9px] text-faint">
          grounded in {Object.keys(byId).length} synced artifacts · citations embedded
        </p>
      )}
    </div>
  );
}
