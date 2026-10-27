"use client";

import * as React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Sparkles, HelpCircle } from "lucide-react";

export default function PricingPage() {
  const [selectedTier, setSelectedTier] = React.useState<string | null>(null);

  const tiers = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      description: "Foundational interview practice for college placement starters.",
      features: [
        "3 AI mock interviews per month",
        "Core Technical & HR question categories",
        "Basic question-wise rubric scoring",
        "Standard session history",
        "Standard interview duration (15 min)",
      ],
      notIncluded: [
        "Resume-aware question personalization",
        "Job description pasting & custom loops",
        "5-axis in-depth competency reports",
        "Downloadable PDF performance reports",
        "Personalized weak topic drills",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "₹499",
      period: "per month",
      description: "Comprehensive preparation for active placement season candidates.",
      features: [
        "15 AI mock interviews per month",
        "Resume-aware question personalization",
        "Job description pasting & custom loops",
        "5-axis in-depth competency reports",
        "Detailed 95+ model answer outlines",
        "Personalized weak topic drills",
        "Downloadable PDF performance reports",
      ],
      notIncluded: [
        "Unlimited practice sessions",
        "Placement readiness certification report",
      ],
      popular: true,
    },
    {
      name: "Career Plus",
      price: "₹999",
      period: "per month",
      description: "Intensive training for tier-1 tech company recruitment drives.",
      features: [
        "Unlimited AI mock interviews",
        "Resume-aware question personalization",
        "Job description pasting & custom loops",
        "Advanced System Design & Project rounds",
        "STAR behavioral mastery feedback",
        "Full historical analytics & radar tracking",
        "Downloadable PDF performance reports",
        "Placement readiness certification report",
      ],
      notIncluded: [],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 md:py-24 border-b border-border/40 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
            <Badge variant="violet">Simple & Transparent</Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Invest in Your Placement Readiness
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transparent, student-friendly pricing with transparent demo activation. Choose the plan that fits your campus drive schedule.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-3xl border p-8 flex flex-col justify-between relative transition-all duration-300 ${
                    tier.popular
                      ? "border-violet-500 bg-gradient-to-b from-violet-500/10 via-card to-card shadow-2xl shadow-violet-500/10 md:-translate-y-2"
                      : "border-border/70 bg-card/60"
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge variant="violet" className="px-3 py-1 text-[11px] shadow-md uppercase font-mono tracking-wider">
                        Recommended for Placements
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{tier.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black font-mono text-foreground">{tier.price}</span>
                      <span className="text-xs text-muted-foreground">/{tier.period}</span>
                    </div>

                    <div className="pt-4 border-t border-border/40 space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Features:
                      </span>
                      <ul className="space-y-2.5 text-xs text-foreground/90">
                        {tier.features.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                        {tier.notIncluded.map((feat, i) => (
                          <li key={i} className="flex items-center gap-2 text-muted-foreground/50">
                            <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-8">
                    <Button
                      type="button"
                      variant={tier.popular ? "default" : "outline"}
                      onClick={() => setSelectedTier(tier.name)}
                      className="w-full py-3 h-11 font-semibold text-sm shadow-md"
                    >
                      {tier.name === "Free" ? "Start Free Practice" : `Choose ${tier.name}`}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground font-mono mt-8">
              *Payment integration is currently running in transparent demonstration mode. Selecting any tier enables full access immediately without charging a card.
            </p>
          </div>
        </section>
      </main>

      <Footer />

      {/* Demo Modal */}
      {selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-foreground">Select {selectedTier} Plan</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTier(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              You selected the <strong className="text-foreground">{selectedTier}</strong> plan. In accordance with system guidelines, mock payment mode is enabled — no payment gateway credentials are required.
            </p>

            <div className="p-3.5 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground font-mono space-y-1">
              <p>Plan: {selectedTier}</p>
              <p>Amount: {selectedTier === "Free" ? "₹0" : selectedTier === "Pro" ? "₹499" : "₹999"}</p>
              <p>Simulated Status: Instant activation ready</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setSelectedTier(null)}
              >
                Cancel
              </Button>
              <Button
                href={`/signup?plan=${selectedTier.toLowerCase().replace(" ", "_")}`}
                className="w-1/2"
              >
                Activate & Continue
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
