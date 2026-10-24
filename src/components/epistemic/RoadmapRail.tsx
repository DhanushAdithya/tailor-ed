"use client";

import type { ConceptNode, RoadmapStep } from "@/domain/types";
import { deriveStepStatus, indexNodes } from "@/lib/graph";
import { CheckIcon, CloseIcon, LockIcon } from "./Icons";

interface RoadmapRailProps {
  steps: RoadmapStep[];
  nodes: ConceptNode[];
  focusIds: Set<string> | null;
  onStepClick: (step: RoadmapStep) => void;
  open: boolean;
  onClose: () => void;
}

const STATUS_CHIP: Record<
  string,
  { node: string; line: string; label: string; text: string }
> = {
  mastered: {
    node: "border-emerald-400/70 bg-emerald-400/15 text-emerald-300",
    line: "bg-emerald-400/50",
    label: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    text: "text-emerald-300",
  },
  current: {
    node: "border-amber-400/70 bg-amber-400/15 text-amber-300",
    line: "bg-amber-400/50",
    label: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    text: "text-amber-300",
  },
  next: {
    node: "border-line-strong bg-panel-2 text-dim",
    line: "bg-line",
    label: "border-line bg-transparent text-faint",
    text: "text-dim",
  },
  locked: {
    node: "border-rose-400/40 border-dashed bg-transparent text-rose-300",
    line: "bg-rose-400/30",
    label: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    text: "text-rose-300",
  },
};

export function RoadmapRail({
  steps,
  nodes,
  focusIds,
  onStepClick,
  open,
  onClose,
}: RoadmapRailProps) {
  const byId = indexNodes(nodes);
  const completed = steps.filter(
    (step) => deriveStepStatus(step, byId, steps).status === "mastered",
  ).length;

  return (
    <>
      {/* mobile scrim */}
      {open && (
        <button
          type="button"
          aria-label="Close roadmap"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm xl:hidden"
        />
      )}

      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-line bg-panel transition-transform duration-300 xl:static xl:z-auto xl:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-medium">
              Study Roadmap
            </p>
            <p className="mt-0.5 text-xs text-dim">
              {completed} of {steps.length} milestones completed
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint transition-colors hover:text-ink xl:hidden"
            aria-label="Close roadmap rail"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 py-5">
          <div className="absolute top-10 bottom-6 left-[34px] w-px bg-line" aria-hidden />
          <ol className="relative space-y-2">
            {steps.map((step) => {
              const status = deriveStepStatus(step, byId, steps);
              const style = STATUS_CHIP[status.status];
              const active = focusIds
                ? step.conceptIds.some((id) => focusIds.has(id))
                : false;
              return (
                <li key={step.index}>
                  <button
                    type="button"
                    onClick={() => onStepClick(step)}
                    className={`group flex w-full items-start gap-3.5 rounded-xl border p-3 text-left transition-all ${
                      active
                        ? "border-cyan-400/40 bg-panel-2"
                        : "border-transparent hover:border-line-strong hover:bg-panel-2/60"
                    }`}
                  >
                    <span className="relative mt-0.5 shrink-0">
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full border text-[11px] font-semibold ${style.node} ${
                          status.status === "current" ? "ring-1 ring-amber-400/30" : ""
                        }`}
                      >
                        {status.status === "mastered" ? (
                          <CheckIcon className="h-3.5 w-3.5" />
                        ) : status.status === "locked" ? (
                          <LockIcon className="h-3.5 w-3.5 opacity-70" />
                        ) : (
                          step.index
                        )}
                      </span>
                      {status.status === "current" && (
                        <span className="pulse-ring absolute inset-0 rounded-full border border-amber-400/50" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-xs leading-snug font-medium text-ink">
                        {step.title}
                      </span>
                      <span
                        className={`mt-1.5 inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${style.label}`}
                      >
                        {status.status === "mastered" && "Completed · 100%"}
                        {status.status === "current" && `In Progress · ${status.progress}%`}
                        {status.status === "next" &&
                          (status.progress > 0
                            ? `Up Next · ${status.progress}%`
                            : "Up Next")}
                        {status.status === "locked" && "Locked"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="border-t border-line px-4 py-3.5">
          <p className="text-xs text-faint">
            Click any milestone above to highlight it on your concept map.
          </p>
        </div>
      </aside>
    </>
  );
}
