"use client";

import { useEffect, useRef, useState } from "react";
import type { BarMode } from "@/domain/types";
import { MicIcon, SendIcon } from "./Icons";

interface InteractionBarProps {
  mode: BarMode;
  onModeChange: (mode: BarMode) => void;
  onSubmit: (text: string) => void;
  ingestPing: number;
  busyLabel: string | null;
}

const NOTE_PLACEHOLDER =
  "Drop notes to extract mental models — e.g. paste your vector-clocks reading notes…";

const CHAT_PLACEHOLDER =
  "Ask to bridge a concept (e.g., 'Explain Raft using my DB notes')";

export function InteractionBar({
  mode,
  onModeChange,
  onSubmit,
  ingestPing,
  busyLabel,
}: InteractionBarProps) {
  const [value, setValue] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // "Ingest New Notes" quick-action focuses the bar in note mode
  useEffect(() => {
    if (ingestPing === 0) return;
    onModeChange("notes");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingestPing]);

  const submit = () => {
    const text = value.trim();
    if (!text || listening) return;
    onSubmit(text);
    setValue("");
  };

  const simulateVoice = () => {
    if (listening) return;
    setListening(true);
    window.setTimeout(() => {
      setValue("Explain Raft using my PostgreSQL WAL notes");
      setListening(false);
      onModeChange("chat");
      inputRef.current?.focus();
    }, 1900);
  };

  return (
    <div className="relative border-t border-line bg-panel/90 px-3 pt-2.5 pb-3 backdrop-blur md:px-6">
      {/* live system message */}
      <div className="pointer-events-none absolute -top-8 right-4 left-4 flex justify-end md:right-8 md:left-8">
        {busyLabel !== null && (
          <span
            key={busyLabel}
            className="rise flex max-w-full items-center gap-2 truncate rounded-full border border-line bg-panel-2/95 px-3 py-1.5 font-mono text-[10px] text-dim shadow-[0_8px_30px_-12px_rgba(0,0,0,0.9)]"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                listening ? "bg-cyan-400" : "bg-emerald-400"
              }`}
            />
            <span className="truncate">{busyLabel}</span>
          </span>
        )}
      </div>

      {/* mode pill */}
      <div className="mx-auto mb-2.5 flex max-w-2xl items-center gap-1 rounded-full border border-line bg-panel-2 p-1">
        {(
          [
            ["chat", "Chat / Live Question"],
            ["notes", "Quick Note Ingestion"],
          ] as [BarMode, string][]
        ).map(([candidate, label]) => (
          <button
            key={candidate}
            type="button"
            onClick={() => {
              onModeChange(candidate);
              inputRef.current?.focus();
            }}
            className={`h-7 flex-1 rounded-full font-mono text-[10px] tracking-wide transition-all ${
              mode === candidate
                ? "bg-panel text-ink shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]"
                : "text-faint hover:text-dim"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* input row */}
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <button
          type="button"
          onClick={simulateVoice}
          aria-label="Simulated Gemini Live voice capture"
          className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border transition-colors ${
            listening
              ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300"
              : "border-line bg-panel-2 text-dim hover:text-ink"
          }`}
        >
          {listening && (
            <span className="pulse-ring absolute h-full w-full rounded-xl border border-cyan-400/40" />
          )}
          <MicIcon className="h-5 w-5" />
        </button>

        <div
          className={`flex flex-1 items-end rounded-xl border bg-panel-2 transition-colors ${
            listening ? "border-cyan-400/30" : "border-line focus-within:border-line-strong"
          }`}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={listening ? "listening — live voice capture…" : mode === "chat" ? CHAT_PLACEHOLDER : NOTE_PLACEHOLDER}
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-3.5 py-3 text-[13px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || listening}
            aria-label="Submit command"
            className={`m-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all ${
              value.trim() && !listening
                ? mode === "chat"
                  ? "bg-gradient-to-r from-cyan-400 to-indigo-400 text-black"
                  : "bg-gradient-to-r from-emerald-400 to-emerald-500 text-black"
                : "bg-panel text-faint"
            }`}
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mx-auto mt-2 max-w-2xl font-mono text-[9px] leading-relaxed text-faint">
        {mode === "chat"
          ? "bridge commands route through the prerequisite interceptor before opening the scaffold drawer."
          : "submitting notes parses concepts and wires new nodes into the graph."}
      </p>
    </div>
  );
}
