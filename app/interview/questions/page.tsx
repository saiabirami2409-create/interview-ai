"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Brain,
  Code2,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Check,
  X,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface QuestionItem {
  id: string;
  orderIndex: number;
  questionText: string;
  difficulty: "Intermediate" | "Advanced";
  topic: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  hints?: string;
  correctOption?: string;
  explanation?: string;
}

interface AssessmentMeta {
  id: string;
  jobRole: string;
  topics: string[];
  questionCount: number;
  durationMinutes: number;
  deadlineAt: string;
}

interface CheckedState {
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
  selectedOption: string;
}

function TechnicalAssessmentQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id") || searchParams.get("sessionId");

  const [assessment, setAssessment] = React.useState<AssessmentMeta | null>(null);
  const [questions, setQuestions] = React.useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // User selections & interaction states
  const [answers, setAnswers] = React.useState<Record<string, "A" | "B" | "C" | "D" | null>>({});
  const [checkedAnswers, setCheckedAnswers] = React.useState<Record<string, CheckedState>>({});
  const [shownHints, setShownHints] = React.useState<Record<string, boolean>>({});

  // Timer & API states
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [checkingAnswer, setCheckingAnswer] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load Assessment and Questions
  React.useEffect(() => {
    if (!assessmentId) {
      setError("No assessment ID provided. Please configure your interview from the setup page.");
      setLoading(false);
      return;
    }

    // Try primary interviews endpoint, fall back to technical results endpoint
    fetch(`/api/interviews/${assessmentId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          return fetch(`/api/technical/results/${assessmentId}`).then((r) => r.json());
        }
        return json;
      })
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load assessment.");
        }

        const data = json.data;
        const rawQuestions = data.questions || [];
        if (rawQuestions.length === 0) {
          throw new Error("No technical questions found in this assessment session.");
        }

        const formattedQuestions: QuestionItem[] = rawQuestions.map((q: any, idx: number) => {
          let opts = { A: "", B: "", C: "", D: "" };
          if (q.options) {
            if (typeof q.options === "string") {
              try {
                opts = JSON.parse(q.options);
              } catch {}
            } else if (typeof q.options === "object") {
              opts = q.options;
            }
          }

          return {
            id: q.id || q.questionId || `q_${idx + 1}`,
            orderIndex: q.orderIndex ?? idx + 1,
            questionText: q.questionText || q.question || "Technical Interview Question",
            difficulty: q.difficulty === "Advanced" ? "Advanced" : "Intermediate",
            topic: q.topic || q.category || "Core Concepts",
            options: opts,
            hints: q.hints || q.hint || `Focus on ${q.topic || "core principles"} and consider runtime complexity.`,
            correctOption: q.correctOption,
            explanation: q.explanation,
          };
        });

        setQuestions(formattedQuestions);

        // Prepopulate existing answers
        const initialAnswers: Record<string, "A" | "B" | "C" | "D" | null> = {};
        const initialChecked: Record<string, CheckedState> = {};

        rawQuestions.forEach((q: any) => {
          const qId = q.id || q.questionId;
          if (q.selectedOption) {
            initialAnswers[qId] = q.selectedOption;
          } else if (q.userAnswer) {
            initialAnswers[qId] = q.userAnswer;
          } else {
            initialAnswers[qId] = null;
          }

          if (q.isAnswerChecked && q.correctOption) {
            initialChecked[qId] = {
              isCorrect: Boolean(q.isCorrect),
              correctOption: q.correctOption,
              explanation: q.explanation || "Detailed concept explanation available.",
              selectedOption: q.selectedOption || q.userAnswer,
            };
          }
        });

        setAnswers(initialAnswers);
        setCheckedAnswers(initialChecked);

        // Set metadata & calculate timer
        const duration = data.assessment?.durationMinutes || data.durationMinutes || 15;
        const deadline = data.assessment?.deadlineAt || data.deadlineAt;
        const deadlineMs = deadline ? new Date(deadline).getTime() : Date.now() + duration * 60 * 1000;
        const diffSeconds = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
        setRemainingSeconds(diffSeconds);

        setAssessment({
          id: assessmentId,
          jobRole: data.assessment?.jobRole || data.targetRole || data.jobRole || "Software Engineer",
          topics: data.assessment?.topics || data.topics || ["Core Technical Concepts"],
          questionCount: formattedQuestions.length,
          durationMinutes: duration,
          deadlineAt: new Date(deadlineMs).toISOString(),
        });
      })
      .catch((err: any) => {
        console.error("Assessment loading error:", err);
        setError(err.message || "Failed to load technical interview questions.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [assessmentId]);

  // Countdown timer
  React.useEffect(() => {
    if (remainingSeconds === null || submitting) return;

    if (remainingSeconds <= 0) {
      handleFinalSubmit("timeout");
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, submitting]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];
  const isCurrentChecked = currentQ ? Boolean(checkedAnswers[currentQ.id]) : false;
  const currentCheckInfo = currentQ ? checkedAnswers[currentQ.id] : null;

  // Option Selection
  const handleSelectOption = (opt: "A" | "B" | "C" | "D") => {
    if (!currentQ || isCurrentChecked) return; // Locked once checked
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));

    // Auto-save in background
    fetch(`/api/interviews/${assessmentId}/answers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: [{ questionId: currentQ.id, selectedOption: opt }],
      }),
    }).catch(() => {});
  };

  // Check Answer Button Handler
  const handleCheckAnswer = async () => {
    if (!currentQ || !answers[currentQ.id] || checkingAnswer || isCurrentChecked) return;
    setCheckingAnswer(true);

    try {
      const selectedOption = answers[currentQ.id];
      const res = await fetch("/api/technical/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: assessmentId,
          questionId: currentQ.id,
          selectedOption,
          hintUsed: Boolean(shownHints[currentQ.id]),
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to check answer");
      }

      const { isCorrect, correctOption, explanation } = json.data;
      setCheckedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: {
          isCorrect,
          correctOption,
          explanation: explanation || currentQ.explanation || "Accurate option verified by compiler specification.",
          selectedOption: selectedOption!,
        },
      }));
    } catch (err: any) {
      alert("Error checking answer: " + err.message);
    } finally {
      setCheckingAnswer(false);
    }
  };

  // Get Hint Button Handler
  const handleToggleHint = () => {
    if (!currentQ) return;
    setShownHints((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  // Final Submit Handler
  const handleFinalSubmit = async (reason: "manual" | "timeout" = "manual") => {
    if (submitting || !assessmentId) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const payloadAnswers = questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] || null,
      }));

      // Submit via interviews submit endpoint
      const res = await fetch(`/api/interviews/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: payloadAnswers,
          submissionReason: reason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        // Fall back to technical submit if needed
        await fetch("/api/technical/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: assessmentId,
            answers: payloadAnswers.map((a) => ({
              questionId: a.questionId,
              selectedOption: a.selectedOption,
              isSkipped: !a.selectedOption,
            })),
          }),
        });
      }

      router.push(`/interview/results?id=${assessmentId}`);
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit assessment.");
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalQuestions = questions.length;
  const answeredCount = Object.values(answers).filter((a) => a !== null).length;
  const unansweredCount = totalQuestions - answeredCount;
  const checkedCount = Object.keys(checkedAnswers).length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isTimeLow = remainingSeconds !== null && remainingSeconds < 120;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto shadow-lg shadow-purple-500/20" />
          <h2 className="text-lg font-bold tracking-tight">Generating Your Technical Interview...</h2>
          <p className="text-xs text-purple-300 font-mono">Loading Question 1 and initializing timed test environment...</p>
        </div>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-destructive/40 text-center space-y-5 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Technical Assessment Error</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || "Unable to display technical questions. Please return to setup and try again."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button href="/interview/setup" variant="outline" size="sm">
              Return to Setup
            </Button>
            <Button onClick={() => window.location.reload()} size="sm">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none font-sans">
      {/* =========================================================================
          TOP SECTION
      ========================================================================= */}
      <header className="border-b border-border/60 bg-card/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-4">
            <Link href="/home" className="flex items-center gap-2">
              <InterviewAILogo size="sm" showWordmark />
            </Link>
            <div className="hidden sm:block h-5 w-px bg-border" />
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="font-bold text-foreground">Technical Interview – AI Assessment</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground font-mono">{assessment?.jobRole}</span>
            </div>
          </div>

          {/* Time, Progress & Submit */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Remaining Time */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold transition-all ${
                isTimeLow
                  ? "bg-destructive/10 border-destructive text-destructive animate-pulse"
                  : "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300"
              }`}
              title="Time Remaining"
            >
              <Clock className="w-4 h-4" />
              <span>{remainingSeconds !== null ? formatTime(remainingSeconds) : "--:--"}</span>
            </div>

            {/* Submit Assessment Button */}
            <Button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              disabled={submitting}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md shadow-purple-600/20 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Assessment</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>

        {/* Top Progress Bar */}
        <div className="w-full bg-muted h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* =========================================================================
          CENTER SECTION: QUESTION CARD & 4 OPTIONS
      ========================================================================= */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Question Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-lg bg-foreground text-background font-bold">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <Badge
              variant={currentQ.difficulty === "Advanced" ? "outline" : "secondary"}
              className={`font-semibold ${
                currentQ.difficulty === "Advanced"
                  ? "border-purple-500 text-purple-600 dark:text-purple-300 bg-purple-500/10"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20"
              }`}
            >
              {currentQ.difficulty}
            </Badge>
            <span className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium border border-border">
              Topic: {currentQ.topic}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
            <span>Answered: {answeredCount}/{totalQuestions}</span>
            {checkedCount > 0 && <span>• Checked: {checkedCount}</span>}
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-foreground leading-relaxed whitespace-pre-wrap font-sans">
            {currentQ.questionText}
          </h2>

          {/* 4 Options (A, B, C, D) */}
          <div className="space-y-3 pt-1">
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const optionText = currentQ.options[letter] || `Option ${letter}`;
              const isSelected = answers[currentQ.id] === letter;

              // Check styling if answer is checked
              let optionContainerStyle = "border-border/80 bg-background hover:border-purple-400 hover:bg-muted/40";
              let radioStyle = "border-border text-muted-foreground bg-card";

              if (isCurrentChecked && currentCheckInfo) {
                const isThisTheCorrectAnswer = currentCheckInfo.correctOption === letter;
                const isThisTheWrongUserSelection = isSelected && !currentCheckInfo.isCorrect;

                if (isThisTheCorrectAnswer) {
                  optionContainerStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30";
                  radioStyle = "bg-emerald-500 border-emerald-500 text-white font-bold";
                } else if (isThisTheWrongUserSelection) {
                  optionContainerStyle = "border-destructive bg-destructive/10 text-destructive dark:text-destructive-foreground ring-2 ring-destructive/30";
                  radioStyle = "bg-destructive border-destructive text-white font-bold";
                } else {
                  optionContainerStyle = "opacity-60 border-border bg-muted/30";
                }
              } else if (isSelected) {
                optionContainerStyle = "border-purple-600 bg-purple-500/10 ring-2 ring-purple-600/30 shadow-md shadow-purple-600/10 text-foreground font-medium";
                radioStyle = "bg-purple-600 border-purple-600 text-white font-bold";
              }

              return (
                <div
                  key={letter}
                  onClick={() => handleSelectOption(letter)}
                  className={`p-4 sm:p-4.5 rounded-2xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${optionContainerStyle} ${
                    isCurrentChecked ? "cursor-default" : ""
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center font-bold text-xs mt-0.5 transition ${radioStyle}`}
                  >
                    {letter}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-mono sm:font-sans">
                    {optionText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hint Display Area */}
          {shownHints[currentQ.id] && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-amber-600 dark:text-amber-400">
                <Lightbulb className="w-4 h-4" />
                <span>Question Hint</span>
              </div>
              <p>{currentQ.hints}</p>
            </div>
          )}

          {/* Correct / Incorrect Feedback & Explanation Area */}
          {isCurrentChecked && currentCheckInfo && (
            <div
              className={`p-5 rounded-2xl border text-xs leading-relaxed space-y-3 animate-in fade-in duration-200 ${
                currentCheckInfo.isCorrect
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-100"
                  : "bg-destructive/10 border-destructive/40 text-destructive-foreground dark:text-destructive-foreground"
              }`}
            >
              {/* Status Header Banner */}
              <div className="flex items-center gap-2 font-bold text-sm">
                {currentCheckInfo.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-emerald-700 dark:text-emerald-300">Correct Answer!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    <span className="text-destructive font-extrabold">Incorrect Answer!</span>
                  </>
                )}
              </div>

              {/* Correct Option Callout */}
              <div className="space-y-1 pt-1">
                <p className="font-semibold text-foreground">
                  Correct Option:{" "}
                  <span className="font-mono px-2 py-0.5 rounded bg-foreground text-background font-bold text-xs ml-1">
                    Option {currentCheckInfo.correctOption}
                  </span>
                </p>

                {!currentCheckInfo.isCorrect && (
                  <p className="text-[11px] text-destructive font-medium mt-1">
                    Your Selection: Option {currentCheckInfo.selectedOption} was suboptimal.
                  </p>
                )}
              </div>

              {/* Detailed Explanation */}
              <div className="pt-2 border-t border-border/50 text-foreground">
                <p className="font-bold text-[11px] uppercase tracking-wider mb-1 text-muted-foreground">
                  Explanation & Runtime Mechanics:
                </p>
                <p className="leading-relaxed whitespace-pre-wrap">{currentCheckInfo.explanation}</p>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            BOTTOM SECTION: BUTTONS (Get Hint, Check Answer, Previous, Next, Submit)
        ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Left Actions: Hint & Check Answer */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleHint}
              className="gap-1.5 rounded-xl border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-semibold"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>{shownHints[currentQ.id] ? "Hide Hint" : "Get Hint"}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCheckAnswer}
              disabled={!answers[currentQ.id] || checkingAnswer || isCurrentChecked}
              className={`gap-1.5 rounded-xl text-xs font-bold transition-all ${
                isCurrentChecked
                  ? "bg-muted text-muted-foreground border border-border"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
              }`}
            >
              {checkingAnswer ? (
                <span>Checking...</span>
              ) : isCurrentChecked ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Answer Checked</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Check Answer</span>
                </>
              )}
            </Button>
          </div>

          {/* Right Actions: Previous, Next, Review/Submit */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="gap-1 rounded-xl text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            {currentIndex < totalQuestions - 1 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                className="gap-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                className="gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Assessment</span>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-card border border-border shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Submit Technical Assessment?
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to finalize your assessment? Your responses will be scored against compiler rubrics and compiled into your technical report.
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-muted/60 border border-border text-center text-xs">
              <div>
                <p className="font-bold text-foreground">{totalQuestions}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Total</p>
              </div>
              <div>
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{answeredCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Answered</p>
              </div>
              <div>
                <p className="font-bold text-amber-600 dark:text-amber-400">{unansweredCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase">Unanswered</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleFinalSubmit("manual")}
                disabled={submitting}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold"
              >
                {submitting ? "Calculating Scores..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TechnicalQuestionsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TechnicalAssessmentQuestionsContent />
    </React.Suspense>
  );
}
