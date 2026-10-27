"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Clock,
  Send,
  SkipForward,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Bot,
  Award,
  Layers,
  Flag,
  ArrowRight,
  Check,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InterviewerVisualizer, InterviewerState } from "@/components/3d/InterviewerVisualizer";
import { VideoVoiceConsole } from "@/components/interview/VideoVoiceConsole";
import { formatTime } from "@/lib/utils";

interface QuestionData {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  difficulty: string;
  relevantSkills: string[];
  expectedCriteria: string;
  hints?: string;
  isMcq?: boolean;
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  selectedOptionIndex?: number;
  isCorrect?: boolean;
  answer?: {
    id: string;
    answerText: string;
    isSkipped: boolean;
    selectedOptionIndex?: number;
    isCorrect?: boolean;
    evaluation?: any;
  } | null;
}

interface SessionData {
  id: string;
  title: string;
  targetRole: string;
  interviewType: string;
  difficulty: string;
  timeLimitMinutes: number;
  status: string;
  questions: QuestionData[];
}

function InterviewWorkspaceContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = React.useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answerText, setAnswerText] = React.useState("");
  const [selectedOption, setSelectedOption] = React.useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = React.useState(1800);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [finishingEarly, setFinishingEarly] = React.useState(false);
  const [interviewerState, setInterviewerState] = React.useState<InterviewerState>("waiting");
  const [showHints, setShowHints] = React.useState(false);
  const [showExitModal, setShowExitModal] = React.useState(false);
  const [showTimeExpiredModal, setShowTimeExpiredModal] = React.useState(false);
  const [showSummaryModal, setShowSummaryModal] = React.useState(false);
  const [lastFeedback, setLastFeedback] = React.useState<any | null>(null);
  const [mcqFeedback, setMcqFeedback] = React.useState<{
    isCorrect: boolean;
    correctOptionIndex: number;
    explanation: string;
    selectedOptionIndex: number;
  } | null>(null);
  const [isDraftSaved, setIsDraftSaved] = React.useState(false);

  // Fetch session details
  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}`);
      const data = await res.json();
      if (data.session) {
        setSession(data.session);

        // If session is already completed, redirect to report
        if (data.session.status === "COMPLETED") {
          router.push(`/dashboard/report/${sessionId}`);
          return;
        }

        // Initialize timer from session duration if needed
        if (loading) {
          setTimeRemainingSeconds(data.session.timeLimitMinutes * 60);
          const unansweredIdx = data.session.questions.findIndex((q: QuestionData) => !q.answer);
          if (unansweredIdx !== -1) {
            setCurrentIndex(unansweredIdx);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const currentQuestion = session?.questions[currentIndex];
  const totalQuestions = session?.questions.length || 0;
  const isMcq = Boolean(currentQuestion?.isMcq || session?.interviewType === "TECHNICAL");
  const isCurrentAnswered = Boolean(currentQuestion?.answer);

  // Load draft or previous answer when currentIndex changes
  React.useEffect(() => {
    if (!session) return;
    const currentQ = session.questions[currentIndex];
    if (!currentQ) return;

    if (currentQ.answer) {
      // Restore answered state
      if (currentQ.isMcq || isMcq) {
        let selIdx = currentQ.answer.selectedOptionIndex ?? currentQ.selectedOptionIndex;
        if (selIdx === undefined && currentQ.answer.answerText) {
          try {
            const parsed = JSON.parse(currentQ.answer.answerText);
            selIdx = parsed.selectedOptionIndex;
          } catch {
            const match = currentQ.answer.answerText.match(/^Option ([A-D])/);
            if (match) selIdx = match[1].charCodeAt(0) - 65;
          }
        }

        setSelectedOption(selIdx ?? null);
        setMcqFeedback({
          isCorrect: currentQ.answer.isCorrect ?? currentQ.isCorrect ?? false,
          correctOptionIndex: currentQ.correctOptionIndex ?? 0,
          explanation: currentQ.explanation || "Review the correct technical option and concepts below.",
          selectedOptionIndex: selIdx ?? 0,
        });
      } else {
        setAnswerText(currentQ.answer.answerText || "");
      }
      setLastFeedback(currentQ.answer.evaluation || null);
      setInterviewerState("evaluating");
    } else {
      // Unanswered question
      setSelectedOption(null);
      setMcqFeedback(null);
      const draftKey = `interviewai_draft_${sessionId}_${currentQ.id}`;
      const saved = localStorage.getItem(draftKey);
      setAnswerText(saved || "");
      setLastFeedback(null);
      setInterviewerState("asking");
    }
  }, [currentIndex, session, isMcq]);

  // Autosave draft to localStorage (for open-ended text answers)
  React.useEffect(() => {
    if (!session || isMcq) return;
    const currentQ = session.questions[currentIndex];
    if (!currentQ || currentQ.answer) return;

    if (answerText.trim()) {
      setInterviewerState("listening");
      const draftKey = `interviewai_draft_${sessionId}_${currentQ.id}`;
      localStorage.setItem(draftKey, answerText);
      setIsDraftSaved(true);
      const timer = setTimeout(() => setIsDraftSaved(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setInterviewerState("waiting");
    }
  }, [answerText, currentIndex, session, sessionId, isMcq]);

  // Countdown timer interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          setShowTimeExpiredModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard accessibility for MCQ (Keys 1-4, A-D, Enter)
  React.useEffect(() => {
    if (!isMcq || isCurrentAnswered || submitting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const key = e.key.toLowerCase();
      if (key === "1" || key === "a") {
        e.preventDefault();
        setSelectedOption(0);
      } else if (key === "2" || key === "b") {
        e.preventDefault();
        setSelectedOption(1);
      } else if (key === "3" || key === "c") {
        e.preventDefault();
        setSelectedOption(2);
      } else if (key === "4" || key === "d") {
        e.preventDefault();
        setSelectedOption(3);
      } else if (e.key === "Enter" && selectedOption !== null) {
        e.preventDefault();
        handleSubmit(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMcq, isCurrentAnswered, submitting, selectedOption]);

  // Metrics calculations
  const answeredQuestions = session?.questions.filter((q) => q.answer) || [];
  const answeredCount = answeredQuestions.length;
  const correctCount = session?.questions.filter((q) => q.answer && (q.answer.isCorrect || q.isCorrect)).length || 0;
  const accuracyPercentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const charCount = answerText.length;

  const handleSubmit = async (isSkipped = false) => {
    if (!currentQuestion) return;

    if (isMcq) {
      if (!isSkipped && selectedOption === null) {
        alert("Please select one of the four options or click 'Skip'.");
        return;
      }
    } else {
      if (!isSkipped && !answerText.trim()) {
        alert("Please formulate your answer or click 'Skip Question'.");
        return;
      }
    }

    setSubmitting(true);
    setInterviewerState("processing");

    try {
      const payload: any = {
        questionId: currentQuestion.id,
        timeSpentSec: elapsedSeconds,
        isSkipped,
      };

      if (isMcq) {
        payload.selectedOptionIndex = isSkipped ? undefined : selectedOption;
        payload.answerText = isSkipped ? "" : `Option ${String.fromCharCode(65 + (selectedOption ?? 0))}`;
      } else {
        payload.answerText = isSkipped ? "" : answerText;
      }

      const res = await fetch(`/api/interviews/${sessionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      // Remove local draft
      localStorage.removeItem(`interviewai_draft_${sessionId}_${currentQuestion.id}`);

      // Update feedback & visualizer state
      setLastFeedback(data.evaluation);
      if (isMcq) {
        setMcqFeedback({
          isCorrect: Boolean(data.isCorrect),
          correctOptionIndex: data.correctOptionIndex ?? 0,
          explanation: data.explanation || "Review the technical rationale behind the four options.",
          selectedOptionIndex: selectedOption ?? 0,
        });
      }
      setInterviewerState("evaluating");

      // Refresh session data in background
      await fetchSession();

      // If all questions are complete, show summary modal
      if (data.isSessionComplete) {
        setShowSummaryModal(true);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit answer. Please try again.");
      setInterviewerState("waiting");
    } finally {
      setSubmitting(false);
    }
  };

  // Complete session and generate report immediately
  const handleFinishAndReport = async () => {
    setFinishingEarly(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        router.push(`/dashboard/report/${sessionId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    }
  };

  // Abandon session early without generating report
  const handleAbandonSession = async () => {
    try {
      await fetch(`/api/interviews/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ABANDONED" }),
      });
    } finally {
      router.push("/dashboard");
    }
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-spin">
          <Bot className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Loading Interview Workspace...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-12 space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-lg font-bold">No Questions Found</h3>
        <p className="text-xs text-muted-foreground">This session does not contain any questions.</p>
        <Button href="/dashboard">Return to Dashboard</Button>
      </div>
    );
  }

  // Fallback options for MCQ if not populated
  const displayOptions = currentQuestion.options && currentQuestion.options.length === 4
    ? currentQuestion.options
    : [
        "A. Optimistic Concurrency Control with versioning checks",
        "B. Pessimistic locking (SELECT FOR UPDATE) on the primary record",
        "C. In-memory atomic decrements via Redis Lua scripts with asynchronous queue persistence",
        "D. Client-side HTTP ETag validation and exponential backoff retry"
      ];

  const correctIndex = mcqFeedback?.correctOptionIndex ?? currentQuestion.correctOptionIndex ?? 0;
  const explanationText = mcqFeedback?.explanation || currentQuestion.explanation || "";

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Session Progress Bar & Controls */}
      <div className="p-4 rounded-2xl bg-card/75 border border-border/50 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs">
            {currentIndex + 1}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">
                Question {currentIndex + 1} of {totalQuestions}
              </h2>
              {isMcq && (
                <span className="px-2 py-0.5 rounded-md bg-violet-500/15 border border-violet-500/25 text-[10px] font-mono text-violet-400 font-bold uppercase">
                  MCQ Format
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {session.targetRole} • {session.interviewType.replace("_", " ")} Round
            </p>
          </div>
        </div>

        {/* Live Score & Progress */}
        <div className="w-full sm:w-72 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span>
              {answeredCount} of {totalQuestions} answered
            </span>
            {isMcq && answeredCount > 0 && (
              <span className="font-bold text-emerald-400">
                Score: {correctCount}/{answeredCount} ({accuracyPercentage}%)
              </span>
            )}
          </div>
          <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-500 h-full transition-all duration-300"
              style={{
                width: `${(answeredCount / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Timer & Finish/Exit Actions */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border/60 text-xs font-mono font-bold">
            <Clock className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className={timeRemainingSeconds < 300 ? "text-destructive font-black" : "text-foreground"}>
              {formatTime(timeRemainingSeconds)}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExitModal(true)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visualizer & Question Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* 3D Interviewer Avatar Visualizer */}
          <InterviewerVisualizer state={interviewerState} />

          {/* Question Card */}
          <Card className="border-border/60 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="violet" className="font-mono text-[10px]">
                  {currentQuestion.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                {currentQuestion.questionText}
              </h3>

              {/* Skills Tags */}
              {currentQuestion.relevantSkills && currentQuestion.relevantSkills.length > 0 && (
                <div className="pt-2 border-t border-border/40 flex flex-wrap gap-1.5">
                  {currentQuestion.relevantSkills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2 py-0.5 rounded-md bg-muted/60 text-[10px] font-mono text-muted-foreground"
                    >
                      #{sk}
                    </span>
                  ))}
                </div>
              )}

              {/* Hints Drawer */}
              {currentQuestion.hints && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showHints ? "Hide Interviewer Guidance" : "Need a Hint or Guidance?"}</span>
                  </button>
                  {showHints && (
                    <div className="mt-2 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground/90 leading-relaxed animate-in fade-in-50 duration-200">
                      <p className="font-semibold text-primary mb-1">Interviewer Guidance:</p>
                      {currentQuestion.hints}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive MCQ Options or Text Area */}
        <div className="lg:col-span-7 space-y-4">
          {isMcq ? (
            /* MCQ Option Selection Workspace */
            <Card className="border-border/60 shadow-lg">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                      Select Answer Option
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Choose the single most optimal engineering approach.
                    </p>
                  </div>
                  {!isCurrentAnswered && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded-md border border-border/40">
                      Keyboard: 1-4 or A-D • Enter to submit
                    </span>
                  )}
                </div>

                {/* 4 Accessible Option Cards */}
                <div
                  role="radiogroup"
                  aria-label="Technical Multiple Choice Options"
                  className="space-y-3"
                >
                  {displayOptions.map((optText, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    const isSelected = selectedOption === idx;
                    const isOptionCorrect = idx === correctIndex;
                    const isOptionWrongSelection = isCurrentAnswered && isSelected && !isOptionCorrect;

                    let cardClasses = "relative w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3.5 outline-none";
                    let badgeClasses = "w-7 h-7 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition-colors";

                    if (!isCurrentAnswered) {
                      // Pre-submission interactive state
                      if (isSelected) {
                        cardClasses += " bg-primary/15 border-primary ring-2 ring-primary/40 shadow-md shadow-primary/15";
                        badgeClasses += " bg-primary text-primary-foreground border-primary";
                      } else {
                        cardClasses += " bg-card/60 border-border/70 hover:border-primary/50 hover:bg-card/90 focus-visible:ring-2 focus-visible:ring-primary cursor-pointer";
                        badgeClasses += " bg-muted text-muted-foreground border-border/60";
                      }
                    } else {
                      // Post-submission state
                      if (isOptionCorrect) {
                        cardClasses += " bg-emerald-500/15 border-emerald-500/80 ring-2 ring-emerald-500/40 shadow-md shadow-emerald-500/10";
                        badgeClasses += " bg-emerald-500 text-white border-emerald-500";
                      } else if (isOptionWrongSelection) {
                        cardClasses += " bg-rose-500/15 border-rose-500/80 ring-2 ring-rose-500/40 shadow-md shadow-rose-500/10";
                        badgeClasses += " bg-rose-500 text-white border-rose-500";
                      } else {
                        cardClasses += " bg-card/30 border-border/40 opacity-60 cursor-default";
                        badgeClasses += " bg-muted/40 text-muted-foreground/60 border-border/30";
                      }
                    }

                    return (
                      <div
                        key={idx}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isCurrentAnswered ? -1 : 0}
                        onClick={() => {
                          if (!isCurrentAnswered && !submitting) {
                            setSelectedOption(idx);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isCurrentAnswered && !submitting && (e.key === " " || e.key === "Enter")) {
                            e.preventDefault();
                            setSelectedOption(idx);
                          }
                        }}
                        className={cardClasses}
                      >
                        <div className={badgeClasses}>
                          {isCurrentAnswered && isOptionCorrect ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : isCurrentAnswered && isOptionWrongSelection ? (
                            <X className="w-4 h-4 stroke-[3]" />
                          ) : (
                            letter
                          )}
                        </div>

                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-foreground leading-relaxed">
                            {optText}
                          </p>
                          {isCurrentAnswered && isOptionCorrect && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                              ✓ Correct Engineering Approach
                            </span>
                          )}
                          {isCurrentAnswered && isOptionWrongSelection && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
                              ✗ Your Selected Answer
                            </span>
                          )}
                        </div>

                        {/* Status Icon */}
                        {isCurrentAnswered && (
                          <div className="shrink-0 pt-0.5">
                            {isOptionCorrect && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in-75" />
                            )}
                            {isOptionWrongSelection && (
                              <XCircle className="w-5 h-5 text-rose-400 animate-in zoom-in-75" />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submission & Navigation Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {currentIndex > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        className="gap-1 text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous Question</span>
                      </Button>
                    )}

                    {!isCurrentAnswered && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip Question</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isCurrentAnswered ? (
                      currentIndex < totalQuestions - 1 ? (
                        <Button
                          size="md"
                          onClick={() => setCurrentIndex(currentIndex + 1)}
                          className="gap-1.5 shadow-md shadow-indigo-500/25"
                        >
                          <span>Continue to Next Question</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          onClick={() => setShowSummaryModal(true)}
                          className="gap-1.5 shadow-md shadow-indigo-500/25 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <span>View Final Performance Summary</span>
                          <Trophy className="w-4 h-4" />
                        </Button>
                      )
                    ) : (
                      <Button
                        size="md"
                        onClick={() => handleSubmit(false)}
                        disabled={selectedOption === null || submitting}
                        isLoading={submitting}
                        className="gap-2 px-6 shadow-md shadow-indigo-500/25"
                      >
                        <span>Submit Answer</span>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Open-Ended Behavioral Workspace with Live Video & Voice Access */
            <div className="space-y-4">
              {/* Live Webcam & Real-Time Voice Console */}
              <VideoVoiceConsole
                onTranscriptChange={(newText) => {
                  setAnswerText(newText);
                  setIsDraftSaved(false);
                }}
                currentAnswerText={answerText}
                questionText={currentQuestion?.questionText}
                interviewType={session?.interviewType || "BEHAVIORAL"}
              />

              <Card className="border-border/60 shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        Your Response (Voice Dictated & Typed)
                      </span>
                      {isDraftSaved && (
                        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 animate-in fade-in">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Autosaved locally</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                      <span>{wordCount} words</span>
                      <span>{charCount} chars</span>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    disabled={isCurrentAnswered || submitting}
                    placeholder="Speak using the 'Start Voice Response' button above, or formulate your structured response here using the STAR framework (Situation, Task, Action, Result)..."
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="w-full rounded-2xl border border-border/70 bg-card/60 p-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-80 resize-y leading-relaxed font-sans"
                  />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {currentIndex > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentIndex(currentIndex - 1)}
                        className="gap-1 text-xs"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Previous Question</span>
                      </Button>
                    )}

                    {!isCurrentAnswered && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSubmit(true)}
                        disabled={submitting}
                        className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Skip</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {isCurrentAnswered ? (
                      currentIndex < totalQuestions - 1 ? (
                        <Button
                          size="md"
                          onClick={() => setCurrentIndex(currentIndex + 1)}
                          className="gap-1.5"
                        >
                          <span>Next Question</span>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          size="md"
                          onClick={handleFinishAndReport}
                          isLoading={finishingEarly}
                          className="gap-1.5 shadow-md shadow-indigo-500/25"
                        >
                          <span>View Full Evaluation Report</span>
                          <Award className="w-4 h-4" />
                        </Button>
                      )
                    ) : (
                      <Button
                        size="md"
                        onClick={() => handleSubmit(false)}
                        isLoading={submitting}
                        className="gap-2 px-6 shadow-md shadow-indigo-500/25"
                      >
                        <span>Submit Answer</span>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          {/* MCQ Post-Submission Explanation & Result Banner */}
          {isMcq && isCurrentAnswered && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Result Indicator Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  mcqFeedback?.isCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {mcqFeedback?.isCorrect ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-sm text-foreground">
                      {mcqFeedback?.isCorrect
                        ? "Correct! +100% Score"
                        : "Incorrect Selection"}
                    </h5>
                    <p className="text-xs text-muted-foreground">
                      {mcqFeedback?.isCorrect
                        ? "Great job! You selected the optimal production-grade engineering solution."
                        : `Option ${String.fromCharCode(65 + correctIndex)} is the optimal answer. Review the explanation below.`}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={mcqFeedback?.isCorrect ? "success" : "warning"}
                  className="font-mono text-xs font-bold shrink-0"
                >
                  {mcqFeedback?.isCorrect ? "Score: 100/100" : "Score: 28/100"}
                </Badge>
              </div>

              {/* In-Depth Technical Concept Deep-Dive */}
              {explanationText && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/15 to-cyan-500/10 border border-violet-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">
                      Why This Is Correct & Architectural Analysis
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2 whitespace-pre-line font-sans">
                    {explanationText}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Qualitative Rubric Feedback Card (for open-ended rounds) */}
          {!isMcq && lastFeedback && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/15 to-cyan-500/10 border border-violet-500/30 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">AI Rubric Evaluation</span>
                </div>
                <Badge
                  variant={lastFeedback.overallScore >= 80 ? "success" : lastFeedback.overallScore >= 60 ? "cyan" : "warning"}
                  className="font-mono text-xs font-bold"
                >
                  Score: {lastFeedback.overallScore}/100
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Relevance</p>
                  <p className="font-bold text-indigo-400 mt-0.5">{lastFeedback.relevanceScore}%</p>
                </div>
                <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Technical</p>
                  <p className="font-bold text-violet-400 mt-0.5">{lastFeedback.technicalScore}%</p>
                </div>
                <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Completeness</p>
                  <p className="font-bold text-cyan-400 mt-0.5">{lastFeedback.completenessScore}%</p>
                </div>
                <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                  <p className="text-[10px] text-muted-foreground font-mono uppercase">Communication</p>
                  <p className="font-bold text-emerald-400 mt-0.5">{lastFeedback.communicationScore}%</p>
                </div>
              </div>

              {lastFeedback.strengths && lastFeedback.strengths.length > 0 && (
                <div className="text-xs text-foreground/90 space-y-1">
                  <span className="font-semibold text-emerald-400">Key Strength: </span>
                  <span>{lastFeedback.strengths[0]}</span>
                </div>
              )}

              {lastFeedback.improvementSuggestions && lastFeedback.improvementSuggestions.length > 0 && (
                <div className="text-xs text-foreground/90 space-y-1">
                  <span className="font-semibold text-amber-400">Improvement Focus: </span>
                  <span>{lastFeedback.improvementSuggestions[0]}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Final MCQ Summary & Celebration Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/25">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground">
                Technical Round Complete!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You have answered all multiple-choice questions for the {session.targetRole} Technical Round.
              </p>
            </div>

            {/* Scorecard Box */}
            <div className="p-4 rounded-2xl bg-background/80 border border-border/60 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Accuracy</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
                  {accuracyPercentage}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Correct</p>
                <p className="text-xl sm:text-2xl font-black text-primary mt-0.5">
                  {correctCount} / {totalQuestions}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Time Spent</p>
                <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5 font-mono">
                  {formatTime(elapsedSeconds)}
                </p>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              <p className="text-[10px] font-mono uppercase text-muted-foreground font-bold">
                Question Breakdown:
              </p>
              {session.questions.map((q, idx) => {
                const isQCorrect = q.answer?.isCorrect || q.isCorrect;
                return (
                  <div
                    key={q.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="font-mono text-muted-foreground font-bold">#{idx + 1}</span>
                      <span className="truncate text-foreground font-medium">{q.category}</span>
                    </div>
                    {isQCorrect ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Correct (+100%)</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold shrink-0 flex items-center gap-1">
                        <X className="w-3 h-3 stroke-[3]" />
                        <span>Incorrect (28%)</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <Button
                size="lg"
                className="w-full gap-2 shadow-lg shadow-indigo-500/25"
                onClick={handleFinishAndReport}
                isLoading={finishingEarly}
              >
                <Award className="w-4 h-4" />
                <span>View Full Performance Report & Analytics</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowSummaryModal(false)}
              >
                Review Answers & Explanations
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h3 className="font-bold text-foreground text-base">Interview Session Options</h3>
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Would you like to finalize your interview now and generate your performance report for completed questions, or discard the session?
            </p>
            <div className="space-y-2 pt-2">
              <Button
                variant="default"
                className="w-full text-xs gap-2"
                onClick={handleFinishAndReport}
                isLoading={finishingEarly}
              >
                <Award className="w-4 h-4" />
                <span>Finish & Generate Performance Report</span>
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-1/2 text-xs"
                  onClick={() => setShowExitModal(false)}
                >
                  Resume Interview
                </Button>
                <Button
                  variant="danger"
                  className="w-1/2 text-xs"
                  onClick={handleAbandonSession}
                >
                  Discard & Exit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Modal */}
      {showTimeExpiredModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 text-destructive border border-destructive/25 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-bold text-foreground text-lg">Interview Time Expired</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The designated time limit for this mock interview session has concluded. Click below to synthesize your 5-axis competency evaluation and performance diagnostic report.
            </p>
            <Button
              size="lg"
              className="w-full gap-2 mt-2"
              onClick={handleFinishAndReport}
              isLoading={finishingEarly}
            >
              <Award className="w-4 h-4" />
              <span>Generate My Performance Report</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewWorkspacePage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-spin">
            <Bot className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Preparing Interview Room...</p>
        </div>
      }
    >
      <InterviewWorkspaceContent />
    </React.Suspense>
  );
}
