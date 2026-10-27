"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PerformanceRadarChart } from "@/components/charts/PerformanceRadarChart";
import { ScoreTrendChart } from "@/components/charts/ScoreTrendChart";
import { SkillGapBarChart } from "@/components/charts/SkillGapBarChart";

export default function AnalyticsPage() {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/analytics/summary")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div className="h-10 w-64 bg-muted/40 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-muted/30 rounded-2xl skeleton-shimmer" />
          <div className="h-72 bg-muted/30 rounded-2xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const topicProgress = data?.topicProgress || [];
  const scoreTrend = data?.scoreTrend || [];

  const skillGapData = topicProgress.map((tp: any) => ({
    name: tp.title.split(" ")[0] + " " + (tp.title.split(" ")[1] || ""),
    mastery: tp.mastery,
    priority: tp.priority,
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Performance & Longitudinal Analytics
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Data visualizations tracking your competency progression, rubric averages, and skill mastery.
          </p>
        </div>

        <Button href="/dashboard/topics" size="sm" className="gap-1.5 text-xs">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Weak Topic Curriculum</span>
        </Button>
      </div>

      {/* 4 Metric Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/60 text-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Technical Avg</span>
          <p className="text-2xl font-black font-mono text-violet-400 mt-1">
            {metrics.avgTechnical || 0}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/60 text-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Communication Avg</span>
          <p className="text-2xl font-black font-mono text-cyan-400 mt-1">
            {metrics.avgCommunication || 0}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/60 text-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Relevance Avg</span>
          <p className="text-2xl font-black font-mono text-indigo-400 mt-1">
            {metrics.avgRelevance || 0}%
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/60 text-center">
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Completeness Avg</span>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {metrics.avgCompleteness || 0}%
          </p>
        </div>
      </div>

      {/* Two Column Charts: Radar + Score Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Multi-Axis Competency Radar */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Historical Rubrics</span>
            </div>
            <CardTitle className="text-base">5-Axis Longitudinal Radar</CardTitle>
            <CardDescription className="text-xs">
              Aggregate competency index across all evaluated loops
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <PerformanceRadarChart
              relevance={metrics.avgRelevance || 75}
              technical={metrics.avgTechnical || 75}
              completeness={metrics.avgCompleteness || 70}
              communication={metrics.avgCommunication || 80}
              reasoning={Math.round(((metrics.avgTechnical || 75) + (metrics.avgRelevance || 75)) / 2)}
            />
          </CardContent>
        </Card>

        {/* Score Progression Trend */}
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <TrendingUp className="w-4 h-4" />
              <span>Score Trajectory</span>
            </div>
            <CardTitle className="text-base">Interview Readiness Velocity</CardTitle>
            <CardDescription className="text-xs">
              Longitudinal score improvement across sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ScoreTrendChart data={scoreTrend} />
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Mastery Bar Chart */}
      <Card className="border-border/60">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs">
                <BarChart3 className="w-4 h-4" />
                <span>Concept Mastery</span>
              </div>
              <CardTitle className="text-base">Diagnosed Skill Gap Prioritization</CardTitle>
              <CardDescription className="text-xs">
                Mastery levels across key topics (Green = Confident, Cyan = Developing, Rose = High Priority)
              </CardDescription>
            </div>
            <Button href="/dashboard/topics" variant="outline" size="sm" className="text-xs gap-1">
              <span>Drill Weak Topics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <SkillGapBarChart data={skillGapData} />
        </CardContent>
      </Card>
    </div>
  );
}
