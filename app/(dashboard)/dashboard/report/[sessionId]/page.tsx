"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Printer,
  Download,
  RotateCcw,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Layers,
  Code2,
  Brain,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PerformanceRadarChart } from "@/components/charts/PerformanceRadarChart";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { getScoreColor } from "@/lib/utils";

function PerformanceReportContent() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openQuestionIdx, setOpenQuestionIdx] = React.useState<number | null>(0);

  React.useEffect(() => {
    fetch(`/api/interviews/${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-spin">
          <Award className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-foreground">Generating Performance Report...</p>
        <p className="text-xs text-muted-foreground font-mono">Aggregating 5-axis rubrics & model answer outlines</p>
      </div>
    );
  }

  const report = session.report;
  const overallScore = report?.overallScore || 0;
  const scoreColors = getScoreColor(overallScore);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200 print:p-0">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="cyan" className="font-mono text-[10px]">
              Final Evaluation
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              Session ID: {sessionId.slice(0, 8)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Interview Performance Report
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {session.targetRole} • {session.interviewType.replace("_", " ")} Round • {session.questions.length} Questions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>

          <Button href="/dashboard/topics" size="sm" className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Weak Topics</span>
          </Button>
        </div>
      </div>

      {/* OVERALL READINESS SCORE HERO BANNER */}
      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Score Badge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-2xl bg-card/60 border border-border/60">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Overall Practice Score
            </span>
            <div className="my-2">
              <span className="text-6xl font-black font-mono text-foreground tracking-tight">
                {overallScore}
              </span>
              <span className="text-xl text-muted-foreground font-mono">/100</span>
            </div>
            <Badge variant={overallScore >= 80 ? "success" : overallScore >= 65 ? "cyan" : "warning"} className="font-mono text-xs">
              {report?.readinessLevel || "In Progress"}
            </Badge>
          </div>

          {/* Right: Diagnostic Summary */}
          <div className="md:col-span-8 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Readiness Diagnostic Assessment
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {report?.readinessSummary ||
                  "Detailed diagnostic summary synthesized from your evaluated answer rubrics, logical depth, and communication structure."}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40">
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-center">
                <span className="text-[9px] uppercase font-mono text-muted-foreground">Technical</span>
                <p className="font-bold font-mono text-violet-400 text-sm mt-0.5">
                  {report?.technicalScore || 0}%
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-center">
                <span className="text-[9px] uppercase font-mono text-muted-foreground">Communication</span>
                <p className="font-bold font-mono text-cyan-400 text-sm mt-0.5">
                  {report?.communicationScore || 0}%
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-center">
                <span className="text-[9px] uppercase font-mono text-muted-foreground">Relevance</span>
                <p className="font-bold font-mono text-indigo-400 text-sm mt-0.5">
                  {report?.relevanceScore || 0}%
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-background/50 border border-border/40 text-center">
                <span className="text-[9px] uppercase font-mono text-muted-foreground">Completeness</span>
                <p className="font-bold font-mono text-emerald-400 text-sm mt-0.5">
                  {report?.completenessScore || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: RADAR + CATEGORY BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Multi-Axis Competency</span>
            </div>
            <CardTitle className="text-base">5-Dimensional Performance Radar</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PerformanceRadarChart
              relevance={report?.relevanceScore || 70}
              technical={report?.technicalScore || 70}
              completeness={report?.completenessScore || 70}
              communication={report?.communicationScore || 70}
              reasoning={Math.round(((report?.technicalScore || 70) + (report?.relevanceScore || 70)) / 2)}
            />
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
              <BarChart3 className="w-4 h-4" />
              <span>Category Breakdown</span>
            </div>
            <CardTitle className="text-base">Rubric Dimension Comparison</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <CategoryBreakdownChart
              relevance={report?.relevanceScore || 70}
              technical={report?.technicalScore || 70}
              completeness={report?.completenessScore || 70}
              communication={report?.communicationScore || 70}
            />
          </CardContent>
        </Card>
      </div>

      {/* STRENGTHS & WEAKNESSES ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Strengths */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Demonstrated Strengths</span>
            </div>
            <CardTitle className="text-base">Where You Excelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {report?.topStrengths && report.topStrengths.length > 0 ? (
              report.topStrengths.map((str: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{str}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Good initial effort across all questions.</p>
            )}
          </CardContent>
        </Card>

        {/* Critical Weaknesses & Gaps */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Priority Skill Gaps</span>
            </div>
            <CardTitle className="text-base">Targeted Improvement Areas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {report?.criticalWeaknesses && report.criticalWeaknesses.length > 0 ? (
              report.criticalWeaknesses.map((weak: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{weak}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Review edge cases and trade-off justification.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QUESTION-BY-QUESTION DETAILED EVALUATION ACCORDION */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <span>Question-by-Question Rubric Breakdown</span>
        </h2>

        <div className="space-y-4">
          {session.questions.map((q: any, idx: number) => {
            const isOpen = openQuestionIdx === idx;
            const evalData = q.answer?.evaluation;
            const questionScore = evalData?.overallScore || 0;

            return (
              <Card key={q.id} className="overflow-hidden border-border/60">
                {/* Accordion Trigger */}
                <button
                  type="button"
                  onClick={() => setOpenQuestionIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold font-mono text-xs shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="violet" className="font-mono text-[9px]">
                          {q.category}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {q.difficulty}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground leading-snug">
                        {q.questionText}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <Badge
                      variant={questionScore >= 80 ? "success" : questionScore >= 65 ? "cyan" : "warning"}
                      className="font-mono text-xs font-bold"
                    >
                      {questionScore}/100
                    </Badge>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Question Details */}
                {isOpen && (
                  <div className="px-5 pb-6 pt-2 border-t border-border/40 space-y-5 animate-in fade-in-50 duration-200">
                    {/* Candidate Submitted Answer */}
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                        Your Submitted Response:
                      </span>
                      <div className="p-4 rounded-xl bg-card border border-border/60 text-xs text-foreground/90 leading-relaxed font-sans whitespace-pre-wrap">
                        {q.answer?.answerText || "No response submitted."}
                      </div>
                    </div>

                    {/* Rubric Score Breakdown */}
                    {evalData && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">Relevance</p>
                          <p className="font-bold text-indigo-400 mt-0.5">{evalData.relevanceScore}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">Technical</p>
                          <p className="font-bold text-violet-400 mt-0.5">{evalData.technicalScore}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">Completeness</p>
                          <p className="font-bold text-cyan-400 mt-0.5">{evalData.completenessScore}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">Communication</p>
                          <p className="font-bold text-emerald-400 mt-0.5">{evalData.communicationScore}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/60 border border-border/40">
                          <p className="text-[10px] text-muted-foreground font-mono uppercase">Reasoning</p>
                          <p className="font-bold text-amber-400 mt-0.5">{evalData.reasoningScore}%</p>
                        </div>
                      </div>
                    )}

                    {/* Evaluation Insights: Strengths & Weaknesses */}
                    {evalData && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Identified Strengths</span>
                          </span>
                          <ul className="text-xs text-foreground/85 space-y-1 pl-4 list-disc">
                            {evalData.strengths.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Improvement Suggestions</span>
                          </span>
                          <ul className="text-xs text-foreground/85 space-y-1 pl-4 list-disc">
                            {evalData.improvementSuggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* 95+ Model Answer Outline */}
                    {evalData?.modelAnswerOutline && (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 space-y-1.5">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>95+ Exemplary Model Answer Outline</span>
                        </span>
                        <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                          {evalData.modelAnswerOutline}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-8 rounded-3xl bg-card border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left print:hidden">
        <div>
          <h3 className="text-lg font-bold text-foreground">Ready for Your Next Practice Loop?</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Retake this interview with fresh randomized questions or drill your identified weak topics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            href={`/dashboard/setup-interview?type=${(session.interviewType || "technical").toLowerCase()}&role=${encodeURIComponent(session.targetRole || "")}`}
            variant="outline"
            size="md"
            className="gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Interview</span>
          </Button>
          <Button href="/dashboard/topics" size="md" className="gap-1.5">
            <span>Practice Weak Topics</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          <strong>Educational Practice Notice:</strong> Converza performance scores and readiness assessments are diagnostic simulation metrics designed for skill improvement. They do not constitute an employment guarantee, hiring promise, or official placement warranty from any corporate employer.
        </span>
      </div>
    </div>
  );
}

export default function PerformanceReportPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-spin">
            <Award className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">Generating Performance Report...</p>
        </div>
      }
    >
      <PerformanceReportContent />
    </React.Suspense>
  );
}

