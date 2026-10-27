"use client";

import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, ArrowRight } from "lucide-react";

export default function FaqPage() {
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const faqs = [
    {
      category: "AI & Rubric Scoring",
      q: "How does the AI evaluator grade my responses?",
      a: "Converza evaluates responses using a 5-dimensional rubric: Relevance (20%), Technical Correctness (35%), Completeness & Depth (20%), Communication Quality (15%), and Logical Reasoning (10%). For HR/behavioral questions, weights shift to emphasize STAR structure and interpersonal poise.",
    },
    {
      category: "AI & Rubric Scoring",
      q: "What is a '95+ Model Answer Outline'?",
      a: "Every evaluated question includes an exemplary response blueprint illustrating what a hiring manager at a tier-1 technology company expects. It demonstrates how to introduce the core concept, discuss trade-offs, mention edge cases, and conclude concisely.",
    },
    {
      category: "Privacy & Data",
      q: "Is my uploaded resume kept private and secure?",
      a: "Yes. Resumes are stored in an encrypted partition isolated strictly to your authenticated account ID. We never make resumes publicly discoverable, sell student data to third-party recruiters, or submit resumes to train public LLM weights.",
    },
    {
      category: "Privacy & Data",
      q: "Can I delete my resume and practice session history?",
      a: "Yes, you have complete sovereignty over your data. You can delete your uploaded resume, individual interview sessions, or your entire account with one click directly from your dashboard settings.",
    },
    {
      category: "Preparation & Usage",
      q: "Do I need a resume to start practicing?",
      a: "No. You can practice general role-based technical, behavioral, and HR interviews immediately. However, uploading your resume unlocks deep personalization where the AI questions you on your actual past projects, internships, and stated skills.",
    },
    {
      category: "Preparation & Usage",
      q: "How does pasting a job description work?",
      a: "During the 7-step setup wizard, paste any job posting. Converza's parser extracts key required competencies, libraries, and frameworks, synthesizing tailored questions directly aligned with that role's evaluation criteria.",
    },
    {
      category: "Account & Billing",
      q: "How does the Free tier differ from Pro and Career Plus?",
      a: "The Free tier provides 3 baseline mock sessions per month. Pro increases this to 15 monthly sessions, full resume-parsing personalization, custom job description matching, downloadable PDF reports, and weak-topic drills. Career Plus offers unlimited interviews and project rounds.",
    },
    {
      category: "Legal & Disclaimers",
      q: "Does scoring well on Converza guarantee a job or placement?",
      a: "No. Converza is an educational practice platform. Scores and readiness indicators are algorithmic estimates intended to help you benchmark and improve your answers. They do not constitute an employment warranty or placement guarantee.",
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 md:py-24 border-b border-border/40 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
            <Badge variant="cyan">Knowledge Base</Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Find answers regarding AI evaluation rubrics, resume privacy, interview formats, and placement readiness scores.
            </p>

            {/* Search Input */}
            <div className="max-w-md mx-auto pt-4 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. rubrics, resume, free tier)..."
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/70 bg-card/80 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No matching questions found for &ldquo;{searchQuery}&rdquo;. Try another term or contact support.
              </div>
            ) : (
              filteredFaqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border/60 bg-card/50 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-sm hover:text-primary transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                          {faq.category}
                        </span>
                        <span>{faq.q}</span>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border/30 animate-in fade-in-50 duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Bottom Support CTA */}
            <div className="mt-16 p-8 rounded-3xl bg-card/60 border border-border/60 text-center space-y-3">
              <h3 className="text-xl font-bold text-foreground">Have more questions?</h3>
              <p className="text-sm text-muted-foreground">
                Our team is here to assist college placement coordinators and students.
              </p>
              <div className="pt-2">
                <Button href="/contact" variant="outline" className="gap-2">
                  <span>Contact Support</span>
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
