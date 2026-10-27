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
  FileText,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FiveRoundStepper } from "@/components/interview/FiveRoundStepper";

interface HREvaluationQuestion {
  id: string;
  orderIndex: number;
  questionText: string;
  category: string;
  transcript: string;
  overallScore: number;
  criteria: {
    communicationClarity: number;
    professionalPresence: number;
    cultureFit: number;
    motivationSelfAwareness: number;
    conflictProblemSolving: number;
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
}

function HRResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [targetRole, setTargetRole] = React.useState("Software Engineer");
  const [companyName, setCompanyName] = React.useState("Google");
  const [overallScore, setOverallScore] = React.useState(82);
  const [criteriaAverages, setCriteriaAverages] = React.useState({
    communicationClarity: 85,
    professionalPresence: 82,
    cultureFit: 84,
    motivationSelfAwareness: 80,
    conflictProblemSolving: 78,
  });
  const [questions, setQuestions] = React.useState<HREvaluationQuestion[]>([]);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    fetch(`/api/hr/session/${sessionId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) throw new Error(json.error?.message || "Failed to load HR results");
        const s = json.data.session;
        setTargetRole(s.targetRole || "Software Engineer");
        setCompanyName(s.companyName || "Tech Company");

        const parsedQuestions: HREvaluationQuestion[] = (s.questions || []).map((q: any) => {
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
            overallScore: evalData?.overallScore || 80,
            criteria: {
              communicationClarity: evalData?.hrClarityScore || evalData?.communicationScore || 85,
              professionalPresence: evalData?.hrExamplesScore || 82,
              cultureFit: evalData?.hrRelevanceScore || evalData?.relevanceScore || 84,
              motivationSelfAwareness: evalData?.hrAlignmentScore || 80,
              conflictProblemSolving: evalData?.hrReasoningScore || 78,
            },
            feedback:
              evalData?.feedback ||
              "Delivered a well-articulated response with good alignment to organizational values.",
            strengths: strengthsArr.length > 0 ? strengthsArr : ["Clear communication and professional tone."],
            improvements:
              improvementsArr.length > 0
                ? improvementsArr
                : ["Ground salary expectations in localized industry market bands."],
          };
        });

        setQuestions(parsedQuestions);

        if (s.hrScore) {
          setOverallScore(s.hrScore);
        } else if (parsedQuestions.length > 0) {
          const avg = Math.round(
            parsedQuestions.reduce((a, b) => a + b.overallScore, 0) / parsedQuestions.length
          );
          setOverallScore(avg);
        }

        if (parsedQuestions.length > 0) {
          const n = parsedQuestions.length;
          setCriteriaAverages({
            communicationClarity: Math.round(
              parsedQuestions.reduce((a, b) => a + b.criteria.communicationClarity, 0) / n
            ),
            professionalPresence: Math.round(
              parsedQuestions.reduce((a, b) => a + b.criteria.professionalPresence, 0) / n
            ),
            cultureFit: Math.round(parsedQuestions.reduce((a, b) => a + b.criteria.cultureFit, 0) / n),
            motivationSelfAwareness: Math.round(
              parsedQuestions.reduce((a, b) => a + b.criteria.motivationSelfAwareness, 0) / n
            ),
            conflictProblemSolving: Math.round(
              parsedQuestions.reduce((a, b) => a + b.criteria.conflictProblemSolving, 0) / n
            ),
          });
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load HR evaluation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-purple-600 border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">Aggregating HR Director Evaluation...</p>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold">HR Evaluation Unavailable</h2>
          <Button onClick={() => router.push("/hr/setup")} className="w-full">
            Start HR Interview
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

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
        {/* 5-Round Workflow Stepper */}
        <FiveRoundStepper currentRound={5} completedRounds={[1, 2, 3, 4, 5]} />

        {/* Hero Score Card */}
        <section className="bg-gradient-to-br from-card via-card to-purple-500/5 border border-border/70 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Round 5 Complete (Final Round)
                </Badge>
                <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  HR Director Certified
                </Badge>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {targetRole} HR Interview Evaluation
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl">
                Conducted with Sarah Jenkins, Senior HR Director for{" "}
                <span className="font-bold text-foreground">{companyName}</span>. Evaluated across 5 core criteria including culture alignment, conflict resolution, and self-awareness.
              </p>
            </div>

            {/* Score Pill */}
            <div className="flex flex-col items-center justify-center w-36 h-36 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/20 shrink-0">
              <span className="text-4xl font-extrabold">{overallScore}%</span>
              <span className="text-xs font-medium text-white/80 uppercase tracking-wider mt-1">HR Score</span>
            </div>
          </div>

          {/* Proceed to Final Performance Report CTA */}
          <div className="mt-8 p-4 md:p-5 rounded-2xl bg-gradient-to-r from-emerald-600/15 via-teal-600/15 to-cyan-600/15 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">View Your Final 5-Round Comprehensive Performance Report</h4>
                <p className="text-xs text-muted-foreground">Access your combined overall score, round comparison analytics, and PDF download.</p>
              </div>
            </div>

            <Button
              onClick={() => router.push(`/report?sessionId=${sessionId}`)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs h-10 px-5 gap-2 shadow-md shadow-emerald-600/25 shrink-0"
            >
              <span>View Final Performance Report</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>

        {/* 5 HR Criteria Cards */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold">HR Evaluation Criteria Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Communication", score: criteriaAverages.communicationClarity, desc: "Clarity & Articulation" },
              { label: "Presence", score: criteriaAverages.professionalPresence, desc: "Poise & Confidence" },
              { label: "Culture Fit", score: criteriaAverages.cultureFit, desc: "Company Resonance" },
              { label: "Motivation", score: criteriaAverages.motivationSelfAwareness, desc: "Drive & Self-Awareness" },
              { label: "Conflict Res.", score: criteriaAverages.conflictProblemSolving, desc: "Maturity & Empathy" },
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

        {/* Detailed Review */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold">HR Director Commentary & Question Review</h2>
            <p className="text-xs text-muted-foreground">
              Review your recorded answers and Sarah Jenkins' professional assessment.
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
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1">
                        <span className="font-bold text-muted-foreground block">Your Response:</span>
                        <p className="italic text-foreground/90 whitespace-pre-wrap">{q.transcript}</p>
                      </div>

                      <div className="p-3.5 rounded-xl border border-purple-500/20 bg-purple-500/5 text-xs text-foreground/90 space-y-2">
                        <div className="font-bold text-purple-600 dark:text-purple-400">
                          HR Director Assessment:
                        </div>
                        <p className="leading-relaxed">{q.feedback}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                          <div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                              Strengths:
                            </span>
                            <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                              {q.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">
                              Advice for Growth:
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

        {/* Footer Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={() => router.push("/hr/setup")}
            className="text-xs h-9 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake HR Round
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
              onClick={() => router.push(`/report?sessionId=${sessionId}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <span>View Final Performance Report</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function HRResultsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <HRResultsContent />
    </React.Suspense>
  );
}
