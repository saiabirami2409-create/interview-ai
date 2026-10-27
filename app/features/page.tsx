import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Brain,
  FileText,
  Target,
  Code2,
  Users2,
  Layers,
  Sparkles,
  BarChart3,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "Features & Rubrics — Converza",
  description:
    "Explore Converza's institutional-grade AI question generator, resume personalization, 5-axis evaluation rubrics, and longitudinal analytics.",
};

export default function FeaturesPage() {
  const deepFeatures = [
    {
      icon: Brain,
      title: "Role-Specific Dynamic Questioning",
      category: "Question Synthesis",
      description:
        "Generates multi-tiered technical questions tailored to specific engineering disciplines: Frontend (DOM, React, Web Vitals), Backend (APIs, Concurrency, Caching), Full-Stack, ML/AI, DevOps, and Data Engineering.",
      details: [
        "Avoids repetitive questions across sessions",
        "Adapts question complexity dynamically from Beginner to Advanced",
        "Includes architectural scenarios and edge-case handling",
      ],
    },
    {
      icon: FileText,
      title: "Deep Resume Grounding",
      category: "Personalization Engine",
      description:
        "Parses candidate resumes to extract stated skills, libraries, internships, and capstone projects. The AI directly questions candidates on their implementation choices and challenges.",
      details: [
        "Identifies frameworks and database tools on your CV",
        "Detects project architecture claims and formulates defense questions",
        "Sanitizes document contents to prevent prompt injection",
      ],
    },
    {
      icon: Target,
      title: "Job-Description Precision Matching",
      category: "Placement Targeting",
      description:
        "Paste the exact job specification from campus recruitment drives or job portals. Converza isolates key competencies and simulates that specific company's hiring priorities.",
      details: [
        "Extracts must-have skills vs nice-to-have qualifications",
        "Calibrates question weights to company domain",
        "Supports custom engineering roles and requirements",
      ],
    },
    {
      icon: Sparkles,
      title: "5-Axis Rubric Answer Evaluation",
      category: "Evaluation Science",
      description:
        "Every response is objectively dissected across Relevance (20%), Technical Correctness (35%), Completeness & Depth (20%), Communication Quality (15%), and Logical Reasoning (10%).",
      details: [
        "Generates question-by-question scoring breakdown",
        "Pinpoints exact missing technical concepts and algorithms",
        "Provides 95+ model answer outlines for comparison",
      ],
    },
    {
      icon: Users2,
      title: "STAR Behavioral Analysis",
      category: "Soft Skills & Poise",
      description:
        "Evaluates Situation, Task, Action, and Result progression in behavioral rounds. Detects vague rambling, passive language, and lack of quantifiable outcomes.",
      details: [
        "Scores role ownership and individual contribution clarity",
        "Provides constructive guidance on structuring concise narratives",
        "Zero scoring of accents or superficial personal traits",
      ],
    },
    {
      icon: BarChart3,
      title: "Longitudinal Analytics & Skill Gaps",
      category: "Performance Tracking",
      description:
        "Visualizes your competency growth over time with 5-axis radar graphs, category progress bars, and historical performance trajectories.",
      details: [
        "Calculates overall Placement Readiness Score",
        "Tracks recurring weak topics across multiple practice loops",
        "Provides 1-click drill sessions directly from identified gaps",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Page Header */}
        <section className="py-16 md:py-24 border-b border-border/40 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
            <Badge variant="violet">System Capabilities</Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Institutional-Grade Mock Interview Intelligence
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover how Converza bridges the preparation-to-placement gap with resume-aware question generation and objective rubric scoring.
            </p>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {deepFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-3xl border border-border/60 bg-card/50 p-8 space-y-6 flex flex-col justify-between hover:border-violet-500/40 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="outline" className="font-mono text-xs">
                          {feat.category}
                        </Badge>
                      </div>

                      <h3 className="text-2xl font-bold text-foreground">{feat.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feat.description}
                      </p>

                      <div className="pt-2 border-t border-border/40 space-y-2">
                        {feat.details.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-foreground/85">
                            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/10 border border-border/60 text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Experience These Capabilities in a Live Mock Session
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                No credit card required. Free diagnostic interviews available for all supported technical and behavioral formats.
              </p>
              <div className="pt-2">
                <Button href="/signup" size="lg" className="gap-2">
                  <span>Start Free Mock Interview</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
