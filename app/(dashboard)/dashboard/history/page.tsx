"use client";

import * as React from "react";
import Link from "next/link";
import { History, Search, Filter, RotateCcw, Award, Clock, ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("ALL");

  React.useEffect(() => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessions) {
          setSessions(data.sessions);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.targetRole.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || s.interviewType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Interview History & Archive
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search, filter, and review all previous mock interview sessions and diagnostic reports.
          </p>
        </div>

        <Button href="/dashboard/setup-interview" size="sm" className="gap-1.5 text-xs">
          <span>New Interview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role, title, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/70 bg-card/60 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          {["ALL", "TECHNICAL", "BEHAVIORAL", "HR", "PROJECT_BASED"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === type
                  ? "bg-primary text-white shadow-sm"
                  : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {type === "ALL" ? "All Formats" : type.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <div className="h-16 w-full bg-muted/40 rounded-xl skeleton-shimmer" />
              <div className="h-16 w-full bg-muted/40 rounded-xl skeleton-shimmer" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Bot className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No matching sessions found</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Try clearing your search filters or start a new mock interview session.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-sm">{session.title}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {session.interviewType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>{formatDate(session.createdAt)}</span>
                      <span>•</span>
                      <span>{session.difficulty} Difficulty</span>
                      <span>•</span>
                      <span>{session.questions?.length || session.questionCount} Questions</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {session.status === "COMPLETED" ? (
                      <>
                        <Badge
                          variant={
                            (session.report?.overallScore || 0) >= 80
                              ? "success"
                              : (session.report?.overallScore || 0) >= 65
                              ? "cyan"
                              : "warning"
                          }
                          className="font-mono text-xs font-bold"
                        >
                          Score: {session.report?.overallScore || 0}/100
                        </Badge>
                        <Button href={`/dashboard/report/${session.id}`} variant="outline" size="sm" className="text-xs h-8">
                          View Report
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-xs font-mono text-muted-foreground">
                          In Progress
                        </Badge>
                        <Button href={`/dashboard/interview/${session.id}`} size="sm" className="text-xs h-8">
                          Resume Session
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
