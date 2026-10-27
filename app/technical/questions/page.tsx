"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  HelpCircle,
  Code2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Brain,
  Layers,
  Lightbulb,
  Check,
  X,
  ArrowRight,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";
import { useActiveInterview } from "@/context/ActiveInterviewContext";

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
  assessmentMode: "PRACTICE" | "EXAM";
  deadlineAt: string;
}

function TechnicalQuestionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || searchParams.get("id");

  const [assessment, setAssessment] = React.useState<AssessmentMeta | null>(null);
  const [questions, setQuestions] = React.useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // User interactions state
  const [answers, setAnswers] = React.useState<Record<string, "A" | "B" | "C" | "D" | null>>({});
  const [skipped, setSkipped] = React.useState<Record<string, boolean>>({});
  const [flagged, setFlagged] = React.useState<Record<string, boolean>>({});
  const [savingStatus, setSavingStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [checkedAnswers, setCheckedAnswers] = React.useState<
    Record<string, { isCorrect: boolean; correctOption: string; explanation: string }>
  >({});
  const [shownHints, setShownHints] = React.useState<Record<string, boolean>>({});

  // Countdown timer
  const [remainingSeconds, setRemainingSeconds] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [checkingAnswer, setCheckingAnswer] = React.useState(false);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load session questions
  React.useEffect(() => {
    if (!sessionId) {
      setError("No session ID specified. Please configure your technical interview first.");
      setLoading(false);
      return;
    }

    fetch(`/api/technical/results/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          // If not in technical/results, try generic interviews API
          return fetch(`/api/interviews/${sessionId}`).then((r) => r.json());
        }
        return json;
      })
      .then((json) => {
        if (!json.success) {
          throw new Error(json.error?.message || "Failed to load interview questions.");
        }

        const data = json.data;
        const rawQuestions = data.questions || [];
        const formattedQuestions: QuestionItem[] = rawQuestions.map((q: any) => ({
          id: q.id,
          orderIndex: q.orderIndex ?? 0,
          questionText: q.questionText || q.question,
          difficulty: q.difficulty || "Intermediate",
          topic: q.topic || "General",
          options: q.options || { A: "", B: "", C: "", D: "" },
          hints: q.hints || (q.topic ? `Focus on ${q.topic} principles and runtime implications.` : undefined),
          correctOption: q.correctOption,
          explanation: q.explanation,
        }));

        setQuestions(formattedQuestions);

        // Pre-fill any already answered questions
        const initialAnswers: Record<string, "A" | "B" | "C" | "D" | null> = {};
        const initialSkipped: Record<string, boolean> = {};
        rawQuestions.forEach((q: any) => {
          if (q.userAnswer) {
            initialAnswers[q.id] = q.userAnswer;
          } else if (q.isSkipped) {
            initialSkipped[q.id] = true;
          }
        });
        setAnswers(initialAnswers);
        setSkipped(initialSkipped);

        const duration = data.durationMinutes || 15;
        const deadline = data.deadlineAt
          ? new Date(data.deadlineAt).getTime()
          : Date.now() + duration * 60 * 1000;

        const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
        setRemainingSeconds(secondsLeft);

        setAssessment({
          id: sessionId,
          jobRole: data.targetRole || data.jobRole || "Software Engineer",
          topics: data.topics || [],
          questionCount: formattedQuestions.length,
          durationMinutes: duration,
          assessmentMode: data.assessmentMode === "EXAM" ? "EXAM" : "PRACTICE",
          deadlineAt: new Date(deadline).toISOString(),
        });
      })
      .catch((err: any) => {
        setError(err.message || "Failed to fetch session.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  // Countdown timer effect
  React.useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true); // Auto-submit when time expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentIndex];
  const { setActiveQuestion } = useActiveInterview();

  React.useEffect(() => {
    if (!currentQ) {
      setActiveQuestion(null);
      return;
    }
    setActiveQuestion({
      roundNumber: 2,
      roundName: "Technical Round",
      questionId: currentQ.id,
      questionText: currentQ.questionText,
      category: currentQ.topic,
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
  }, [currentQ?.id, currentQ?.questionText, setActiveQuestion]);

  const handleSelectOption = async (opt: "A" | "B" | "C" | "D") => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
    setSkipped((prev) => ({ ...prev, [currentQ.id]: false }));
    setSavingStatus("saving");

    try {
      await fetch("/api/technical/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          selectedOption: opt,
          isSkipped: false,
        }),
      });
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (err) {
      console.warn("Autosave option error:", err);
      setSavingStatus("idle");
    }
  };

  const handleSkipQuestion = async () => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: null }));
    setSkipped((prev) => ({ ...prev, [currentQ.id]: true }));
    setSavingStatus("saving");

    try {
      await fetch("/api/technical/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          selectedOption: null,
          isSkipped: true,
        }),
      });
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (err) {
      console.warn("Autosave skip error:", err);
      setSavingStatus("idle");
    }
  };

  const handleClearSelection = async () => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: null }));
    setSkipped((prev) => ({ ...prev, [currentQ.id]: false }));
    setSavingStatus("saving");

    try {
      await fetch("/api/technical/save-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          selectedOption: null,
          isSkipped: false,
        }),
      });
      setSavingStatus("saved");
      setTimeout(() => setSavingStatus("idle"), 2000);
    } catch (err) {
      console.warn("Autosave clear error:", err);
      setSavingStatus("idle");
    }
  };

  const handleToggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleCheckAnswer = async () => {
    if (!currentQ || !answers[currentQ.id] || checkingAnswer) return;
    setCheckingAnswer(true);

    try {
      const res = await fetch("/api/technical/check-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQ.id,
          selectedOption: answers[currentQ.id],
          hintUsed: !!shownHints[currentQ.id],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setCheckedAnswers((prev) => ({
          ...prev,
          [currentQ.id]: {
            isCorrect: json.data.isCorrect,
            correctOption: json.data.correctOption,
            explanation: json.data.explanation,
          },
        }));
      }
    } catch (err) {
      console.error("Check answer error:", err);
    } finally {
      setCheckingAnswer(false);
    }
  };

  const handleFinalSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const totalSeconds = (assessment?.durationMinutes || 15) * 60;
      const timeSpentSec = Math.max(0, totalSeconds - (remainingSeconds || 0));

      const res = await fetch("/api/technical/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          answers,
          timeSpentSec,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit technical answers");
      }

      router.push(`/technical/results?sessionId=${sessionId}`);
    } catch (err: any) {
      alert("Error submitting assessment: " + err.message);
      setSubmitting(false);
    }
  };

  const handleAutoStartTechnical = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/technical/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: "Software Engineer",
          topics: [
            "Data Structures & Algorithms",
            "System Design Fundamentals",
            "Database Modeling",
            "API Design & REST",
          ],
          questionCount: 10,
          durationMinutes: 15,
          experienceLevel: "FRESHER",
          assessmentMode: "PRACTICE",
        }),
      });
      const json = await res.json();
      const newSessionId = json.data?.sessionId || json.sessionId;
      if (newSessionId) {
        router.push(`/technical/questions?sessionId=${newSessionId}`);
      } else {
        router.push("/technical/setup");
      }
    } catch {
      router.push("/technical/setup");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Loading Technical Questions...</p>
      </div>
    );
  }

  if (error || !currentQ) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-border bg-card text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Round 2 Technical Assessment</h2>
          <p className="text-xs text-muted-foreground">{error || "Could not load technical questions."}</p>
          <div className="space-y-2 pt-2">
            <Button onClick={handleAutoStartTechnical} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold">
              Start Round 2 Now
            </Button>
            <Button variant="outline" onClick={() => router.push("/technical/setup")} className="w-full">
              Configure New Technical Round
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const isTimeCritical = remainingSeconds !== null && remainingSeconds < 300; // < 5 mins
  const isPracticeMode = assessment?.assessmentMode === "PRACTICE";
  const checked = checkedAnswers[currentQ.id];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Fixed Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/70 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <InterviewAILogo size="sm" showWordmark />
          <div className="h-5 w-px bg-border/60 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-xs font-bold text-foreground">{assessment?.jobRole}</span>
            <span className="text-[11px] text-muted-foreground ml-2">
              (Round 2 • Technical Round)
            </span>
          </div>
        </div>

        <div className="hidden lg:block">
          <FiveRoundStepper currentRound={2} completedRounds={[1]} compact />
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Pill */}
          <Badge
            variant="outline"
            className={`text-xs ${
              isPracticeMode
                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            }`}
          >
            {isPracticeMode ? "Practice Mode" : "Exam Mode"}
          </Badge>

          {/* Autosave Status Pill */}
          {savingStatus === "saving" && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              Saving...
            </span>
          )}
          {savingStatus === "saved" && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}

          {/* Timer Display */}
          {remainingSeconds !== null && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                isTimeCritical
                  ? "bg-destructive/10 text-destructive border-destructive/40 animate-pulse"
                  : "bg-card border-border/70 text-foreground"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>
          )}

          {/* Save & Exit Gracefully Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="text-xs h-8 px-3 border-border/70 hover:bg-muted font-medium"
            title="Save answers and return to dashboard"
          >
            Save & Exit
          </Button>

          {/* Submit Button */}
          <Button
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold h-8 px-3.5 shadow-sm"
          >
            Submit Round
          </Button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Grid: Navigator Sidebar (left) + Question Card (center) */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Navigator Panel */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Questions Navigator
              </h3>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            {/* Grid of Question Number Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isSelected = idx === currentIndex;
                const isAnswered = !!answers[q.id];
                const isSkipped = !!skipped[q.id];
                const isFlagged = !!flagged[q.id];

                let bgClasses = "border-border hover:bg-muted text-foreground";
                if (isSelected) {
                  bgClasses = "border-purple-600 ring-2 ring-purple-500/40 text-purple-600 font-bold bg-purple-500/10";
                } else if (isFlagged) {
                  bgClasses = "border-amber-500/60 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold";
                } else if (isAnswered) {
                  bgClasses = "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold";
                } else if (isSkipped) {
                  bgClasses = "border-slate-500/40 bg-slate-500/10 text-muted-foreground line-through";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl border text-xs flex items-center justify-center relative transition-all ${bgClasses}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-emerald-500/30 border border-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-slate-500/30 border border-slate-500" />
                <span>Skipped</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md bg-amber-500/30 border border-amber-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-md border border-purple-500 bg-purple-500/20" />
                <span>Current</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Question Card */}
        <main className="lg:col-span-3 space-y-4">
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Question Header & Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    currentQ.difficulty === "Advanced"
                      ? "text-red-600 dark:text-red-400 border-red-500/30 bg-red-500/10"
                      : "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10"
                  }`}
                >
                  {currentQ.difficulty}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                  {currentQ.topic}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {skipped[currentQ.id] && (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                    Marked as Skipped
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFlag}
                  className={`text-xs h-8 gap-1.5 ${
                    flagged[currentQ.id]
                      ? "border-amber-500 text-amber-600 bg-amber-500/10"
                      : "text-muted-foreground"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{flagged[currentQ.id] ? "Flagged" : "Flag"}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipQuestion}
                  className={`text-xs h-8 gap-1.5 ${
                    skipped[currentQ.id]
                      ? "border-amber-500 text-amber-600 bg-amber-500/10"
                      : "text-muted-foreground"
                  }`}
                >
                  Skip
                </Button>
                {answers[currentQ.id] && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                  >
                    Clear Choice
                  </Button>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base md:text-lg font-medium leading-relaxed text-foreground whitespace-pre-wrap">
              {currentQ.questionText}
            </div>

            {/* 4 Options Grid */}
            <div className="space-y-3 pt-2">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const optionText = currentQ.options[key];
                if (!optionText) return null;

                const isSelected = answers[currentQ.id] === key;
                let optionStyle =
                  "border-border/80 hover:border-purple-500/50 hover:bg-card/90";

                // If practice check answer has been triggered
                if (checked) {
                  if (key === checked.correctOption) {
                    optionStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30";
                  } else if (isSelected && !checked.isCorrect) {
                    optionStyle = "border-destructive bg-destructive/15 text-destructive ring-2 ring-destructive/30";
                  }
                } else if (isSelected) {
                  optionStyle =
                    "border-purple-600 bg-purple-500/10 ring-2 ring-purple-500/30 text-foreground font-semibold";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-3.5 transition-all relative ${optionStyle}`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-purple-600 text-white shadow-sm"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {key}
                    </span>
                    <span className="text-sm leading-relaxed flex-1 font-medium">{optionText}</span>
                    {isSelected && !checked && (
                      <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 mt-1">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                    {!isSelected && !checked && (
                      <div className="w-4 h-4 rounded-full border border-border/80 shrink-0 mt-1" />
                    )}
                    {checked && key === checked.correctOption && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    {checked && isSelected && !checked.isCorrect && (
                      <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice Mode: Check Answer & Hint Row */}
            {isPracticeMode && (
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setShownHints((prev) => ({
                        ...prev,
                        [currentQ.id]: !prev[currentQ.id],
                      }))
                    }
                    className="text-xs h-8 gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    {shownHints[currentQ.id] ? "Hide Hint" : "Get Hint"}
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    disabled={!answers[currentQ.id] || checkingAnswer}
                    onClick={handleCheckAnswer}
                    className="text-xs h-8 bg-purple-600 hover:bg-purple-500 text-white gap-1.5"
                  >
                    {checkingAnswer ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Check Answer
                  </Button>
                </div>
              </div>
            )}

            {/* Hint Accordion */}
            {shownHints[currentQ.id] && currentQ.hints && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <span className="font-bold">Hint: </span>
                  {currentQ.hints}
                </div>
              </div>
            )}

            {/* Practice Checked Explanation Box */}
            {checked && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                  checked.isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                    : "border-destructive/30 bg-destructive/10 text-destructive-foreground"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {checked.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Correct Answer!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <span>Incorrect. Option {checked.correctOption} is correct.</span>
                    </>
                  )}
                </div>
                <p className="pt-1 whitespace-pre-wrap">{checked.explanation}</p>
              </div>
            )}

            {/* Selection Enforcement Notice if neither chosen nor skipped */}
            {!answers[currentQ.id] && !skipped[currentQ.id] && (
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-purple-500 shrink-0" />
                  Select an option (A, B, C, or D) to submit your answer, or skip to proceed.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipQuestion}
                  className="text-xs h-7 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
                >
                  Skip Question
                </Button>
              </div>
            )}

            {/* Navigation Buttons: Previous & Next */}
            <div className="pt-4 flex items-center justify-between border-t border-border/50">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="text-xs h-9 gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="text-xs text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <Button
                  variant="default"
                  size="sm"
                  disabled={!answers[currentQ.id] && !skipped[currentQ.id]}
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="text-xs h-9 bg-purple-600 hover:bg-purple-500 text-white gap-1.5 disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  disabled={!answers[currentQ.id] && !skipped[currentQ.id]}
                  onClick={() => setShowSubmitModal(true)}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 font-bold disabled:opacity-50"
                >
                  Finish & Review
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold">Submit Technical Round?</h3>
            <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>Review your assessment submission status:</p>
              <div className="grid grid-cols-3 gap-2 py-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-xs text-muted-foreground block">Answered</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {answeredCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                  <span className="text-xs text-muted-foreground block">Skipped</span>
                  <span className="text-lg font-bold text-slate-400">
                    {Object.values(skipped).filter(Boolean).length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-xs text-muted-foreground block">Unattempted</span>
                  <span className="text-lg font-bold text-amber-500">
                    {Math.max(
                      0,
                      questions.length - answeredCount - Object.values(skipped).filter(Boolean).length
                    )}
                  </span>
                </div>
              </div>
              {answeredCount < questions.length && (
                <span className="text-amber-500 block text-xs font-medium">
                  ⚠️ Note: Unanswered and skipped questions will receive 0 points.
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => setShowSubmitModal(false)}
              >
                Keep Practicing
              </Button>
              <Button
                size="sm"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
              >
                {submitting ? "Grading..." : "Confirm & Submit"}
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
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <TechnicalQuestionsContent />
    </React.Suspense>
  );
}
