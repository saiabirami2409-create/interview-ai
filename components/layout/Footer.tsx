"use client";

import * as React from "react";
import Link from "next/link";
import { Bot, Shield, Sparkles, Heart } from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";

export function Footer() {
  const [currentYear, setCurrentYear] = React.useState(2026);

  React.useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-border/40 bg-card/40 backdrop-blur-md pt-16 pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-border/40">
          {/* Brand & Mission column */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
              <InterviewAILogo size="md" showWordmark />
            </Link>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              InterviewAI – Practice Smarter. Interview Better. Master technical rounds, test realistic Gemini-generated MCQs, track topic-wise progress, and accelerate career readiness.
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 font-mono">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Private & confidential evaluation environment</span>
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/features" className="hover:text-foreground transition-colors">
                  Features & Rubrics
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/#interview-types" className="hover:text-foreground transition-colors">
                  Interview Types
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Preparation
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq" className="hover:text-foreground transition-colors">
                  Placement FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">
                  Free Assessment
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Student Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Legal & Trust
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-foreground transition-colors">
                  Accessibility (WCAG AA)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {currentYear} Converza Inc. All rights reserved.</p>
          <p className="text-center sm:text-right text-[11px] max-w-md">
            Converza scoring rubrics and assessments are diagnostic educational tools for interview preparation and do not constitute a legal or factual employment guarantee.
          </p>
        </div>
      </div>
    </footer>
  );
}
