"use client";

import * as React from "react";
import { Bot, Sparkles, Volume2, Mic, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

export type InterviewerState = "waiting" | "asking" | "listening" | "processing" | "evaluating";

interface InterviewerVisualizerProps {
  state: InterviewerState;
  className?: string;
}

export function InterviewerVisualizer({ state, className }: InterviewerVisualizerProps) {
  const getStatusDetails = () => {
    switch (state) {
      case "asking":
        return {
          label: "Presenting Question",
          color: "text-violet-400",
          ringColor: "border-violet-500",
          glowColor: "shadow-violet-500/30",
          icon: Volume2,
        };
      case "listening":
        return {
          label: "Listening & Recording Draft",
          color: "text-cyan-400",
          ringColor: "border-cyan-400",
          glowColor: "shadow-cyan-400/30",
          icon: Mic,
        };
      case "processing":
      case "evaluating":
        return {
          label: "AI Evaluating Rubrics...",
          color: "text-amber-400",
          ringColor: "border-amber-400",
          glowColor: "shadow-amber-400/30",
          icon: Cpu,
        };
      default:
        return {
          label: "Interviewer Ready",
          color: "text-primary",
          ringColor: "border-primary",
          glowColor: "shadow-primary/20",
          icon: Bot,
        };
    }
  };

  const status = getStatusDetails();
  const Icon = status.icon;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-6 rounded-3xl bg-card/60 border border-border/60 backdrop-blur-xl overflow-hidden select-none",
        className
      )}
    >
      {/* Background ambient radial glow */}
      <div
        className={cn(
          "absolute w-44 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-700",
          state === "asking" && "bg-violet-600/25",
          state === "listening" && "bg-cyan-500/25",
          (state === "processing" || state === "evaluating") && "bg-amber-500/25",
          state === "waiting" && "bg-primary/20"
        )}
      />

      {/* Animated Orb / Avatar Core */}
      <div className="relative flex items-center justify-center my-4">
        {/* Outer Orbiting Ring */}
        <div
          className={cn(
            "w-28 h-28 rounded-full border-2 border-dashed transition-all duration-500",
            status.ringColor,
            (state === "processing" || state === "evaluating") && "animate-[spin_4s_linear_infinite]",
            state === "asking" && "animate-[spin_12s_linear_infinite]",
            state === "listening" && "animate-[spin_20s_linear_infinite]",
            state === "waiting" && "animate-[spin_30s_linear_infinite]"
          )}
        />

        {/* Middle Pulse Ring */}
        <div
          className={cn(
            "absolute w-22 h-22 rounded-full border opacity-60 transition-transform duration-300",
            status.ringColor,
            state === "listening" ? "scale-110 animate-pulse" : "scale-100"
          )}
        />

        {/* Center Orb */}
        <div
          className={cn(
            "absolute w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300",
            status.glowColor,
            state === "asking" && "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white scale-105",
            state === "listening" && "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white",
            (state === "processing" || state === "evaluating") && "bg-gradient-to-tr from-amber-500 to-rose-500 text-white scale-95 animate-pulse",
            state === "waiting" && "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
          )}
        >
          <Icon className="w-8 h-8 animate-in zoom-in-75 duration-200" />
        </div>
      </div>

      {/* State Badge & Caption */}
      <div className="mt-2 text-center space-y-1 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 border border-border/50 text-[11px] font-mono font-medium shadow-sm">
          <span className={cn("w-2 h-2 rounded-full animate-ping", status.color.replace("text-", "bg-"))} />
          <span className={status.color}>{status.label}</span>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono">
          AI Evaluation Engine • 5-Axis Rubrics
        </p>
      </div>
    </div>
  );
}
