"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Cpu,
  Layers,
  Award,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Lightbulb,
  ShieldCheck,
  UserCheck,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";
import { ProjectQuestion, ProjectDetails, ProjectEvaluationResult } from "@/server/ai/project-service";

interface ProjectResultData {
  id: string;
  projectDetails: ProjectDetails;
  questions: ProjectQuestion[];
  candidateAnswers: Record<string, { selectedOption?: string; transcript?: string; durationSeconds?: number }>;
  evaluations: Record<string, ProjectEvaluationResult>;
  score: number;
  understandingScore?: number;
  technicalScore?: number;
  problemSolvingScore?: number;
  implementationScore?: number;
  contributionScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
}

function ProjectResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ProjectResultData | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/project/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.session) {
          setData(json.data.session);
        }
      })
      .catch((err) => {
        console.error("Failed to load project results:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-slate-500">Synthesizing Architectural Review...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Results Not Found</h2>
          <Button onClick={() => router.push("/project/setup")} className="w-full bg-purple-600 hover:bg-purple-700">
            Start Project Interview
          </Button>
        </div>
      </div>
    );
  }

  const overall = Math.round(data.score || 75);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />
            <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 font-semibold">
              Round 3 • Project Performance Report
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Dashboard
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={3} completedRounds={[1, 2, 3]} />

        {/* Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Round 3 Evaluation Complete</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {data.projectDetails.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Architectural deep dive review conducted by Principal Architect David Chen.
            </p>
          </div>

          <div className="relative w-32 h-32 rounded-3xl bg-slate-950/80 border border-indigo-500/40 flex flex-col items-center justify-center shadow-xl shrink-0">
            <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
              {overall}%
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">
              Project Score
            </span>
          </div>
        </div>

        {/* 5-Dimension Competency Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Understanding", score: data.understandingScore ?? overall },
            { label: "Technical Depth", score: data.technicalScore ?? overall },
            { label: "Problem Solving", score: data.problemSolvingScore ?? overall },
            { label: "Implementation", score: data.implementationScore ?? overall },
            { label: "Contribution", score: data.contributionScore ?? overall },
          ].map((item, idx) => (
            <Card key={idx} className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {item.label}
              </span>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">
                {Math.round(item.score)}%
              </p>
            </Card>
          ))}
        </div>

        {/* Strengths & Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Identified Engineering Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.strengths && data.strengths.length > 0 ? (
                data.strengths.map((str, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Solid fundamental architecture presentation.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Architectural Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {data.recommendations && data.recommendations.length > 0 ? (
                data.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Continue detailing latency profiling and telemetry metrics.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Journey Card: Proceed to Round 4 (Behavioral) */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>Ready for Round 4?</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Continue your sequential interview loop with the AI Behavioral Round.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href="/project/setup"
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Practice Project Again
            </Link>

            <Link
              href={`/behavioral/setup?fromSession=${data.id}&role=${encodeURIComponent(data.projectDetails?.candidateRole || "Software Engineer")}`}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition flex items-center gap-1.5"
            >
              <span>Proceed to Round 4: Behavioral Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Detailed Question & Answer Breakdown */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Project MCQ Breakdown & Engineering Rationales ({data.questions.length})</span>
          </h3>

          <div className="space-y-3">
            {data.questions.map((q, idx) => {
              const answerObj = data.candidateAnswers[q.id];
              const selectedOpt = answerObj?.selectedOption || (typeof answerObj === "string" ? answerObj : null);
              const isCorrect = selectedOpt === q.correctOption;
              const isExpanded = expandedId === q.id;

              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(q.id)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                            : selectedOpt
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {q.category}
                        </span>
                        <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
                          {q.questionText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isCorrect ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Correct
                        </Badge>
                      ) : selectedOpt ? (
                        <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                          Incorrect
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                          Skipped
                        </Badge>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                      <div>
                        <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">
                          Inquiry:
                        </span>
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                          {q.questionText}
                        </p>
                      </div>

                      {/* 4 Options Grid */}
                      {q.options && (
                        <div className="space-y-2 pt-1">
                          <span className="font-bold text-[10px] uppercase text-slate-400 block">
                            Options & Choices:
                          </span>
                          <div className="space-y-2">
                            {(["A", "B", "C", "D"] as const).map((optKey) => {
                              const isCandidateChoice = selectedOpt === optKey;
                              const isCorrectChoice = q.correctOption === optKey;
                              const optText = q.options[optKey];

                              let borderClass = "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40";
                              let badgeColor = "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300";

                              if (isCorrectChoice) {
                                borderClass = "border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-400/40";
                                badgeColor = "bg-emerald-600 text-white";
                              } else if (isCandidateChoice && !isCorrectChoice) {
                                borderClass = "border-rose-300 dark:border-rose-700/60 bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/40";
                                badgeColor = "bg-rose-600 text-white";
                              }

                              return (
                                <div
                                  key={optKey}
                                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition ${borderClass}`}
                                >
                                  <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 ${badgeColor}`}>
                                    {optKey}
                                  </span>
                                  <span className="flex-1 leading-relaxed text-xs">
                                    {optText}
                                  </span>
                                  {isCorrectChoice && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 shrink-0 self-center">
                                      Correct Answer
                                    </span>
                                  )}
                                  {isCandidateChoice && !isCorrectChoice && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600 dark:text-rose-400 shrink-0 self-center">
                                      Your Selection
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 space-y-1.5">
                          <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                            <Lightbulb className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Architectural Rationale:
                          </span>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProjectResultsContent />
    </React.Suspense>
  );
}
