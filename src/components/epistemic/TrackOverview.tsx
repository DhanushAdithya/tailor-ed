"use client";

import type { ConceptNode, RoadmapStep } from "@/domain/types";
import { TRACKS } from "@/domain/data";
import { deriveStepStatus, indexNodes } from "@/lib/graph";
import { ArrowRightIcon, LayersIcon, NoteIcon, RouteIcon } from "./Icons";

interface TrackOverviewProps {
  nodes: ConceptNode[];
  activeTrackId: string;
  steps: RoadmapStep[];
  onResumeTrack: () => void;
  onInspectGraph: () => void;
  onIngestNotes: () => void;
  onSelectTrack: (trackId: string) => void;
}

export function TrackOverview({
  nodes,
  activeTrackId,
  steps,
  onResumeTrack,
  onInspectGraph,
  onIngestNotes,
  onSelectTrack,
}: TrackOverviewProps) {
  const byId = indexNodes(nodes);

  return (
    <div className="rise min-h-0 w-full overflow-y-auto bg-[radial-gradient(50%_40%_at_50%_0%,rgba(99,102,241,0.06),transparent)] pb-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-10 md:pt-14">
        <div className="text-center">
          <p className="font-mono text-[10px] tracking-[0.28em] text-cyan-400/80 uppercase">
            workspace synced · graph live
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
            Knowledge Tracks
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-dim">
            Your synced corpus flows into one mental model graph. Resume the
            frontier or feed it something new.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {TRACKS.map((track) => {
            const isSelected = track.id === activeTrackId;
            const nextStep = steps.find((step) => {
              const status = deriveStepStatus(step, byId, steps);
              return status.status === "current" || status.status === "next";
            });
            return (
              <button
                key={track.id}
                type="button"
                disabled={!track.ready}
                onClick={() => onSelectTrack(track.id)}
                className={`group flex h-full flex-col rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                  isSelected
                    ? "border-cyan-400/30 bg-panel-2 shadow-[0_0_44px_-12px_rgba(56,189,248,0.35)]"
                    : "border-line bg-panel hover:border-line-strong"
                } ${track.ready ? "cursor-pointer" : "cursor-not-allowed opacity-55"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] tracking-wider text-faint">
                    {track.domainCodename.toLowerCase()}
                  </span>
                  {track.status === "active" && (
                    <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] text-cyan-300">
                      active
                    </span>
                  )}
                  {!track.ready && (
                    <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 font-mono text-[9px] text-faint">
                      seed pending
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink">{track.name}</h3>
                <p className="mt-0.5 font-mono text-[10px] text-faint">{track.domain}</p>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[10px] text-faint">progress</span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        isSelected ? "text-cyan-300" : "text-dim"
                      }`}
                    >
                      {track.progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel">
                    <div
                      className={`h-full rounded-full ${
                        isSelected
                          ? "bg-gradient-to-r from-cyan-400 to-indigo-400"
                          : "bg-line-strong"
                      }`}
                      style={{ width: `${track.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-faint">
                    {track.milestonesDone}/{track.milestonesTotal} milestones
                    {track.id === "ds" && nextStep ? ` · next: ${nextStep.title}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onResumeTrack}
            className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 text-sm font-medium text-black transition-transform hover:scale-[1.015] sm:flex-none"
          >
            <RouteIcon className="h-4 w-4" />
            Resume Current Track
            <ArrowRightIcon className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={onInspectGraph}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-panel px-5 text-sm font-medium text-ink transition-colors hover:border-cyan-400/40 hover:bg-panel-2 sm:flex-none"
          >
            <LayersIcon className="h-4 w-4 text-cyan-300" />
            Inspect Mental Model Graph
          </button>
          <button
            type="button"
            onClick={onIngestNotes}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-line-strong bg-panel px-5 text-sm font-medium text-ink transition-colors hover:border-indigo-400/40 hover:bg-panel-2 sm:flex-none"
          >
            <NoteIcon className="h-4 w-4 text-indigo-300" />
            Ingest New Notes
          </button>
        </div>

        <p className="mx-auto max-w-md text-center font-mono text-[10px] leading-relaxed text-faint">
          closest frontier: State Machine Replication · bridged from PostgreSQL
          WAL — everything below unlocks with quorum agreement language.
        </p>
      </div>
    </div>
  );
}
