"use client";

import { useState } from "react";
import type { UserProfile } from "@/domain/types";
import { TRACKS } from "@/domain/data";
import {
  ChevronDownIcon,
  LayersIcon,
  LogoMark,
  NoteIcon,
  RouteIcon,
} from "./Icons";

export type SessionStatus = "Connected" | "Listening" | "Standby";

interface HeaderProps {
  user: UserProfile;
  activeTrackId: string;
  sessionStatus: SessionStatus;
  onSelectTrack: (trackId: string) => void;
  onSignOut: () => void;
  onToggleRoadmap: () => void;
}

const SESSION_STYLES: Record<SessionStatus, { dot: string; text: string }> = {
  Connected: { dot: "bg-emerald-400", text: "text-emerald-300" },
  Listening: { dot: "bg-cyan-400", text: "text-cyan-300" },
  Standby: { dot: "bg-zinc-400", text: "text-zinc-300" },
};

export function Header({
  user,
  activeTrackId,
  sessionStatus,
  onSelectTrack,
  onSignOut,
  onToggleRoadmap,
}: HeaderProps) {
  const activeTrack = TRACKS.find((track) => track.id === activeTrackId) ?? TRACKS[0];
  const session = SESSION_STYLES[sessionStatus];

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel/80 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-5">
        <button
          type="button"
          onClick={onToggleRoadmap}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-panel-2 text-dim transition-colors hover:text-ink xl:hidden"
          aria-label="Toggle roadmap rail"
        >
          <RouteIcon className="h-[18px] w-[18px]" />
        </button>

        <div className="flex shrink-0 items-center gap-2.5">
          <LogoMark />
          <span className="hidden text-sm font-semibold tracking-tight text-ink sm:inline">
            Epistemic OS
          </span>
        </div>

        <TrackSelector activeTrackId={activeTrackId} onSelectTrack={onSelectTrack} />

        <span className="hidden shrink-0 font-mono text-[10px] text-faint lg:inline">
          {activeTrack.domainCodename.toLowerCase()} · track.frame
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2.5 md:gap-4">
        <div className="flex items-center gap-2 rounded-full border border-line bg-panel-2 py-1.5 pr-3.5 pl-2.5">
          <span className="relative grid place-items-center">
            <span
              className={`pulse-ring absolute h-3.5 w-3.5 rounded-full opacity-60 ${session.dot}`}
            />
            <span className={`soft-pulse h-2 w-2 rounded-full ${session.dot}`} />
          </span>
          <span className="hidden font-mono text-[10px] tracking-wider text-dim sm:inline">
            live session
          </span>
          <span className={`font-mono text-[10px] tracking-wider ${session.text}`}>
            {sessionStatus}
          </span>
        </div>

        <ProfileMenu user={user} activeTrackName={activeTrack.name} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

function TrackSelector({
  activeTrackId,
  onSelectTrack,
}: {
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = TRACKS.find((track) => track.id === activeTrackId) ?? TRACKS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-full border border-line bg-panel-2 py-1.5 pr-2.5 pl-3 transition-colors hover:border-line-strong"
      >
        <span className="font-mono text-[10px] text-faint">track</span>
        <span className="max-w-[8.5rem] truncate text-xs font-medium text-ink">
          {active.name}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-faint transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close track selector"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute top-[calc(100%+8px)] left-0 z-40 w-72 rounded-xl border border-line bg-panel p-1.5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
            {TRACKS.map((track) => (
              <button
                key={track.id}
                type="button"
                disabled={!track.ready}
                onClick={() => {
                  if (!track.ready) return;
                  onSelectTrack(track.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  track.ready ? "hover:bg-panel-2" : "cursor-not-allowed opacity-45"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-xs font-medium text-ink">
                    {track.name}
                    {!track.ready && (
                      <span className="font-mono text-[9px] text-faint">seed pending</span>
                    )}
                  </span>
                  <span className="font-mono text-[9px] text-faint">{track.domain}</span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-dim">
                  {track.progress}%
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ProfileMenu({
  user,
  activeTrackName,
  onSignOut,
}: {
  user: UserProfile;
  activeTrackName: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        onClick={() => setOpen((value) => !value)}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-500/80 to-indigo-500/80 text-xs font-semibold text-white ring-1 ring-white/20 transition-transform hover:scale-105"
      >
        {user.initials}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute top-[calc(100%+10px)] right-0 z-40 w-64 rounded-xl border border-line bg-panel p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-line px-2 pb-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-500/80 to-indigo-500/80 text-xs font-semibold text-white">
                {user.initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium text-ink">
                  {user.name}
                </span>
                <span className="block truncate font-mono text-[9px] text-faint">
                  {user.email}
                </span>
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5 text-xs text-dim">
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-panel-2">
                <LayersIcon className="h-4 w-4 text-faint" />
                <span>Synced sources</span>
                <span className="ml-auto font-mono text-[9px] text-emerald-300">3 linked</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-panel-2">
                <RouteIcon className="h-4 w-4 text-faint" />
                <span>Active track</span>
                <span className="ml-auto max-w-[6.5rem] truncate font-mono text-[9px] text-faint">
                  {activeTrackName}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-panel-2">
                <NoteIcon className="h-4 w-4 text-faint" />
                <span>Ingestion rules</span>
                <span className="ml-auto font-mono text-[9px] text-faint">on</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="mt-1.5 w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-left text-xs text-dim transition-colors hover:border-rose-400/40 hover:text-rose-300"
            >
              <span className="font-mono text-[10px]">sign out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
