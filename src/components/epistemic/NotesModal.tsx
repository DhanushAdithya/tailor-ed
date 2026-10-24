"use client";

import { CloseIcon, NoteIcon } from "./Icons";
import { RichText } from "./ScaffoldDrawer";

export interface ArchivedNote {
  id: string;
  title: string;
  createdAt: string;
  category: string;
  targetGoal: string;
  timeline: string;
  dailyPace: string;
  content: string;
}

interface NotesModalProps {
  isOpen: boolean;
  notes: ArchivedNote[];
  onClose: () => void;
}

export function NotesModal({ isOpen, notes, onClose }: NotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-line bg-panel-2 text-cyan-300">
              <NoteIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-medium">
                  Study Notes
                </span>
                <span className="rounded-full bg-panel-2 border border-line px-2 py-0.5 font-mono text-[9px] text-dim">
                  {notes.length} saved document{notes.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-ink mt-0.5">
                Saved Roadmaps &amp; Study Notes
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-line text-faint hover:text-ink transition-colors"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {notes.length === 0 ? (
            <div className="py-12 text-center text-dim text-xs">
              No saved study notes yet. Create a study goal or add notes below to start saving.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-line bg-panel-2/70 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3">
                  <div>
                    <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-0.5 font-mono text-[9px] text-cyan-300 uppercase">
                      {note.category}
                    </span>
                    <h3 className="text-base font-semibold text-ink mt-1.5">{note.title}</h3>
                    <p className="font-mono text-[10px] text-faint mt-0.5">
                      Target: {note.targetGoal} · Timeline: {note.timeline} · Pace: {note.dailyPace}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-faint shrink-0">
                    {note.createdAt}
                  </span>
                </div>

                <div className="pt-1">
                  <RichText content={note.content} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-line flex justify-between items-center text-xs font-mono text-faint">
          <span>Notes are automatically synced with cognitive graph models</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-line bg-panel-2 text-ink hover:border-line-strong transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
