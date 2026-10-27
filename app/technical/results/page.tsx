"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Target,
  BarChart3,
  Brain,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Award,
  Printer,
  ChevronRight,
  Code2,
  Video,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

interface QuestionResult {
  id: string;
  orderIndex: number;
  questionText: string;
  difficulty: string;
  topic: string;
  options: Record<string, string>;
  userAnswer: string | null;
  correctOption: string;
  isCorrect: boolean;
  isSkipped: boolean;
  explanation: string;
}

interface ResultsState {
  sessionId: string;
  targetRole: string;
  title: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  scorePercentage: number;
  questions: QuestionResult[];
}

function TechnicalResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  const [data, setData] = React.useState<ResultsState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "correct" | "incorrect" | "skipped">("all");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionId) {
      setError("No session ID specified.");
      setLoading(false);
      return;
    }

    fetch(`/api/technical/results/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to fetch technical results.");
        }
        setData(json.data);
      })
      .catch((err) => {
        setError(err.message || "Could not retrieve assessment results.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Calculating Technical Score & Insights...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Results Unavailable</h2>
          <p className="text-sm text-muted-foreground">{error || "Could not find technical evaluation data."}</p>
          <Button onClick={() => router.push("/technical/setup")} className="w-full">
            Start New Technical Round
          </Button>
        </div>
      </div>
    );
  }

  const filteredQuestions = data.questions.filter((q) => {
    if (filter === "correct") return q.isCorrect;
    if (filter === "incorrect") return !q.isCorrect && !q.isSkipped;
    if (filter === "skipped") return q.isSkipped;
    return true;
  });

  const getPerformanceBadge = (pct: number) => {
    if (pct >= 85) return { label: "Excellent Readiness", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" };
    if (pct >= 70) return { label: "Very Good", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" };
    if (pct >= 50) return { label: "Moderate Competency", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" };
    return { label: "Needs Practice", color: "bg-red-500/10 text-red-600 border-red-500/20" };
  };

  const badgeInfo = getPerformanceBadge(data.scorePercentage);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-8 gap-1.5 hidden sm:flex"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={2} completedRounds={[1, 2]} />

        {/* Hero Score Card */}
        <section className="bg-gradient-to-br from-card via-card to-purple-500/5 border border-border/70 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="outline" className={`text-xs ${badgeInfo.color}`}>
                  {badgeInfo.label}
                </Badge>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Round 2 Complete
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {data.targetRole} Technical Evaluation
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                You scored <span className="font-bold text-foreground">{data.correctCount}</span> out of{" "}
                <span className="font-bold text-foreground">{data.totalQuestions}</span> questions correctly.
                Detailed breakdowns and explanations for all technical concepts are available below.
              </p>
            </div>

            {/* Circular Percentage Pill */}
            <div className="flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/20 shrink-0">
              <span className="text-4xl font-extrabold">{data.scorePercentage}%</span>
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">Score</span>
            </div>
          </div>

          {/* Next Round CTA Banner */}
          <div className="mt-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-cyan-600/15 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Proceed to Round 3: Project-Based Interview</h4>
                <p className="text-xs text-muted-foreground">Explain your technical projects, system architecture, database choices, and key engineering trade-offs.</p>
              </div>
            </div>

            <Button
              onClick={() => router.push(`/project/setup?fromSession=${data.sessionId}&role=${encodeURIComponent(data.targetRole)}`)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs h-10 px-5 gap-2 shadow-md shadow-purple-600/25 shrink-0"
            >
              <span>Start Project Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* 4 Stats Cards Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold">Total Questions</span>
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{data.totalQuestions}</div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-xs font-semibold">Correct</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.correctCount}</div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-destructive mb-1">
              <span className="text-xs font-semibold">Incorrect</span>
              <XCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-destructive">{data.incorrectCount}</div>
          </div>

          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-xs font-semibold">Skipped</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold">{data.skippedCount}</div>
          </div>
        </section>

        {/* Question-by-Question Review Header & Filters */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Question-by-Question Detailed Review</h2>
              <p className="text-xs text-muted-foreground">
                Inspect your submitted answer, the optimal solution, and educational reasoning.
              </p>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60 text-xs">
              {(["all", "correct", "incorrect", "skipped"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilter(mode)}
                  className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${
                    filter === mode
                      ? "bg-purple-600 text-white font-bold shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* List of Questions */}
          <div className="space-y-4">
            {filteredQuestions.map((q, idx) => {
              const isExpanded = expandedId === q.id || filter !== "all";

              return (
                <div
                  key={q.id}
                  className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4 transition-all"
                >
                  <div
                    onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                    className="flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">
                          Q{q.orderIndex + 1}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            q.isCorrect
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : q.isSkipped
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-destructive/10 text-destructive border-destructive/20"
                          }`}
                        >
                          {q.isCorrect ? "Correct" : q.isSkipped ? "Skipped" : "Incorrect"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {q.topic}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          {q.difficulty}
                        </Badge>
                      </div>

                      <h3 className="text-sm md:text-base font-semibold leading-relaxed pt-1">
                        {q.questionText}
                      </h3>
                    </div>

                    <button className="text-muted-foreground p-1 hover:text-foreground">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {(["A", "B", "C", "D"] as const).map((optKey) => {
                          const optionText = q.options[optKey];
                          if (!optionText) return null;

                          const isUserChoice = q.userAnswer === optKey;
                          const isCorrectOption = q.correctOption === optKey;

                          let style = "border-border/60 bg-muted/20 text-muted-foreground";
                          if (isCorrectOption) {
                            style =
                              "border-emerald-500/60 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-semibold";
                          } else if (isUserChoice && !q.isCorrect) {
                            style =
                              "border-destructive/60 bg-destructive/10 text-destructive font-semibold";
                          }

                          return (
                            <div
                              key={optKey}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${style}`}
                            >
                              <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                {optKey}
                              </span>
                              <span className="flex-1 leading-relaxed">{optionText}</span>
                              {isCorrectOption && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {isUserChoice && !isCorrectOption && (
                                <XCircle className="w-4 h-4 text-destructive shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-foreground/90 space-y-1">
                          <span className="font-bold text-purple-600 dark:text-purple-400 block">
                            💡 Conceptual Explanation:
                          </span>
                          <p className="leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => router.push("/technical/setup")}
            className="text-xs h-9 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake Technical Round
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="text-xs h-9"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() =>
                router.push(`/project/setup?fromSession=${data.sessionId}&role=${encodeURIComponent(data.targetRole)}`)
              }
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-purple-600/20"
            >
              <span>Continue to Project Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TechnicalResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TechnicalResultsContent />
    </React.Suspense>
  );
}
