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
  UserCheck,
  Building2,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

interface QuestionEvaluation {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  transcript: string;
  overallScore: number;
  starBreakdown: {
    situation: number;
    task: number;
    action: number;
    result: number;
    relevance: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
}

function BehavioralResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [targetRole, setTargetRole] = React.useState("Software Engineer");
  const [companyName, setCompanyName] = React.useState("Google");
  const [overallScore, setOverallScore] = React.useState(78);
  const [starAverages, setStarAverages] = React.useState({
    situation: 82,
    task: 80,
    action: 78,
    result: 72,
    relevance: 85,
  });
  const [questions, setQuestions] = React.useState<QuestionEvaluation[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/behavioral/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load results");
        const s = json.data.session;
        setTargetRole(s.targetRole || "Software Engineer");
        setCompanyName(s.companyName || "Tech Company");

        const parsedQuestions: QuestionEvaluation[] = (s.questions || []).map((q: any) => {
          const evalData = q.answer?.evaluation;
          let strengthsArr: string[] = [];
          let improvementsArr: string[] = [];
          try {
            if (evalData?.strengths) strengthsArr = JSON.parse(evalData.strengths);
            if (evalData?.weaknesses) improvementsArr = JSON.parse(evalData.weaknesses);
          } catch {}

          return {
            id: q.id,
            orderIndex: q.orderIndex,
            questionText: q.questionText,
            category: q.category,
            transcript: q.answer?.answerText || "No answer recorded.",
            overallScore: evalData?.overallScore || 75,
            starBreakdown: {
              situation: evalData?.situationScore || evalData?.relevanceScore || 80,
              task: evalData?.taskScore || evalData?.communicationScore || 78,
              action: evalData?.actionScore || evalData?.technicalScore || 75,
              result: evalData?.resultScore || evalData?.reasoningScore || 70,
              relevance: evalData?.starRelevanceScore || evalData?.relevanceScore || 85,
            },
            feedback: evalData?.feedback || "Structured responses using the STAR method effectively.",
            strengths: strengthsArr.length > 0 ? strengthsArr : ["Clear communication of personal responsibilities."],
            improvements:
              improvementsArr.length > 0
                ? improvementsArr
                : ["Incorporate more quantified metrics in the Result phase (e.g., % latency drop)."],
          };
        });

        setQuestions(parsedQuestions);

        if (s.behavioralScore) {
          setOverallScore(s.behavioralScore);
        } else if (parsedQuestions.length > 0) {
          const avg = Math.round(
            parsedQuestions.reduce((a, b) => a + b.overallScore, 0) / parsedQuestions.length
          );
          setOverallScore(avg);
        }

        // Compute averages across questions
        if (parsedQuestions.length > 0) {
          const n = parsedQuestions.length;
          setStarAverages({
            situation: Math.round(parsedQuestions.reduce((a, b) => a + b.starBreakdown.situation, 0) / n),
            task: Math.round(parsedQuestions.reduce((a, b) => a + b.starBreakdown.task, 0) / n),
            action: Math.round(parsedQuestions.reduce((a, b) => a + b.starBreakdown.action, 0) / n),
            result: Math.round(parsedQuestions.reduce((a, b) => a + b.starBreakdown.result, 0) / n),
            relevance: Math.round(parsedQuestions.reduce((a, b) => a + b.starBreakdown.relevance, 0) / n),
          });
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load behavioral results.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Synthesizing STAR Rubric Feedback...</p>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">Results Unavailable</h2>
          <p className="text-sm text-muted-foreground">{error || "Could not retrieve behavioral evaluation."}</p>
          <Button onClick={() => router.push("/behavioral/setup")} className="w-full">
            Start New Behavioral Round
          </Button>
        </div>
      </div>
    );
  }

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
        <FiveRoundStepper currentRound={4} completedRounds={[1, 2, 3, 4]} />

        {/* Hero Score Card */}
        <section className="bg-gradient-to-br from-card via-card to-purple-500/5 border border-border/70 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Round 4 Complete
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  STAR Rubric Evaluated
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {targetRole} Behavioral Evaluation
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Benchmarked for <span className="font-bold text-foreground">{companyName}</span> leadership principles.
                Evaluated across the 5 STAR dimensions: Situation, Task, Action, Result, and Question Relevance.
              </p>
            </div>

