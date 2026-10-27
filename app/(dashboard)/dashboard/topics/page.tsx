"use client";

import * as React from "react";
import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function TopicsPage() {
  const [topics, setTopics] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");

  React.useEffect(() => {
    fetch("/api/analytics/summary")
      .then((res) => res.json())
      .then((data) => {
        if (data.topicProgress) {
          setTopics(data.topicProgress);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["ALL", "Database Engineering", "Frontend Architecture", "Data Structures & Algorithms", "Behavioral & HR"];

  const filteredTopics = topics.filter((t) =>
    selectedCategory === "ALL" ? true : t.category === selectedCategory
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Preparation Topics & Personalized Learning
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Weakness curriculum diagnosed directly from omitted concepts and rubric penalties in your completed mocks.
          </p>
        </div>

        <Button href="/dashboard/setup-interview" size="sm" className="gap-1.5 text-xs">
          <span>New Custom Mock</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat
                ? "bg-primary text-white shadow-sm"
                : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "ALL" ? "All Subjects" : cat}
          </button>
        ))}
      </div>

      {/* Topics List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-muted/30 rounded-2xl skeleton-shimmer" />
          ))
        ) : filteredTopics.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-2xl border border-border/60 bg-card/40 space-y-2">
            <p className="text-sm font-semibold text-foreground">No weak topics diagnosed yet</p>
            <p className="text-xs text-muted-foreground">
              Complete mock interview loops to automatically diagnose missing concepts.
            </p>
          </div>
        ) : (
          filteredTopics.map((topic) => (
            <Card key={topic.id} className="border-border/60 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {topic.category}
                  </Badge>
                  <Badge
                    variant={topic.priority === "HIGH" ? "warning" : "cyan"}
                    className="text-[10px] font-mono"
                  >
                    {topic.priority} Priority
                  </Badge>
                </div>
                <CardTitle className="text-base">{topic.title}</CardTitle>
                <CardDescription className="text-xs">
                  {topic.sessionsHad} practice session(s) evaluated on this concept
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">Mastery Index</span>
                    <span className="font-bold text-foreground">{topic.mastery}%</span>
                  </div>
                  <Progress value={topic.mastery} max={100} />
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {topic.mastery < 60 ? "Requires Focused Drill" : "Solid Placement Readiness"}
                  </span>

                  <Button href={`/dashboard/setup-interview?type=technical&topic=${encodeURIComponent(topic.title)}`} size="sm" className="gap-1 text-xs h-8">
                    <span>Practice Topic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
