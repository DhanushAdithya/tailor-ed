"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { ConceptNode, GraphEdge } from "@/domain/types";
import { edgeBetween, relationMeta } from "@/lib/graph";
import { ArrowLeftIcon, CloseIcon, RouteIcon } from "./Icons";

interface KnowledgeGraphProps {
  nodes: ConceptNode[];
  edges: GraphEdge[];
  positions: Record<string, { x: number; y: number }>;
  selectedId: string | null;
  tracePath: string[] | null;
  traceTarget: string | null;
  focusIds: Set<string> | null;
  spawnIds: Set<string> | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onClearFocus: () => void;
  onBackToTracks: () => void;
}

const VIEW_W = 160;
const VIEW_H = 100;

const FAMILIARITY_STYLE = {
  mastered: { ring: "#10b981", fill: "#10b981", halo: 0.1, dashed: false },
  emerging: { ring: "#f59e0b", fill: "rgba(245,158,11,0.22)", halo: 0.07, dashed: false },
  uncharted: { ring: "#38bdf8", fill: "rgba(56,189,248,0.08)", halo: 0.06, dashed: true },
} as const;

function hash01(value: string) {
  let hash = 0;
  for (const ch of value) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return hash / 997;
}

export function KnowledgeGraph({
  nodes,
  edges,
  positions,
  selectedId,
  tracePath,
  traceTarget,
  focusIds,
  spawnIds,
  onSelect,
  onMove,
  onClearFocus,
  onBackToTracks,
}: KnowledgeGraphProps) {
  const [showLabels, setShowLabels] = useState(false);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const px = useCallback(
    (id: string) => {
      const direct = positions[id];
      if (direct) return { x: direct.x * VIEW_W, y: direct.y * VIEW_H };
      const a = hash01(id);
      const b = hash01(`${id}-y`);
      return { x: (0.12 + a * 0.72) * VIEW_W, y: (0.14 + b * 0.7) * VIEW_H };
    },
    [positions],
  );

  const traceSegments = useMemo(() => {
    const segments = new Set<string>();
    if (!tracePath) return segments;
    for (let i = 0; i < tracePath.length - 1; i += 1) {
      segments.add(edgeKey(tracePath[i], tracePath[i + 1]));
    }
    return segments;
  }, [tracePath]);

  const tracedEdges = useMemo(() => {
    const list: GraphEdge[] = [];
    if (!tracePath) return list;
    for (let i = 0; i < tracePath.length - 1; i += 1) {
      const edge = edgeBetween(tracePath[i], tracePath[i + 1], edges);
      if (edge) list.push(edge);
    }
    return list;
  }, [tracePath, edges]);

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (event.clientX - drag.startX) / rect.width;
    const dy = (event.clientY - drag.startY) / rect.height;
    onMove(
      drag.id,
      clamp(drag.originX + dx, 0.03, 0.97),
      clamp(drag.originY + dy, 0.06, 0.94),
    );
  };

  // the node at the end of a multi-hop trace gets a pulsing target ring
  const pulseTarget =
    tracePath && tracePath.length > 1 && traceTarget ? traceTarget : null;

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToTracks}
            className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-panel-2 text-faint transition-colors hover:text-ink"
            aria-label="Back to knowledge tracks"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
          </button>
          <RouteIcon className="h-4 w-4 text-cyan-300" />
          <h2 className="text-xs font-semibold tracking-wide text-ink">
            Mental Model Graph
          </h2>
          <span className="font-mono text-[10px] text-faint">
            {nodes.length} nodes · {edges.length} structural edges
          </span>
        </div>
        <div className="flex items-center gap-2">
          {tracePath && traceTarget && (
            <span className="fade-in flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2.5 py-1 font-mono text-[9px] text-cyan-300">
              path trace → {nodes.find((n) => n.id === traceTarget)?.label}
            </span>
          )}
          {focusIds && (
            <button
              type="button"
              onClick={onClearFocus}
              className="flex items-center gap-1 rounded-full border border-line bg-panel-2 px-2 py-1 font-mono text-[9px] text-dim transition-colors hover:text-ink"
            >
              clear tier focus
              <CloseIcon className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLabels((value) => !value)}
            className={`rounded-full border px-2.5 py-1 font-mono text-[9px] transition-colors ${
              showLabels
                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                : "border-line bg-panel-2 text-faint hover:text-dim"
            }`}
          >
            rel. labels
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="fade-in h-full w-full touch-none select-none"
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          <defs>
            <pattern
              id="mm-grid"
              width="14"
              height="14"
              patternUnits="userSpaceOnUse"
            >
              <path d="M14 0H0V14" fill="none" stroke="#232529" strokeWidth="0.4" />
            </pattern>
            <radialGradient id="mm-glow" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#121316" />
              <stop offset="100%" stopColor="#0c0d0e" />
            </radialGradient>
          </defs>

          <rect width={VIEW_W} height={VIEW_H} fill="url(#mm-glow)" />
          <rect width={VIEW_W} height={VIEW_H} fill="url(#mm-grid)" opacity={0.5} />
          <ellipse cx={VIEW_W / 2} cy={VIEW_H * 0.42} rx={62} ry={34} fill="rgba(56,189,248,0.03)" />
          <ellipse cx={VIEW_W * 0.78} cy={VIEW_H * 0.5} rx={40} ry={22} fill="rgba(99,102,241,0.05)" />

          {/* edges */}
          <g>
            {edges.map((edge) => {
              const from = px(edge.source);
              const to = px(edge.target);
              const key = edgeKey(edge.source, edge.target);
              const traced = traceSegments.has(key);
              const meta = relationMeta(edge.relation);
              const inFocus = focusIds
                ? focusIds.has(edge.source) || focusIds.has(edge.target)
                : false;
              const spawned = spawnIds?.has(edge.target) ?? false;
              const dimBase = focusIds && !inFocus ? opacity(0.1) : opacity(0.26);
              const label = showLabels || traced;
              const mid = {
                x: (from.x + to.x) / 2,
                y: (from.y + to.y) / 2,
              };
              // perpendicular offset so labels sit beside the line
              const len = dist(from, to) || 1;
              const labelOffset = {
                x: ((to.y - from.y) / len) * 1.4,
                y: (-(to.x - from.x) / len) * 1.4,
              };

              return (
                <g key={edge.id}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={meta.color}
                    strokeOpacity={traced ? 0 : dimBase}
                    strokeWidth={0.4}
                    strokeDasharray={meta.dash}
                  />
                  {/* wiring animation for freshly ingested edges */}
                  {spawned && (
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={meta.color}
                      strokeOpacity={0.8}
                      strokeWidth={0.5}
                      strokeDasharray={`${dist(from, to)}`}
                      className="wire-draw"
                      style={{ ["--wire-length" as string]: `${dist(from, to)}` }}
                    />
                  )}
                  {label && !spawned && (
                    <text
                      x={mid.x + labelOffset.x}
                      y={mid.y + labelOffset.y}
                      textAnchor="middle"
                      fontSize={1.7}
                      className="font-mono"
                      fill={meta.color}
                      opacity={traced ? 0.9 : 0.5}
                    >
                      {meta.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* traced conceptual path */}
          <g>
            {tracedEdges.map((edge) => {
              const from = px(edge.source);
              const to = px(edge.target);
              return (
                <line
                  key={`trace-${edge.id}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#10b981"
                  strokeOpacity={0.85}
                  strokeWidth={0.75}
                  strokeLinecap="round"
                  strokeDasharray="2 1.1"
                  className="animate-dash-flow"
                  style={{ filter: "drop-shadow(0 0 1.6px rgba(16,185,129,0.65))" }}
                />
              );
            })}
          </g>

          {/* nodes */}
          <g>
            {nodes.map((node) => {
              const at = px(node.id);
              const style = FAMILIARITY_STYLE[node.familiarity];
              const isSpawn = spawnIds?.has(node.id) ?? false;
              const nodeOp =
                focusIds && !focusIds.has(node.id)
                  ? 0.2
                  : isSpawn
                    ? 1
                    : tracedOrSelected(node.id, tracePath, selectedId)
                      ? 1
                      : tracePath
                        ? 0.5
                        : 1;
              const highlight = selectedId === node.id;
              const isTraceTarget = pulseTarget === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${at.x}, ${at.y})`}
                  onPointerDown={(event) => {
                    dragRef.current = {
                      id: node.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      originX: positions[node.id]?.x ?? at.x / VIEW_W,
                      originY: positions[node.id]?.y ?? at.y / VIEW_H,
                    };
                  }}
                  onClick={() => onSelect(node.id)}
                  opacity={nodeOp}
                  className="cursor-pointer"
                  style={{ transition: "opacity 0.4s ease" }}
                >
                  <circle
                    r={6.8}
                    fill={style.ring}
                    fillOpacity={style.halo}
                    aria-hidden
                  />
                  <circle
                    r={3.1}
                    fill={style.fill}
                    stroke={style.ring}
                    strokeWidth={0.42}
                    strokeDasharray={style.dashed ? "1.5 1.1" : undefined}
                  />
                  {highlight && (
                    <circle
                      r={4.6}
                      fill="none"
                      stroke="#e7e9ec"
                      strokeOpacity={0.75}
                      strokeWidth={0.4}
                    />
                  )}
                  {(isTraceTarget || highlight) && (
                    <>
                      <circle
                        r={4.6}
                        fill="none"
                        stroke={isTraceTarget ? "#38bdf8" : "#e7e9ec"}
                        strokeOpacity={0.5}
                        strokeWidth={0.45}
                        className="pulse-ring"
                      />
                    </>
                  )}
                  <text
                    y={-5}
                    textAnchor="middle"
                    fontSize={2.7}
                    fontWeight={600}
                    fill="#e7e9ec"
                    pointerEvents="none"
                  >
                    {clip(node.label, 24)}
                  </text>
                  <text
                    y={8}
                    textAnchor="middle"
                    fontSize={1.95}
                    className="font-mono"
                    fill="#9aa0a8"
                    pointerEvents="none"
                  >
                    {clip(node.codename, 26)}
                  </text>
                  <title>{`${node.label} (${node.familiarity}) — click to scaffold`}</title>
                </g>
              );
            })}
          </g>
        </svg>

        {/* floating legends */}
        <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-xl border border-line bg-panel/85 px-3 py-2.5 font-mono text-[9px] text-dim backdrop-blur">
          <span className="flex items-center gap-2">
            <i className="h-2 w-2 rounded-full bg-emerald-400" /> mastered (solid)
            <i className="ml-2 h-2 w-2 rounded-full border border-amber-400 bg-amber-400/25" /> emerging
            <i className="ml-2 h-2 w-2 rounded-full border border-sky-400" /> uncharted
          </span>
          <span className="text-faint">drag nodes · click to scaffold · halo = familiarity</span>
        </div>

        {tracePath && tracePath.length > 1 && (
          <div className="pointer-events-none absolute top-3 right-3 rounded-lg border border-emerald-400/25 bg-panel/85 px-2.5 py-1.5 font-mono text-[9px] text-emerald-300 backdrop-blur">
            shortest path · {tracePath.length - 1} hop{tracePath.length === 2 ? "" : "s"}
          </div>
        )}
      </div>
    </section>
  );
}

/* helpers ---------------------------------------------------------------- */

function opacity(value: number) {
  return value;
}

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  return Math.round(Math.hypot(b.x - a.x, b.y - a.y));
}

function edgeKey(a: string, b: string) {
  return [a, b].sort().join("|");
}

function tracedOrSelected(
  id: string,
  tracePath: string[] | null,
  selectedId: string | null,
) {
  return (tracePath?.includes(id) ?? false) || selectedId === id;
}

function clip(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
