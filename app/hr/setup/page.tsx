"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Bot,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

const EXPERIENCE_LEVELS = [
  { id: "INTERN", label: "College Intern", desc: "Foundational knowledge, curiosity, learning aptitude" },
  { id: "FRESHER", label: "Fresher / Graduate (0-1 yr)", desc: "Core computer science, academic projects, enthusiasm" },
  { id: "JUNIOR", label: "Junior (1-3 yrs)", desc: "Production feature delivery, code review experience" },
  { id: "MID", label: "Mid-Level (3-5 yrs)", desc: "System design, cross-functional collaboration, ownership" },
  { id: "SENIOR", label: "Senior (5+ yrs)", desc: "Architectural strategy, mentorship, team leadership" },
];

const INTERVIEW_TONES = [
  { id: "PROFESSIONAL", label: "Professional & Supportive", desc: "Warm, structured, encouraging, thorough" },
  { id: "RIGOROUS", label: "Rigorous & Direct", desc: "Challenging follow-ups, depth probing, high standards" },
  { id: "CONVERSATIONAL", label: "Conversational & Casual", desc: "Dialogue-oriented, storytelling, cultural fit focus" },
];

function HRSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSession = searchParams.get("fromSession");
  const initialRole = searchParams.get("role") || "Software Engineer";
  const initialCompany = searchParams.get("company") || "Google";

  const [role, setRole] = React.useState(initialRole);
  const [company, setCompany] = React.useState(initialCompany);
  const [experienceLevel, setExperienceLevel] = React.useState("FRESHER");
  const [tone, setTone] = React.useState("PROFESSIONAL");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleStartHR = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/hr/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          company,
          experienceLevel,
          tone,
          fromSession: fromSession || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to configure HR interview");
      }

      const sessionId = json.data?.sessionId || json.sessionId;
      router.push(
        `/hr/prejoin?sessionId=${sessionId}&role=${encodeURIComponent(role)}&company=${encodeURIComponent(
          company
        )}`
      );
    } catch (err: any) {
      setError(err.message || "Failed to initialize HR round. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            href={fromSession ? `/behavioral/results?sessionId=${fromSession}` : "/dashboard"}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
            Round 5: HR Round
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={5} completedRounds={[1, 2, 3, 4]} />

        <div className="text-center max-w-xl mx-auto space-y-2">
          <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none">
            Round 5: HR Director Interview (Final Round)
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Configure HR Interview
          </h1>
          <p className="text-sm text-muted-foreground">
            Connect with Sarah Jenkins, Senior HR Director (15+ years experience) to test cultural resonance, communication, and executive presence.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Target Role & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <label className="text-xs font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                Target Job Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Software Engineer"
              />
            </div>

            <div className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-2">
              <label className="text-xs font-bold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-500" />
                Hiring Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Google"
              />
            </div>
          </div>

          {/* Experience Level Selection */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-bold flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-500" />
                Candidate Experience Level
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                The HR Director calibrates evaluation rubrics according to career stage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const isSelected = experienceLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceLevel(lvl.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{lvl.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {lvl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interview Tone Selection */}
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <label className="text-sm font-bold flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-500" />
                Interview Tone & Demeanor
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Adjust how direct and rigorous the interviewer follow-up prompts will feel.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INTERVIEW_TONES.map((t) => {
                const isSelected = tone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20 shadow-sm"
                        : "border-border/70 hover:border-border hover:bg-card/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{t.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {t.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              onClick={handleStartHR}
              disabled={loading || !role.trim()}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 px-8 h-12 gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Connecting to HR Director...</span>
                </>
              ) : (
                <>
                  <span>Continue to Device Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HRSetupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <HRSetupContent />
    </React.Suspense>
  );
}
