"use client";

import { useState } from "react";
import type { UserProfile } from "@/domain/types";
import { CheckIcon, RouteIcon, LogoMark } from "./Icons";

export interface OnboardingPlanData {
  category: "interview" | "exam" | "general" | "other";
  targetGoal: string;
  baseline: "beginner" | "intermediate" | "advanced";
  timeline: "2-weeks" | "1-month" | "3-months";
  dailyPace: string;
  customNotes?: string;
}

interface OnboardingWizardProps {
  user: UserProfile;
  isOpen: boolean;
  onComplete: (data: OnboardingPlanData) => void;
  onDismiss?: () => void;
}

const TRACK_PRESETS = [
  {
    id: "interview" as const,
    title: "Technical Interview Prep",
    badge: "SDE II / III & Engineering",
    defaultGoal: "System Design & Distributed Systems",
    desc: "Master system architecture, distributed patterns, caching, and scalability.",
    milestones: [
      "Reliability & Fallacies of Distributed Systems",
      "Write-Ahead Logs & Storage Engines",
      "Replication & Consensus (Raft vs Paxos)",
      "Partitioning, Sharding & Consistent Hashing",
      "High-Availability APIs & System Design",
    ],
  },
  {
    id: "exam" as const,
    title: "Competitive Exam Preparation",
    badge: "GATE / Certifications",
    defaultGoal: "GATE Computer Science / Technical Exam",
    desc: "Rigorous concept mastery, practice problems, and knowledge checkpoints.",
    milestones: [
      "Foundational Algorithms & Discrete Math",
      "Operating Systems & Process Synchronization",
      "Memory Hierarchy & Virtual Memory",
      "Database Transactions & ACID Properties",
      "Full Practice Tests & Gap Analysis",
    ],
  },
  {
    id: "general" as const,
    title: "Deep Tech & AI Knowledge",
    badge: "Modern AI & Tech Skills",
    defaultGoal: "Modern AI Engineering & Infrastructure",
    desc: "Learn modern tech, AI models, and real-world tools step-by-step.",
    milestones: [
      "Core Architecture & Building Blocks",
      "Component Internals & How They Work",
      "Real-World Production Scenarios",
      "Hands-on Implementation Projects",
      "Synthesis & Advanced Architecture Review",
    ],
  },
  {
    id: "other" as const,
    title: "Other / Custom Goal",
    badge: "Your Custom Subject",
    defaultGoal: "Cloud Architecture & Fullstack Engineering",
    desc: "Type any topic or role you want to learn to build a custom step-by-step roadmap.",
    milestones: [
      "Core Foundations & Principles",
      "Essential Patterns & Frameworks",
      "Key Techniques & Best Practices",
      "Hands-on Project & Practical System",
      "Comprehensive Review & Practice Checkpoint",
    ],
  },
];

