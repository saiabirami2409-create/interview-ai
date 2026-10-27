import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Terms of Service — Converza",
  description:
    "Terms of service, user agreements, and educational disclaimers for using Converza.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3 border-b border-border/40 pb-8">
            <Badge variant="violet">Legal Agreement</Badge>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Terms of Service & Platform Agreement
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Last updated: October 2026 • Platform Version 1.0
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
              <p>
                By registering, accessing, or using Converza (&ldquo;Platform&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not access or use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">2. Educational Practice Disclaimer</h2>
              <div className="p-4 rounded-xl bg-card border border-border/60 text-foreground">
                <strong>Critical Notice:</strong> Converza is an educational technology tool engineered strictly for simulation, practice, and diagnostic self-assessment. Performance reports, readiness scores, and AI-generated evaluations do NOT constitute a legal guarantee, warranty, or representation of employment, placement success, interview clearance, or recruitment outcomes with any third-party employer.
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. User Responsibilities & Acceptable Use</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  You agree to upload only resumes and materials that you possess the legal authority to submit.
                </li>
                <li>
                  You agree not to attempt prompt injection, jailbreaking, reverse engineering, or exploiting the underlying AI inference pipelines.
                </li>
                <li>
                  You agree not to share account credentials or bypass tiered usage limits through automated bots or scraping tools.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. Intellectual Property</h2>
              <p>
                The Converza interface, 3D visualization assets, scoring rubrics, algorithms, and website design are proprietary assets protected by copyright and intellectual property laws. You retain ownership of your submitted answers and uploaded resume documents.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">5. Termination & Modifications</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate fair usage policies or security standards. We may update these terms periodically to reflect platform capabilities and regulatory requirements.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