            {/* Score Pill */}
            <div className="flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/20 shrink-0">
              <span className="text-4xl font-extrabold">{overallScore}%</span>
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">STAR Score</span>
            </div>
          </div>

          {/* Next Round CTA Banner (HR Round) */}
          <div className="mt-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-purple-600/15 via-indigo-600/15 to-cyan-600/15 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Proceed to Round 5: HR Round (Final Round)</h4>
                <p className="text-xs text-muted-foreground">Face a senior HR director assessing motivation, culture fit, and career alignment.</p>
              </div>
            </div>

            <Button
              onClick={() =>
                router.push(
                  `/hr/setup?fromSession=${sessionId}&role=${encodeURIComponent(targetRole)}&company=${encodeURIComponent(
                    companyName
                  )}`
                )
              }
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs h-10 px-5 gap-2 shadow-md shadow-purple-600/25 shrink-0"
            >
              <span>Start Round 5 (HR Round)</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* 5-Axis STAR Breakdown Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">STAR Framework Performance Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Situation", score: starAverages.situation, desc: "Context & Setting" },
              { label: "Task", score: starAverages.task, desc: "Objective & Stakes" },
              { label: "Action", score: starAverages.action, desc: "Personal Contribution" },
              { label: "Result", score: starAverages.result, desc: "Measurable Impact" },
              { label: "Relevance", score: starAverages.relevance, desc: "Alignment to Role" },
            ].map((item) => (
              <div key={item.label} className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">{item.score}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed Question Review List */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">Answer Evaluations & AI Feedback</h2>
            <p className="text-xs text-muted-foreground">
              Review your recorded answers and the evaluator's constructive analysis.
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((q) => {
              const isExpanded = expandedId === q.id;
              return (
                <div key={q.id} className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">Question {q.orderIndex + 1}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {q.category}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          Score: {q.overallScore}%
                        </Badge>
                      </div>
                      <h3 className="text-sm font-semibold leading-relaxed pt-1 text-foreground">
                        {q.questionText}
                      </h3>
                    </div>

                    <button className="text-muted-foreground p-1 hover:text-foreground">
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pt-4 border-t border-border/50 space-y-4">
                      {/* Transcript Box */}
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                        <span className="font-bold text-muted-foreground block">Your Recorded Answer:</span>
                        <p className="italic text-foreground/90 whitespace-pre-wrap">{q.transcript}</p>
                      </div>

                      {/* STAR Dimensions */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-card border border-border text-center">
                          <span className="text-[10px] text-muted-foreground block">Situation</span>
                          <span className="font-bold">{q.starBreakdown.situation}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card border border-border text-center">
                          <span className="text-[10px] text-muted-foreground block">Task</span>
                          <span className="font-bold">{q.starBreakdown.task}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card border border-border text-center">
                          <span className="text-[10px] text-muted-foreground block">Action</span>
                          <span className="font-bold">{q.starBreakdown.action}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card border border-border text-center">
                          <span className="text-[10px] text-muted-foreground block">Result</span>
                          <span className="font-bold">{q.starBreakdown.result}%</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card border border-border text-center">
                          <span className="text-[10px] text-muted-foreground block">Relevance</span>
                          <span className="font-bold">{q.starBreakdown.relevance}%</span>
                        </div>
                      </div>

                      {/* Feedback & Recommendations */}
                      <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-foreground/90 space-y-2">
                        <div className="font-bold text-purple-600 dark:text-purple-400">
                          Evaluator Recommendations:
                        </div>
                        <p className="leading-relaxed">{q.feedback}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              Key Strengths:
                            </span>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {q.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                              Areas to Polish:
                            </span>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {q.improvements.map((im, i) => (
                                <li key={i}>{im}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
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
            onClick={() => router.push("/behavioral/setup")}
            className="text-xs h-9 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake Behavioral Round
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
                router.push(
                  `/hr/setup?fromSession=${sessionId}&role=${encodeURIComponent(targetRole)}&company=${encodeURIComponent(
                    companyName
                  )}`
                )
              }
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-purple-600/20"
            >
              <span>Continue to Round 5: HR Round</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function BehavioralResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <BehavioralResultsContent />
    </React.Suspense>
  );
}
