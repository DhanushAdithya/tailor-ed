"use client";

import { useState } from "react";
import { ExclaimIcon, GoogleIcon, InfoIcon, LogoMark } from "./Icons";

const GLOW =
  "bg-[radial-gradient(60%_50%_at_50%_0%,rgba(56,189,248,0.08),transparent)]";

interface AuthHeroProps {
  onGoogleSignIn: () => void;
  onPlaceholderSignIn: () => void;
  isPlaceholderConfig?: boolean;
}

export function AuthHero({
  onGoogleSignIn,
  onPlaceholderSignIn,
  isPlaceholderConfig = false,
}: AuthHeroProps) {
  const [authError, setAuthError] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const err = params.get("auth_error");
    if (!err) return null;
    if (err === "access_denied") {
      return "Google Sign-In was cancelled or access was denied.";
    }
    if (err === "state_mismatch") {
      return "Security check (OAuth state) failed. Please try signing in again.";
    }
    if (err === "token_exchange_failed") {
      return "Failed to exchange authorization code with Google.";
    }
    return `Sign-in error: ${err}`;
  });

  const [showConfigHelper, setShowConfigHelper] = useState(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.get("auth_notice") === "placeholder_config";
  });

  const [copied, setCopied] = useState(false);

  const handleCopyEnv = () => {
    const envSnippet = `GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your-google-client-secret\nAUTH_SECRET=dev-auth-secret-min-32-chars-long`;
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fade-in relative flex h-full w-full items-center justify-center px-6 py-12 ${GLOW}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.55] [background-image:linear-gradient(rgba(35,37,41,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(35,37,41,0.35)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="fade-in relative w-full max-w-md rounded-2xl border border-line bg-panel p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_24px_80px_-24px_rgba(0,0,0,0.9)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div className="leading-tight">
              <p className="font-mono text-[11px] tracking-[0.2em] text-cyan-400/90 uppercase">
                epistemic os
              </p>
              <p className="font-mono text-[10px] text-faint">
                epistemic.scaffold.v0
              </p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[9px] ${
              isPlaceholderConfig
                ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isPlaceholderConfig
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span>
              {isPlaceholderConfig ? "OAuth · Placeholder" : "OAuth · Live"}
            </span>
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

        {authError && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <ExclaimIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span className="flex-1 leading-relaxed">{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="text-rose-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={onGoogleSignIn}
            className="group flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-line-strong bg-white/95 px-4 text-sm font-medium text-neutral-900 transition-all hover:bg-white hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] active:scale-[0.99]"
          >
            <GoogleIcon className="h-4.5 w-4.5" />
            Sign In with Google
          </button>

          {isPlaceholderConfig && (
            <div className="rounded-xl border border-line-strong/80 bg-panel-2 p-3.5">
              <div className="flex items-start gap-2.5">
                <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[11px] font-semibold text-ink">
                      Google OAuth Setup
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowConfigHelper((value) => !value)}
                      className="font-mono text-[10px] text-cyan-300 hover:underline"
                    >
                      {showConfigHelper ? "hide keys" : "setup instructions"}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-dim">
                    OAuth 2.0 flow is active with placeholder keys. Add live
                    credentials in{" "}
                    <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[10px] text-cyan-300">
                      .env.local
                    </code>{" "}
                    for live Google accounts, or use the placeholder session
                    below.
                  </p>

                  {showConfigHelper && (
                    <div className="mt-2.5 space-y-2 rounded-lg border border-line bg-canvas p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-faint">
                          .env.local snippet:
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyEnv}
                          className="font-mono text-[9px] text-cyan-400 hover:text-cyan-300"
                        >
                          {copied ? "copied!" : "copy snippet"}
                        </button>
                      </div>
                      <pre className="overflow-x-auto font-mono text-[10px] text-neutral-300">
                        {`GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
AUTH_SECRET=your-random-32-char-secret`}
                      </pre>
                    </div>
                  )}

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={onPlaceholderSignIn}
                      className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 font-mono text-xs font-medium text-cyan-200 transition-colors hover:border-cyan-400/50 hover:bg-cyan-400/20 active:scale-[0.99]"
                    >
                      <span>Continue with Placeholder Google Session →</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 font-mono text-[10px] leading-relaxed text-faint">
          corpus stays local. ingestion, graph upgrades, and model calls are
          explicit and auditable — privacy by default.
        </p>
      </div>
    </div>
  );
}
