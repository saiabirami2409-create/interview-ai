"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  HelpCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Check,
  LogOut,
  Send,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";
import { useActiveInterview } from "@/context/ActiveInterviewContext";
import { ProjectQuestion, ProjectDetails } from "@/server/ai/project-service";

interface ProjectSessionState {
  id: string;
  projectDetails: ProjectDetails;
  questions: ProjectQuestion[];
  candidateAnswers: Record<string, { selectedOption?: string; durationSeconds?: number }>;
  currentQuestionIndex: number;
}

function ProjectMCQInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [session, setSession] = React.useState<ProjectSessionState | null>(null);
  const [currentIdx, setCurrentIdx] = React.useState(0);
  const [selectedAnswers, setSelectedAnswers] = React.useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [showHint, setShowHint] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [savingAnswer, setSavingAnswer] = React.useState(false);
  const [submittingRound, setSubmittingRound] = React.useState(false);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [questionSeconds, setQuestionSeconds] = React.useState(0);

  // Overall Timer
  React.useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Per-Question Timer
  React.useEffect(() => {
    setQuestionSeconds(0);
    setShowHint(false);
    const qTimer = setInterval(() => setQuestionSeconds((s) => s + 1), 1000);
    return () => clearInterval(qTimer);
  }, [currentIdx]);

  // Load Session Data
  React.useEffect(() => {
    if (!sessionId) {
      setErrorMessage("No active interview session ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/project/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success || !json.data?.session) {
          throw new Error(json.error?.message || "Failed to load project assessment");
        }
        const s = json.data.session;
        setSession(s);
        setCurrentIdx(s.currentQuestionIndex || 0);

        // Pre-fill existing selections from candidateAnswers
        if (s.candidateAnswers) {
          const initialMap: Record<string, "A" | "B" | "C" | "D"> = {};
          Object.entries(s.candidateAnswers).forEach(([qId, val]: [string, any]) => {
            if (val?.selectedOption && ["A", "B", "C", "D"].includes(val.selectedOption)) {
              initialMap[qId] = val.selectedOption as "A" | "B" | "C" | "D";
            }
          });
          setSelectedAnswers(initialMap);
        }
      })
      .catch((err) => {
        console.error("Failed to load project session:", err);
        setErrorMessage(err.message || "Failed to load project assessment");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentIdx];
  const projectDetails = session?.projectDetails;
  const { setActiveQuestion } = useActiveInterview();

  React.useEffect(() => {
    if (!currentQuestion) {
      setActiveQuestion(null);
      return;
    }
    setActiveQuestion({
      roundNumber: 3,
      roundName: "Project-Based Interview",
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      category: currentQuestion.category,
      options: currentQuestion.options,
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
  }, [currentQuestion?.id, currentQuestion?.questionText, setActiveQuestion]);

  const currentSelection = currentQuestion ? selectedAnswers[currentQuestion.id] : undefined;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Select Option
  const handleSelectOption = async (optionKey: "A" | "B" | "C" | "D") => {
    if (!currentQuestion || !sessionId) return;

    const newSelections = {
      ...selectedAnswers,
      [currentQuestion.id]: optionKey,
    };
    setSelectedAnswers(newSelections);

    // Persist answer asynchronously
    try {
      setSavingAnswer(true);
      await fetch("/api/project/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          selectedOption: optionKey,
          durationSeconds: questionSeconds,
        }),
      });
    } catch (err) {
      console.warn("Async answer save warning:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Clear Selection
  const handleClearSelection = async () => {
    if (!currentQuestion) return;
    const copy = { ...selectedAnswers };
    delete copy[currentQuestion.id];
    setSelectedAnswers(copy);
  };

  // Navigation
  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!sessionId || submittingRound) return;
    setSubmittingRound(true);

    try {
      const res = await fetch("/api/project/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers: selectedAnswers,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to finalize project round");
      }

      router.push(`/project/results?sessionId=${sessionId}`);
    } catch (err: any) {
      alert("Error finalizing round: " + err.message);
      setSubmittingRound(false);
    }
  };

  const handleAutoStartProject = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/project/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectDetails: {
            title: "Full-Stack Distributed Web Platform",
            domain: "Full-Stack Web Development",
            description: "A production web application built with microservices architecture, real-time messaging, and high availability database clustering.",
            technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker", "Redis"],
            candidateRole: "Lead Full-Stack Developer",
            challengesFaced: "Database query optimization, real-time socket latency, and state caching.",
            outcomes: "Handled 25,000 active users with 99.9% uptime and sub-100ms response time.",
            isOngoingOrProposed: false,
          },
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.sessionId) {
        router.push(`/project/interview?sessionId=${json.data.sessionId}`);
      } else {
        router.push("/project/setup");
      }
    } catch {
      router.push("/project/setup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-base font-medium text-slate-600 dark:text-slate-300">
          Loading Project-Based MCQ Assessment...
        </p>
      </div>
    );
  }

  if (errorMessage || !session || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Round 3 Project Assessment</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {errorMessage || "The project session could not be retrieved. Start fresh to begin Round 3."}
          </p>
          <div className="space-y-2 pt-2">
            <Button
              onClick={handleAutoStartProject}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Start Round 3 Now
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/project/setup")}
              className="w-full"
            >
              Configure Project Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <InterviewAILogo />
            <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
            <Badge
              variant="outline"
              className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 font-semibold"
            >
              <Layers className="w-3.5 h-3.5 mr-1" />
              Round 3: Project-Based MCQs
            </Badge>
          </div>

          <div className="hidden lg:block">
            <FiveRoundStepper currentRound={3} completedRounds={[1, 2]} compact />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-500 dark:text-slate-400">Total Time</span>
              <p className="text-sm font-semibold font-mono text-purple-600 dark:text-purple-400">
                {formatTime(elapsedSeconds)}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-800"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Exit
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Project Context Summary Card */}
        <div className="rounded-xl border border-purple-100 dark:border-purple-900/40 bg-gradient-to-r from-purple-50/80 via-indigo-50/50 to-white dark:from-purple-950/20 dark:via-slate-900/50 dark:to-slate-900 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Candidate Project Under Evaluation
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {projectDetails?.title}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                Domain: <span className="font-medium">{projectDetails?.domain}</span> &bull; Role:{" "}
                <span className="font-medium">{projectDetails?.candidateRole}</span> &bull; Tech:{" "}
                <span className="font-mono">{projectDetails?.technologies?.slice(0, 4).join(", ")}</span>
              </p>
            </div>

            {/* Progress Pill */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto shrink-0">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Answered:</span>
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        {/* Stepper / Dot Navigation */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(selectedAnswers[q.id]);
              const isCurrent = idx === currentIdx;

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-9 h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    isCurrent
                      ? "bg-purple-600 text-white shadow-md shadow-purple-500/20 ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-slate-950"
                      : isAnswered
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-purple-300"
                  }`}
                  title={`Question ${idx + 1}: ${q.category}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Question {currentIdx + 1} of {totalQuestions}
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 text-xs font-semibold px-2.5 py-0.5"
                >
                  {currentQuestion.category}
                </Badge>
                {savingAnswer && (
                  <span className="flex items-center text-xs text-purple-600 dark:text-purple-400 font-medium animate-pulse">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...
                  </span>
                )}
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3 leading-relaxed">
                {currentQuestion.questionText}
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* Options List */}
              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((optKey) => {
                  const optText = currentQuestion.options[optKey];
                  const isSelected = currentSelection === optKey;

                  return (
                    <button
                      key={optKey}
                      type="button"
                      onClick={() => handleSelectOption(optKey)}
                      className={`w-full text-left p-4 sm:p-5 rounded-xl border transition-all flex items-start gap-3.5 group relative ${
                        isSelected
                          ? "border-purple-600 bg-purple-50/80 dark:bg-purple-950/40 dark:border-purple-500 ring-2 ring-purple-600/30 dark:ring-purple-500/30 shadow-sm"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      {/* Option Letter Pill */}
                      <span
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 group-hover:text-purple-700 dark:group-hover:text-purple-300"
                        }`}
                      >
                        {optKey}
                      </span>

                      {/* Option Text */}
                      <span
                        className={`text-sm sm:text-base leading-relaxed flex-1 ${
                          isSelected
                            ? "font-semibold text-purple-950 dark:text-purple-100"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {optText}
                      </span>

                      {/* Selected Radio Indicator */}
                      <div className="shrink-0 mt-1">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 group-hover:border-purple-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hints Accordion */}
              {currentQuestion.hints && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="inline-flex items-center text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHint ? "Hide architectural hint" : "Need a hint?"}
                  </button>

                  {showHint && (
                    <div className="mt-2.5 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/30 text-xs text-purple-900 dark:text-purple-200 flex items-start gap-2.5 leading-relaxed">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Architectural Hint:</strong> {currentQuestion.hints}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="flex-1 sm:flex-none border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {currentSelection && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Clear Selection
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {currentIdx < totalQuestions - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 shadow-sm shadow-purple-600/20"
              >
                Next Question
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setShowSubmitModal(true)}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Submit Assessment
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Project Assessment?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You have answered <span className="font-bold text-purple-600 dark:text-purple-400">{answeredCount}</span> of{" "}
                <span className="font-bold">{totalQuestions}</span> questions.
              </p>
              {answeredCount < totalQuestions && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg mt-2">
                  Warning: You have {totalQuestions - answeredCount} unanswered question(s). Unanswered questions will be evaluated as skipped.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowSubmitModal(false)}
                disabled={submittingRound}
                className="flex-1 border-slate-200 dark:border-slate-800"
              >
                Review Answers
              </Button>
              <Button
                onClick={handleFinalSubmit}
                disabled={submittingRound}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
              >
                {submittingRound ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectInterviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading Round 3...</p>
        </div>
      }
    >
      <ProjectMCQInterviewContent />
    </React.Suspense>
  );
}
