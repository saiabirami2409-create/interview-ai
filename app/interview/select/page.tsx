"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Calculator,
  Code2,
  Layers,
  Video,
  UserCheck,
  CheckCircle2,
  Clock,
  Bot,
  Award,
  Zap,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InterviewSelectPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/chatbot")}
            className="text-xs h-8 gap-1.5 border-purple-500/30 text-purple-600 dark:text-purple-400"
          >
            <Bot className="w-3.5 h-3.5" />
            AI Chatbot Assistant
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10 space-y-10">
        {/* Title Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <Badge className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white border-none shadow-md">
            Interview Preparation Hub • 5-Round Assessment
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Choose Your Interview Experience
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Practice each module individually to target specific competencies, or embark on the full 5-round sequence simulating an end-to-end enterprise hiring funnel.
          </p>
        </div>

        {/* Prominent Card: Full 5-Round Mock Experience */}
        <div className="relative rounded-3xl bg-gradient-to-br from-purple-900/20 via-card to-cyan-950/20 border-2 border-purple-500/40 p-6 md:p-8 shadow-xl space-y-6 overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 via-indigo-600 to-cyan-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider shadow-sm">
            Recommended
          </div>

          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Complete End-to-End Evaluation Loop
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Full 5-Round Enterprise Mock Interview
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Step through all five sequential rounds: Aptitude (Quant, Logic, Verbal) → Technical MCQs & Algorithms → Project Architecture Deep-Dive → Google Meet Behavioral Video (STAR Method) → HR Director Executive Interview. Concludes with a unified equal-weighted performance report.
            </p>
          </div>

          {/* Sequential Step Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">R1: Aptitude</h4>
                <p className="text-[10px] text-muted-foreground truncate">Quant, Logic, Verbal</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">R2: Technical</h4>
                <p className="text-[10px] text-muted-foreground truncate">Role MCQs & Logic</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">R3: Project</h4>
                <p className="text-[10px] text-muted-foreground truncate">Architecture & Tech</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                4
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">R4: Behavioral</h4>
                <p className="text-[10px] text-muted-foreground truncate">Meet UI & STAR</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-card border border-border/70 flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                5
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold truncate">R5: HR Round</h4>
                <p className="text-[10px] text-muted-foreground truncate">Culture & Fit</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Button
              onClick={() => router.push("/aptitude/setup?mode=full")}
              size="lg"
              className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-purple-600/25 px-8 h-12 text-sm gap-2"
            >
              <span>Start Full 5-Round Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 5 Individual Round Cards */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">Or Practice Individual Rounds</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Aptitude Round */}
            <div className="bg-card border border-border/60 hover:border-purple-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold">Round 1: Aptitude Round</h4>
                  <Badge variant="outline" className="text-[10px] text-purple-600 border-purple-200">R1</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Quantitative Aptitude, Logical Reasoning, and Verbal Ability MCQs with instant verification, step-by-step formulas, and speed shortcuts.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Quant, Logic & Verbal Sections</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Step-by-Step Solutions & Hints</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Instant Deterministic Checking</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/aptitude/setup")}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
              >
                <span>Start Aptitude Round</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Card 2: Technical Round */}
            <div className="bg-card border border-border/60 hover:border-violet-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-violet-600/15 text-violet-600 dark:text-violet-400 border border-violet-500/20 flex items-center justify-center">
                  <Code2 className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold">Round 2: Technical Round</h4>
                  <Badge variant="outline" className="text-[10px] text-violet-600 border-violet-200">R2</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Interactive AI-generated MCQs across 12 roles. Practice Mode with instant answer checking or timed Exam Mode with automated scoring.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Practice & Exam Modes</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>12 Standard Software Roles</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Algorithmic & Design Topics</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/technical/setup")}
                className="w-full mt-6 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
              >
                <span>Start Technical Round</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Card 3: Project-Based Interview */}
            <div className="bg-card border border-border/60 hover:border-indigo-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold">Round 3: Project Interview</h4>
                  <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-200">R3</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deep-dive project inquiries with Lead Systems Architect David Chen. Defend architectural choices, data schemas, scalability, and trade-offs.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Project & Resume Grounded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>15 Engineering Inquiry Categories</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>5-Competency Rubric Scoring</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/project/setup")}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
              >
                <span>Start Project Round</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Card 4: Behavioral Round */}
            <div className="bg-card border border-border/60 hover:border-blue-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center">
                  <Video className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold">Round 4: Behavioral Round</h4>
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">R4</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Realistic online Google Meet video environment with Dr. Marcus Vance. Real-time speech-to-text with 5-axis STAR framework scoring.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Google Meet-inspired UI</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Live Camera & Speech-to-Text</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>STAR 5-Dimension Scoring</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/behavioral/setup")}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
              >
                <span>Start Behavioral Round</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Card 5: HR Round */}
            <div className="bg-card border border-border/60 hover:border-cyan-500/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold">Round 5: HR Director Round</h4>
                  <Badge variant="outline" className="text-[10px] text-cyan-600 border-cyan-200">R5</Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Simulate an executive interview with Senior HR Director Sarah Jenkins. Evaluates communication clarity, culture fit, and salary reasoning with optional recording.
                </p>
                <div className="space-y-1.5 pt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>15+ Yrs Senior HR Persona</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>MediaRecorder Video Archiving</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>5 Criteria Rubric Scored</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => router.push("/hr/setup")}
                className="w-full mt-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs h-10 gap-1.5 shadow-sm"
              >
                <span>Start HR Round</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
