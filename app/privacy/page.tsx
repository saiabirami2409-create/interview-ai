import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Privacy Policy — Converza",
  description:
    "Learn how Converza collects, stores, encrypts, and handles candidate resumes, interview transcripts, and performance data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="space-y-3 border-b border-border/40 pb-8">
            <Badge variant="cyan">Data Protection</Badge>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Privacy Policy & Resume Security
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              Last updated: October 2026 • Platform Version 1.0
            </p>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-sm text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">1. Overview & Commitment</h2>
              <p>
                At Converza, we recognize that mock interview preparation involves highly sensitive personal data, including employment history, educational records, capstone project architectures, and verbal performance evaluations. We operate with strict zero-knowledge principles regarding third-party model training and recruiter disclosures.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Account Information:</strong> Name, verified email address, hashed credentials, and optional demographic preferences (college, degree, target graduation year).
                </li>
                <li>
                  <strong>Candidate Documents:</strong> Uploaded resumes (PDF/DOCX) provided voluntarily to customize interview questions.
                </li>
                <li>
                  <strong>Interview Transcripts & Metrics:</strong> Typed responses, elapsed response times, rubric scores, and identified conceptual gaps.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">3. Processing of Resumes and Job Descriptions</h2>
              <p>
                When you upload a resume or paste a job description, the text is sanitized to neutralize prompt injection attacks and parsed in memory to extract skill taxonomies. Resumes are stored in encrypted partitions isolated strictly to your authenticated user account.
              </p>
              <div className="p-4 rounded-xl bg-card border border-border/60 text-foreground font-medium">
                Important: Candidate resume contents and interview answers are never sold, never disclosed to recruiters without explicit consent, and never used to train public LLMs.
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">4. Data Deletion and Portability</h2>
              <p>
                You retain complete sovereignty over your data. You may delete individual resumes, erase specific interview transcripts, or permanently delete your account and all associated metrics at any time directly through your dashboard settings. Upon deletion, files and database records are immediately purged.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">5. Contact Information</h2>
              <p>
                For privacy compliance inquiries or data subject access requests, contact our Data Protection Officer at <code>privacy@converza.platform</code>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
