import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Accessibility Statement — Converza",
  description:
    "Converza's commitment to digital accessibility in accordance with WCAG 2.2 AA standards.",
};

export default function AccessibilityPage() {
  const standards = [
    "Full keyboard navigability across all public marketing and authenticated student dashboard pages",
    "Visible focus rings and active state indicators on interactive elements",
    "Adherence to WCAG 2.2 Level AA color contrast ratios in both Dark and Light themes",
    "Full compliance with prefers-reduced-motion media queries, disabling intensive 3D/physics animations",
    "Semantic HTML landmark structures (header, nav, main, footer, section, article)",
    "Accessible Radix UI primitive foundations for modals, tooltips, dialogs, and tabs",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3 border-b border-border/40 pb-8">
            <Badge variant="cyan">Inclusive Design</Badge>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Accessibility Statement
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              WCAG 2.2 Level AA Conformance Commitment
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Our Commitment</h2>
              <p>
                Converza is dedicated to ensuring digital accessibility for students and job seekers of all abilities. We continually improve the user experience for everyone and apply relevant accessibility standards, striving to conform to the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">2. Implemented Accessibility Measures</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {standards.map((std, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-card border border-border/60 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-foreground/90">{std}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. Reduced-Motion & 3D WebGL Accommodations</h2>
              <p>
                For candidates who experience vestibular disorders or motion sensitivity, our application honors the <code>prefers-reduced-motion</code> system setting. When enabled, 3D Canvas scenes (such as the Hero Intelligence Core) are immediately substituted with static, non-distracting SVG and CSS ambient graphics.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. Feedback & Contact</h2>
              <p>
                We welcome your feedback on the accessibility of Converza. If you encounter accessibility barriers on any page, please contact our team at <code>accessibility@converza.platform</code>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
