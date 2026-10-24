"use client";

import { GoogleIcon, LogoMark } from "./Icons";

const GLOW =
  "bg-[radial-gradient(60%_50%_at_50%_0%,rgba(56,189,248,0.08),transparent)]";

interface AuthHeroProps {
  onDemoSignIn: () => void;
  onGoogleSignIn: () => void;
}

export function AuthHero({ onDemoSignIn, onGoogleSignIn }: AuthHeroProps) {
  return (
    <div className={`fade-in relative flex h-full w-full items-center justify-center px-6 ${GLOW}`}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(rgba(35,37,41,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(35,37,41,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="fade-in relative w-full max-w-md rounded-2xl border border-line bg-panel p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_24px_80px_-24px_rgba(0,0,0,0.9)]">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div className="leading-tight">
            <p className="font-mono text-[11px] tracking-[0.2em] text-cyan-400/90 uppercase">
              epistemic os
            </p>
            <p className="font-mono text-[10px] text-faint">epistemic.scaffold.v0</p>
          </div>
        </div>

        <h1 className="mt-8 text-[26px] leading-snug font-semibold tracking-tight text-ink">
          Connect Your Mind:{" "}
          <span className="bg-gradient-to-r from-cyan-300 to-indigo-300 bg-clip-text text-transparent">
            Sync Epistemic Workspace
          </span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-dim">
          Ingest your notes, map cognitive mental models, and scaffold unlearned
          concepts.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="group flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white/95 px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-white"
          >
            <GoogleIcon className="h-4.5 w-4.5" />
            Sign In with Google
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-line" />
            <span className="font-mono text-[10px] tracking-widest text-faint uppercase">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            onClick={onDemoSignIn}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-panel-2 px-4 text-sm font-medium text-ink transition-colors hover:border-cyan-400/40 hover:bg-panel-2/80"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-400/15 font-mono text-[10px] text-cyan-300">
              S
            </span>
            Enter as Saumit <span className="font-mono text-[10px] text-faint">· demo</span>
          </button>
        </div>

        <p className="mt-6 font-mono text-[10px] leading-relaxed text-faint">
          corpus stays local. ingestion, graph upgrades, and model calls are
          explicit and auditable — privacy by default.
        </p>
      </div>
    </div>
  );
}
