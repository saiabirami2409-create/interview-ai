"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Calculator,
  Award,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Zap,
  BookOpen,
  LayoutDashboard,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";
import { AptitudeQuestion } from "@/server/data/aptitude-bank";

function AptitudeResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");

  const [assessment, setAssessment] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/aptitude/session/${assessmentId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load results");
        setAssessment(json.data.assessment);
      })
      .catch((err) => {
        setError(err.message || "Failed to load results");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Calculating aptitude scores and category analytics...</p>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card text-center space-y-4 shadow-xl">
          <Award className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold">Results Unavailable</h2>
          <p className="text-xs text-muted-foreground">{error || "Could not retrieve assessment record."}</p>
          <Button onClick={() => router.push("/aptitude/setup")} className="w-full">
            Back to Setup
          </Button>
        </div>
      </div>
    );
  }

  const { score, correctCount, totalQuestions, timeSpentSeconds, categoryScores = {}, recommendations = [], questions = [], answers = {} } = assessment;
  const incorrectCount = totalQuestions - correctCount;

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <InterviewAILogo size="sm" showWordmark />
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs">
            Round 1 Complete
          </Badge>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Hero Score Banner */}
        <div className="relative rounded-3xl bg-gradient-to-br from-purple-900/25 via-card to-indigo-950/20 border-2 border-purple-500/30 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>ROUND 1 – APTITUDE ASSESSMENT RESULTS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Aptitude Round Summary
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Numerical reasoning, analytical logic, and verbal comprehension report.
            </p>
          </div>

          {/* Big Score Gauge */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-card border border-purple-500/40 shadow-inner min-w-[170px]">
            <span className="text-4xl sm:text-5xl font-black font-mono text-purple-600 dark:text-purple-400">
              {score}%
            </span>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
              Overall Score
            </span>
            <span className="text-[10px] text-muted-foreground">
              {correctCount} / {totalQuestions} Correct
            </span>
          </div>
        </div>

        {/* 5-Round Progress Stepper */}
        <FiveRoundStepper currentRound={1} completedRounds={[1]} />

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground">Total Questions</span>
              <div className="text-2xl font-bold font-mono">{totalQuestions}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Correct
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{correctCount}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] text-destructive font-semibold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Incorrect
              </span>
              <div className="text-2xl font-bold font-mono text-destructive">{incorrectCount}</div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Time Spent
              </span>
              <div className="text-2xl font-bold font-mono">{formatTimer(timeSpentSeconds)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown & AI Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="border-border/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                Category-Wise Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4">
              {Object.keys(categoryScores).length === 0 ? (
                <p className="text-xs text-muted-foreground">No category breakdown available.</p>
              ) : (
                Object.entries(categoryScores).map(([cat, stats]: [string, any]) => (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{cat}</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">
                        {stats.correct} / {stats.total} ({stats.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card className="border-border/60">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Personalized Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              {recommendations.map((rec: string, idx: number) => (
                <div key={idx} className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-foreground flex items-start gap-2.5">
                  <span className="text-purple-500 font-bold shrink-0">💡</span>
                  <p className="leading-relaxed">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Link href="/aptitude/setup">
              <Button variant="outline" size="sm" className="gap-2 text-xs h-10 rounded-xl">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Practice Aptitude Again</span>
              </Button>
            </Link>

            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-xs h-10 rounded-xl text-muted-foreground">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Return to Dashboard</span>
              </Button>
            </Link>
          </div>

          <Link href="/technical/setup">
            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl h-10 px-5 gap-2 shadow-md shadow-purple-600/20"
            >
              <span>Continue to Round 2: Technical Round</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Full Question Review */}
        <div className="space-y-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span>Comprehensive Question Review</span>
          </h3>

          <div className="space-y-4">
            {questions.map((q: AptitudeQuestion, idx: number) => {
              const userAns = answers[q.id];
              const isCorrect = userAns && userAns.toUpperCase() === q.correctAnswer.toUpperCase();

              return (
                <Card key={q.id} className="border-border/60 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Q{idx + 1}
                        </Badge>
                        <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                          {q.category} • {q.subtopic}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground leading-snug">{q.question}</h4>
                    </div>

                    <Badge
                      className={`text-[10px] shrink-0 ${
                        isCorrect
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-destructive/20 text-destructive border border-destructive/30"
                      }`}
                    >
                      {isCorrect ? "Correct" : userAns ? "Incorrect" : "Skipped"}
                    </Badge>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {(["A", "B", "C", "D"] as const).map((opt) => {
                      const isUserSelection = userAns === opt;
                      const isRightChoice = q.correctAnswer === opt;
                      let optClass = "border-border/60 bg-muted/30 text-muted-foreground";
                      if (isRightChoice) {
                        optClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold";
                      } else if (isUserSelection && !isRightChoice) {
                        optClass = "border-destructive bg-destructive/10 text-destructive font-semibold";
                      }
                      return (
                        <div key={opt} className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${optClass}`}>
                          <span>
                            <strong>{opt}.</strong> {q.options[opt]}
                          </span>
                          {isRightChoice && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Block */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2 mt-2">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                      <Calculator className="w-3 h-3 text-purple-500" />
                      <span>Solution:</span>
                    </div>
                    <pre className="text-muted-foreground font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                      {q.stepByStepSolution || q.explanation}
                    </pre>
                    {q.formula && (
                      <div className="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                        Formula: {q.formula}
                      </div>
                    )}
                    {q.shortcutMethod && (
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400">
                        ⚡ Shortcut: {q.shortcutMethod}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AptitudeResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AptitudeResultsContent />
    </React.Suspense>
  );
}
