"use client";

import * as React from "react";
import {
  Calculator,
  Code2,
  Layers,
  Video,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface FiveRoundStepperProps {
  currentRound: 1 | 2 | 3 | 4 | 5;
  completedRounds?: number[];
  className?: string;
  compact?: boolean;
}

const ROUNDS = [
  {
    num: 1,
    name: "Aptitude",
    subtitle: "Quant, Logic & Verbal MCQs",
    icon: Calculator,
    route: "/aptitude/setup",
  },
  {
    num: 2,
    name: "Technical",
    subtitle: "Role-Based Technical MCQs",
    icon: Code2,
    route: "/technical/setup",
  },
  {
    num: 3,
    name: "Project-Based",
    subtitle: "System Architecture MCQs",
    icon: Layers,
    route: "/project/setup",
  },
  {
    num: 4,
    name: "Behavioral",
    subtitle: "STAR Method Video Interview",
    icon: Video,
    route: "/behavioral/setup",
  },
  {
    num: 5,
    name: "HR Round",
    subtitle: "Executive Culture & Fit",
    icon: UserCheck,
    route: "/hr/setup",
  },
];

export function FiveRoundStepper({
  currentRound,
  completedRounds = [],
  className = "",
  compact = false,
}: FiveRoundStepperProps) {
  const currentRoundData = ROUNDS[currentRound - 1];

  // Mobile compact banner
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 text-xs ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {currentRound}
          </div>
          <div className="truncate">
            <span className="font-semibold text-purple-900 dark:text-purple-200">
              Round {currentRound} of 5:
            </span>{" "}
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {currentRoundData.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400">
          <span>{currentRound}/5</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-3.5 shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            5-Round Mock Interview Flow
          </span>
          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Round {currentRound} of 5: <strong className="text-slate-800 dark:text-slate-200">{currentRoundData.name}</strong> ({currentRoundData.subtitle})
          </span>
        </div>

        <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 font-mono bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800/60 self-start sm:self-auto">
          {completedRounds.length > 0
            ? `${completedRounds.length} of 5 Completed`
            : `Step ${currentRound} of 5`}
        </div>
      </div>

      {/* Stepper Chain */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {ROUNDS.map((r) => {
          const isCurrent = r.num === currentRound;
          const isCompleted =
            completedRounds.includes(r.num) || r.num < currentRound;
          const isUpcoming = r.num > currentRound && !completedRounds.includes(r.num);
          const Icon = r.icon;

          return (
            <div
              key={r.num}
              className={`relative rounded-xl p-2 sm:p-2.5 border transition-all flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-2 text-center sm:text-left ${
                isCurrent
                  ? "bg-purple-50/90 dark:bg-purple-950/50 border-purple-600 dark:border-purple-500 ring-2 ring-purple-600/20 shadow-xs"
                  : isCompleted
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 opacity-80"
              }`}
            >
              {/* Step Number / Icon Badge */}
              <div
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                  isCurrent
                    ? "bg-purple-600 text-white shadow-xs"
                    : isCompleted
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : r.num}
              </div>

              {/* Title & Status */}
              <div className="min-w-0 flex-1 hidden md:block">
                <p
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? "text-purple-900 dark:text-purple-100"
                      : isCompleted
                      ? "text-emerald-900 dark:text-emerald-200"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {r.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {isCurrent
                    ? "In Progress"
                    : isCompleted
                    ? "Completed"
                    : "Upcoming"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
