import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Target,
  Bot,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Lock,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "How It Works — Converza",
  description:
    "See how Converza conducts realistic mock interviews from resume parsing to comprehensive performance reporting.",
};

export default function HowItWorksPage() {
  const steps = [
    {
      step: "01",
      title: "Create Profile & Upload Resume",
      subtitle: "Automated Skill & Experience Extraction",
      desc: "Sign up in 30 seconds and upload your resume in PDF or DOCX format. Our secure parser extracts your programming languages, frameworks, databases, and capstone projects. You can review and fine-tune detected skills or continue manually without a resume.",
      icon: FileText,
      points: [
        "Private, encrypted document storage with one-click deletion",
        "Supports PDF and DOCX formats up to 5MB",
        "Manual skill override fallback if document text cannot be parsed",
      ],
    },
    {
      step: "02",
      title: "Configure Role & Target Job Description",
      subtitle: "Simulate Real Company Hiring Loops",
      desc: "Choose from 10+ software engineering disciplines or paste the exact job description from your placement drive. Configure difficulty from Beginner to Advanced, select the round type (Technical, HR, Behavioral, or Project-Based), and set the question count.",
      icon: Target,
      points: [
        "Matches questions against the exact job description keywords",
        "Configurable difficulty parameters (Beginner, Intermediate, Advanced)",
        "Select between 3 to 10 questions to fit your practice schedule",
      ],
    },
    {
      step: "03",
      title: "Interactive AI Mock Interview Session",
      subtitle: "Focus in a Distraction-Free Workspace",
      desc: "Enter our dedicated interview room featuring an interactive AI interviewer avatar, live countdown timer, and draft autosave. Formulate and submit your answers in text mode, review previous answers, and navigate through the session at your own pace.",
      icon: Bot,
      points: [
        "Autosaves drafts locally and on the server so you never lose work",
        "Clear timer and question progression indicators",
        "Optional hints drawer for guidance when you get stuck",
      ],
    },
    {
      step: "04",
      title: "Comprehensive Report & Weak Topic Drills",
      subtitle: "Data-Driven Actionable Preparation",
      desc: "Receive an instant, multi-dimensional performance report. Review your 5-axis competency radar (Relevance, Technical, Completeness, Communication, Reasoning), inspect question-by-question model answers, and launch 1-click drill sessions on identified weak topics.",
      icon: BarChart3,
      points: [
        "Interactive Recharts radar chart and score comparisons",
        "Exemplary 95+ model answer outlines for every question",
        "1-click launch targeted interviews focusing on your weak topics",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 md:py-24 border-b border-border/40 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
            <Badge variant="cyan">Preparation Workflow</Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              How Converza Prepares You for Real Hiring Loops
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A structured 4-step methodology designed to turn college placement candidates into confident, structured interviewees.
            </p>
          </div>
        </section>

        {/* Steps Walkthrough */}
        <section className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-border/60 bg-card/50 p-8 sm:p-10 flex flex-col md:flex-row gap-8 items-start hover:border-primary/40 transition-colors"
                >
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <span className="font-mono text-4xl sm:text-5xl font-black text-primary/80">
                      {s.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                        {s.subtitle}
                      </span>
                      <h3 className="text-2xl font-bold text-foreground mt-0.5">{s.title}</h3>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

                    <div className="pt-2 border-t border-border/40 space-y-2">
                      {s.points.map((pt, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-foreground/85">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Call to action card */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-violet-600/15 via-indigo-600/20 to-cyan-500/10 border border-border/60 text-center space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to Start Step 1?
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                Set up your free candidate profile and begin your first mock interview in less than two minutes.
              </p>
              <div className="pt-2">
                <Button href="/signup" size="lg" className="gap-2">
                  <span>Create Your Free Account</span>
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