export function OnboardingWizard({
  user,
  isOpen,
  onComplete,
  onDismiss,
}: OnboardingWizardProps) {
  const [selectedCategory, setSelectedCategory] = useState<"interview" | "exam" | "general" | "other">("interview");
  const [targetGoal, setTargetGoal] = useState("System Design & Distributed Systems");
  const [baseline, setBaseline] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [timeline, setTimeline] = useState<"2-weeks" | "1-month" | "3-months">("1-month");
  const [dailyPace, setDailyPace] = useState("1 - 2 hrs / day");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  if (!isOpen) return null;

  const activePreset = TRACK_PRESETS.find((p) => p.id === selectedCategory) ?? TRACK_PRESETS[0];

  const handleCategoryChange = (cat: "interview" | "exam" | "general" | "other") => {
    setSelectedCategory(cat);
    const preset = TRACK_PRESETS.find((p) => p.id === cat);
    if (preset) setTargetGoal(preset.defaultGoal);
  };

  const handleStartPlan = () => {
    setIsGenerating(true);
    setGenerationStep(1);

    setTimeout(() => setGenerationStep(2), 400);
    setTimeout(() => setGenerationStep(3), 850);
    setTimeout(() => {
      onComplete({
        category: selectedCategory,
        targetGoal,
        baseline,
        timeline,
        dailyPace,
      });
      setIsGenerating(false);
    }, 1300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-line bg-panel p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_24px_80px_-24px_rgba(0,0,0,0.95)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-medium">
                  Welcome {user.name.split(" ")[0]}
                </span>
                <span className="rounded-full bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 font-mono text-[9px] text-cyan-300">
                  New Learning Roadmap
                </span>
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                What would you like to learn?
              </h2>
            </div>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs font-mono text-faint hover:text-dim px-2 py-1"
            >
              Skip
            </button>
          )}
        </div>

        {isGenerating ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <span className="pulse-ring absolute h-16 w-16 -top-1 -left-1 rounded-full border-2 border-cyan-400/60" />
              <div className="h-14 w-14 rounded-full bg-cyan-500/10 border border-cyan-400/40 grid place-items-center text-cyan-300">
                <RouteIcon className="h-7 w-7 animate-pulse" />
              </div>
            </div>
            <p className="text-sm font-medium text-ink">
              {generationStep === 1 && "Creating your personalized learning roadmap…"}
              {generationStep === 2 && "Structuring milestones from beginner to advanced…"}
              {generationStep >= 3 && "Saving study notes & building your concept map…"}
            </p>
            <p className="mt-2 text-xs text-faint">
              Goal: {targetGoal} · {timeline}
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {/* 1. Track category selector */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-2">
                1. Choose Goal or Subject Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRACK_PRESETS.map((preset) => {
                  const isSelected = selectedCategory === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleCategoryChange(preset.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-500/[0.08] text-ink shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)]"
                          : "border-line bg-panel-2 text-dim hover:text-ink hover:border-line-strong"
                      }`}
                    >
                      <span className="inline-block text-[9px] font-mono text-cyan-300/80 mb-0.5">
                        {preset.badge}
                      </span>
                      <p className="font-semibold text-xs leading-snug text-ink">{preset.title}</p>
                      <p className="mt-1 text-[11px] text-faint line-clamp-1">{preset.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Specific Target Goal / Role Input */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">
                2. Target Subject, Exam, or Topic
              </label>
              <input
                type="text"
                value={targetGoal}
                onChange={(e) => setTargetGoal(e.target.value)}
                placeholder="e.g. System Design, GATE CS, Fullstack React, or Machine Learning"
                className="w-full rounded-xl border border-line bg-panel-2 px-3.5 py-2.5 text-xs text-ink outline-none focus:border-cyan-400/50 placeholder:text-faint"
              />
            </div>

            {/* 3. Proficiency Baseline & Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">
                  3. Starting Knowledge
                </label>
                <div className="flex gap-1.5 rounded-xl border border-line bg-panel-2 p-1">
                  {(
                    [
                      ["beginner", "Beginner"],
                      ["intermediate", "Intermediate"],
                      ["advanced", "Advanced"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBaseline(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center text-xs font-medium transition-all ${
                        baseline === val
                          ? "bg-panel text-ink shadow-sm border border-line"
                          : "text-faint hover:text-dim"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">
                  4. Target Timeline
                </label>
                <div className="flex gap-1.5 rounded-xl border border-line bg-panel-2 p-1">
                  {(
                    [
                      ["2-weeks", "2 Weeks"],
                      ["1-month", "1 Month"],
                      ["3-months", "3 Months"],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTimeline(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center text-xs font-medium transition-all ${
                        timeline === val
                          ? "bg-panel text-ink shadow-sm border border-line"
                          : "text-faint hover:text-dim"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Daily Commitment Pace */}
            <div>
              <label className="block text-xs font-medium text-dim uppercase tracking-wider mb-1.5">
                5. Daily Study Time
              </label>
              <div className="flex gap-2">
                {["1 hr / day", "1 - 2 hrs / day", "2 - 3 hrs / day", "Weekends Focus"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setDailyPace(p)}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] text-center transition-all ${
                      dailyPace === p
                        ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 font-medium"
                        : "border-line bg-panel-2 text-faint hover:text-dim"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview of Plan Milestones */}
            <div className="rounded-xl border border-line/80 bg-panel-2/70 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-dim font-medium uppercase tracking-wider">
                  Roadmap Topics ({activePreset.milestones.length})
                </span>
                <span className="text-[11px] text-faint">
                  Auto-saved to your study notes
                </span>
              </div>
              <ul className="space-y-1.5">
                {activePreset.milestones.map((m, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-dim">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
              <button
                type="button"
                onClick={handleStartPlan}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 px-5 py-2.5 text-xs font-semibold text-black shadow-md hover:scale-[1.01] transition-transform"
              >
                <CheckIcon className="h-4 w-4" />
                Create My Learning Roadmap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
