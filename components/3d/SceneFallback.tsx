"use client";

import * as React from "react";
import { CheckCircle2, TrendingUp, Sparkles, Award } from "lucide-react";

export function SceneFallback() {
  return (
    <div className="relative w-full h-[460px] md:h-[540px] flex items-center justify-center select-none overflow-hidden rounded-3xl bg-gradient-to-b from-card/30 to-background/50 border border-border/40 backdrop-blur-md">
      {/* Ambient background glow */}
      <div className="absolute w-72 h-72 rounded-full bg-violet-600/20 blur-3xl -top-10 -left-10 animate-pulse pointer-events-none" />
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl -bottom-10 -right-10 animate-pulse delay-1000 pointer-events-none" />

      {/* SVG Neural Rings */}
      <div className="relative flex items-center justify-center">
        <svg
          className="w-64 h-64 md:w-80 md:h-80 animate-[spin_30s_linear_infinite]"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="100"
            cy="100"
            r="88"
            stroke="url(#fallback-grad1)"
            strokeWidth="1.5"
            strokeDasharray="6 8"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            stroke="url(#fallback-grad2)"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <circle
            cx="100"
            cy="100"
            r="50"
            stroke="#8B5CF6"
            strokeWidth="1"
            strokeOpacity="0.4"
          />
          <defs>
            <linearGradient id="fallback-grad1" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#22D3EE" />
            </linearGradient>
            <linearGradient id="fallback-grad2" x1="200" y1="0" x2="0" y2="200" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" />
              <stop offset="1" stopColor="#6366F1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Core Pulsing Orb */}
        <div className="absolute w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-2xl shadow-indigo-500/50 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-background/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-2">
            <Sparkles className="w-6 h-6 text-cyan-400 animate-bounce mb-1" />
            <span className="text-[11px] font-bold tracking-wider text-foreground uppercase">
              AI Core
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">
              Live Engine
            </span>
          </div>
        </div>
      </div>

      {/* Floating Metric 1: Technical Accuracy */}
      <div className="absolute top-6 left-4 md:left-8 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-violet-500/30 max-w-[190px] animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
          <span className="text-xs font-semibold text-foreground">Technical Depth</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-violet-400">92%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Benchmark</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Algorithmic accuracy & edge case coverage
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 2: Communication Quality */}
      <div className="absolute bottom-6 left-6 md:left-12 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-cyan-500/30 max-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-foreground">Communication</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-cyan-400">88%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Clarity</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Concise articulation & structured delivery
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 3: Answer Relevance */}
      <div className="absolute top-8 right-4 md:right-8 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-indigo-500/30 max-w-[190px] animate-in fade-in slide-in-from-right-4 duration-700 delay-300">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-foreground">Answer Relevance</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-indigo-400">95%</span>
          <span className="text-[10px] text-muted-foreground uppercase font-mono">Precision</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Direct alignment with target role questions
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>

      {/* Floating Metric 4: Interview Readiness */}
      <div className="absolute bottom-8 right-6 md:right-12 p-3 rounded-2xl glass-panel-elevated shadow-xl border border-emerald-500/30 max-w-[200px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-foreground">Placement Readiness</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-emerald-400">84%</span>
          <span className="text-[10px] text-emerald-400/90 font-mono font-medium">Placement Ready</span>
        </div>
        <p className="text-[10px] text-muted-foreground/90 mt-1 leading-tight">
          Confidence index calculated from 5 rubrics
        </p>
        <span className="text-[8px] text-muted-foreground/60 uppercase font-mono mt-1 block">
          *Illustrative Demo Data
        </span>
      </div>
    </div>
  );
}
