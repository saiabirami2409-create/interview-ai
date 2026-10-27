"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Zap,
  BookOpen,
  Send,
  AlertCircle,
  RotateCcw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";
import { useActiveInterview } from "@/context/ActiveInterviewContext";
import { AptitudeQuestion } from "@/server/data/aptitude-bank";
import { AptitudeAnswerVerification } from "@/server/ai/aptitude-service";

function AptitudeQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");

  const [questions, setQuestions] = React.useState<AptitudeQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [skipped, setSkipped] = React.useState<Record<string, boolean>>({});
  const [verifications, setVerifications] = React.useState<Record<string, AptitudeAnswerVerification>>({});
  const [showHint, setShowHint] = React.useState<Record<string, boolean>>({});
  const [showExplanation, setShowExplanation] = React.useState<Record<string, boolean>>({});
  const [checkingAnswer, setCheckingAnswer] = React.useState(false);
  const [submittingRound, setSubmittingRound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = React.useState(20 * 60);
  const [timeSpentSeconds, setTimeSpentSeconds] = React.useState(0);

  // Load Assessment Questions
  React.useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided");
      setLoading(false);
      return;
    }

    fetch(`/api/aptitude/session/${assessmentId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load questions");
        const ass = json.data.assessment;
        setQuestions(ass.questions || []);
        setTimeLeftSeconds((ass.timeLimitMinutes || 20) * 60);
      })
      .catch((err) => {
        setError(err.message || "Failed to load assessment");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [assessmentId]);

  // Timer countdown
  React.useEffect(() => {
    if (loading || submittingRound || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeSpentSeconds((s) => s + 1);
      setTimeLeftSeconds((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitAssessment();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submittingRound, questions.length]);

  const currentQ = questions[currentIdx];
  const { setActiveQuestion } = useActiveInterview();

  React.useEffect(() => {
    if (!currentQ) {
      setActiveQuestion(null);
      return;
    }
    setActiveQuestion({
      roundNumber: 1,
      roundName: "Aptitude Round",
      questionId: currentQ.id,
      questionText: currentQ.question,
      category: currentQ.category,
      options: currentQ.options,
      onAnswerSubmit: async (ans) => {
        const upper = ans.trim().toUpperCase();
        let selectedOpt: "A" | "B" | "C" | "D" | null = null;
        if (["A", "B", "C", "D"].includes(upper)) {
          selectedOpt = upper as any;
        } else {
          const match = upper.match(/\b([A-D])\b/);
          if (match) selectedOpt = match[1] as any;
        }
        if (selectedOpt) {
          handleSelectOption(selectedOpt);
        }
      },
    });
    return () => setActiveQuestion(null);
  }, [currentQ?.id, currentQ?.question, setActiveQuestion]);

  const handleSelectOption = (opt: "A" | "B" | "C" | "D") => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
    setSkipped((prev) => ({ ...prev, [currentQ.id]: false }));
  };

  const handleCheckAnswer = async () => {
    if (!currentQ) return;
    const selected = answers[currentQ.id];
    if (!selected) {
      alert("Please select an answer option (A, B, C, or D) before checking.");
      return;
    }

    setCheckingAnswer(true);
    try {
      const res = await fetch("/api/aptitude/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ,
          selectedOption: selected,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Verification failed");
      }

      setVerifications((prev) => ({ ...prev, [currentQ.id]: json.data }));
      setShowExplanation((prev) => ({ ...prev, [currentQ.id]: true }));
    } catch (err: any) {
      alert(err.message || "Failed to verify answer");
    } finally {
      setCheckingAnswer(false);
    }
  };

  const handleSkipQuestion = () => {
    if (!currentQ) return;
    setSkipped((prev) => ({ ...prev, [currentQ.id]: true }));
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleSubmitAssessment = async () => {
    if (submittingRound) return;
    setSubmittingRound(true);

    try {
      const res = await fetch("/api/aptitude/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId,
          answers,
          timeSpentSeconds,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit assessment");
      }

      router.push(`/aptitude/results?assessmentId=${assessmentId}`);
    } catch (err: any) {
      alert(err.message || "Failed to submit assessment");
      setSubmittingRound(false);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAutoStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/aptitude/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "Mixed",
          difficulty: "Mixed",
          questionCount: 10,
          timeLimitMinutes: 20,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.assessmentId) {
        router.push(`/aptitude/questions?assessmentId=${json.data.assessmentId}`);
      } else {
        router.push("/aptitude/setup");
      }
    } catch {
      router.push("/aptitude/setup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading verified aptitude questions...</p>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Round 1 Aptitude Assessment</h2>
          <p className="text-xs text-muted-foreground">
            {error || "Could not locate an active aptitude assessment session. Start fresh to begin Round 1."}
          </p>
          <div className="space-y-2 pt-2">
            <Button onClick={handleAutoStart} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              <Zap className="w-4 h-4 mr-1.5" />
              Start Round 1 Now
            </Button>
            <Button variant="outline" onClick={() => router.push("/aptitude/setup")} className="w-full">
              Configure Questions & Time Limit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const selectedOption = answers[currentQ.id];
  const currentVerification = verifications[currentQ.id];
  const isChecked = Boolean(currentVerification);
  const isHintRevealed = Boolean(showHint[currentQ.id]);
  const isExplanationRevealed = Boolean(showExplanation[currentQ.id]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header Bar */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <InterviewAILogo size="sm" showWordmark />
          <div className="h-5 w-px bg-border/60" />
          <Badge className="bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs">
            Round 1: Aptitude
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-xs font-bold ${
              timeLeftSeconds < 180
                ? "bg-destructive/10 border-destructive/40 text-destructive animate-pulse"
                : "bg-muted/60 border-border text-foreground"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSubmitAssessment}
            disabled={submittingRound}
            className="text-xs font-bold border-purple-500/30 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          >
            {submittingRound ? "Submitting..." : "Submit Round"}
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question Details & Verification Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Question Card */}
          <Card className="border-border/70 shadow-lg">
            <CardHeader className="p-5 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Question {currentIdx + 1} of {questions.length}
                  </Badge>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {currentQ.category} • {currentQ.subtopic}
                  </span>
                </div>
                <Badge
                  className={`text-[10px] ${
                    currentQ.difficulty === "Advanced"
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      : currentQ.difficulty === "Beginner"
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  }`}
                >
                  {currentQ.difficulty}
                </Badge>
              </div>

              <CardTitle className="text-base sm:text-lg font-bold text-foreground mt-3 leading-relaxed">
                {currentQ.question}
              </CardTitle>
            </CardHeader>

            {/* Options List */}
            <CardContent className="p-5 space-y-3">
              {(["A", "B", "C", "D"] as const).map((optKey) => {
                const optText = currentQ.options[optKey];
                const isSelected = selectedOption === optKey;
                const isCorrectOption = currentQ.correctAnswer === optKey;

                let optionStyles = "border-border/70 hover:border-purple-500/60 bg-card hover:bg-muted/40";
                if (isChecked) {
                  if (isCorrectOption) {
                    optionStyles = "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/20";
                  } else if (isSelected && !isCorrectOption) {
                    optionStyles = "border-destructive bg-destructive/15 text-destructive font-semibold ring-2 ring-destructive/20";
                  }
                } else if (isSelected) {
                  optionStyles = "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/20 font-semibold";
                }

                return (
                  <div
                    key={optKey}
                    onClick={() => handleSelectOption(optKey)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${optionStyles}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isChecked && isCorrectOption
                            ? "bg-emerald-500 text-white"
                            : isChecked && isSelected
                            ? "bg-destructive text-white"
                            : isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {optKey}
                      </div>
                      <span className="text-sm leading-normal">{optText}</span>
                    </div>

                    {isChecked && isCorrectOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    )}
                    {isChecked && isSelected && !isCorrectOption && (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
            <div className="flex items-center gap-2">
              {/* Get Hint */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHint((prev) => ({ ...prev, [currentQ.id]: !isHintRevealed }))}
                className="text-xs h-9 gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{isHintRevealed ? "Hide Hint" : "Get Hint"}</span>
              </Button>

              {/* Check Answer */}
              <Button
                size="sm"
                onClick={handleCheckAnswer}
                disabled={!selectedOption || checkingAnswer}
                className="text-xs h-9 font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white gap-1.5 shadow-sm"
              >
                {checkingAnswer ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Check Answer</span>
                  </>
                )}
              </Button>

              {/* Show Explanation toggle */}
              {isChecked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExplanation((prev) => ({ ...prev, [currentQ.id]: !isExplanationRevealed }))}
                  className="text-xs h-9 gap-1.5 text-purple-600 dark:text-purple-400"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{isExplanationRevealed ? "Hide Explanation" : "Show Explanation"}</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipQuestion}
                className="text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                Skip Question
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="text-xs h-9 px-3 gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              {currentIdx < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="text-xs h-9 px-4 gap-1 bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleSubmitAssessment}
                  disabled={submittingRound}
                  className="text-xs h-9 px-4 gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-600/20"
                >
                  <span>Submit Round</span>
                  <Check className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* HINT BANNER */}
          {isHintRevealed && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Conceptual Hint</span>
              </div>
              <p className="leading-relaxed">{currentQ.hint}</p>
            </div>
          )}

          {/* VERIFICATION & EXPLANATION PANEL (Requirement 3) */}
          {isChecked && isExplanationRevealed && currentVerification && (
            <div
              className={`p-5 rounded-2xl border text-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-md ${
                currentVerification.isCorrect
                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-100"
                  : "bg-destructive/10 border-destructive/40 text-foreground"
              }`}
            >
              {/* Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  {currentVerification.isCorrect ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                      ✓
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center font-bold">
                      ✕
                    </div>
                  )}
                  <div>
                    <h4
                      className={`text-sm font-extrabold ${
                        currentVerification.isCorrect ? "text-emerald-500" : "text-destructive"
                      }`}
                    >
                      {currentVerification.statusText}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Selected: Option {currentVerification.selectedOption} • Correct Answer: Option{" "}
                      {currentVerification.correctOption}
                    </p>
                  </div>
                </div>

                <Badge
                  className={`text-[10px] ${
                    currentVerification.isCorrect
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-destructive/20 text-destructive border border-destructive/30"
                  }`}
                >
                  {currentVerification.isCorrect ? "100% Verified" : "Needs Review"}
                </Badge>
              </div>

              {/* Step-by-step Solution */}
              <div className="space-y-1.5">
                <h5 className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                  <Calculator className="w-3.5 h-3.5 text-purple-500" />
                  <span>Step-by-Step Solution:</span>
                </h5>
                <pre className="p-3 rounded-xl bg-card/80 border border-border/60 text-foreground font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {currentVerification.stepByStepSolution || currentVerification.explanation}
                </pre>
              </div>

              {/* Relevant Formula */}
              {currentVerification.formula && (
                <div className="space-y-1">
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">
                    Relevant Formula:
                  </span>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 font-mono text-[11px] text-purple-700 dark:text-purple-300">
                    {currentVerification.formula}
                  </div>
                </div>
              )}

              {/* Faster Shortcut Method */}
              {currentVerification.shortcutMethod && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-900 dark:text-cyan-200 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Faster Shortcut Method:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{currentVerification.shortcutMethod}</p>
                </div>
              )}

              {/* Common Mistake to Avoid (if incorrect) */}
              {!currentVerification.isCorrect && currentVerification.commonMistake && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Common Mistake & Conceptual Trap:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{currentVerification.commonMistake}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Question Navigator Palette (1 col) */}
        <div className="space-y-4">
          <Card className="border-border/70 shadow-sm sticky top-24">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Question Palette
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-4">
              <div className="grid grid-cols-5 gap-1.5">
                {questions.map((q, idx) => {
                  const isAnswered = Boolean(answers[q.id]);
                  const isQSkipped = Boolean(skipped[q.id]);
                  const isCurrent = currentIdx === idx;
                  const isQVerified = verifications[q.id];

                  let btnClass = "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted";
                  if (isCurrent) {
                    btnClass = "border-purple-600 bg-purple-600 text-white font-bold ring-2 ring-purple-500/30";
                  } else if (isQVerified) {
                    btnClass = isQVerified.isCorrect
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                      : "bg-destructive/20 border-destructive text-destructive font-bold";
                  } else if (isAnswered) {
                    btnClass = "bg-purple-500/20 border-purple-500 text-purple-600 dark:text-purple-400 font-semibold";
                  } else if (isQSkipped) {
                    btnClass = "bg-amber-500/15 border-amber-500/40 text-amber-500";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      className={`h-8 rounded-lg text-xs border transition-all ${btnClass}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="pt-3 border-t border-border/50 space-y-1.5 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-purple-600 text-white text-[8px] flex items-center justify-center font-bold">✓</span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500" />
                  <span>Verified Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-destructive/20 border border-destructive" />
                  <span>Verified Incorrect</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-muted/60 border border-border/60" />
                  <span>Not Attempted</span>
                </div>
              </div>

              {/* Submit Round Button */}
              <Button
                onClick={handleSubmitAssessment}
                disabled={submittingRound}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs h-10 shadow-md gap-1.5 mt-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Aptitude Round</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function AptitudeQuestionsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AptitudeQuestionsContent />
    </React.Suspense>
  );
}
