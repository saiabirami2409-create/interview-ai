"use client";

import * as React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, MapPin, CheckCircle2, Bot } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
        <section className="py-16 md:py-24 border-b border-border/40 bg-card/20 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative">
            <Badge variant="violet">Direct Support</Badge>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
              Get in Touch with Converza
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Have questions about platform integration, institutional placement partnerships, or technical feedback? We’re here to help.
            </p>
          </div>
        </section>

        {/* Contact Form & Info Grid */}
        <section className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Direct Info */}
              <div className="lg:col-span-5 space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">We’re Here to Help</h2>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Whether you are an individual student preparing for upcoming recruitment loops or a university placement cell seeking bulk preparation tools, send us a message.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/60">
                    <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Email Support</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">support@converza.platform</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">Typical response within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/60">
                    <MessageSquare className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Placement Partnerships</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">partners@converza.platform</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">For colleges, universities, and bootcamps</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-card/50 border border-border/60">
                    <MapPin className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Headquarters</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Tech Corridor, Bangalore & San Francisco</p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">Global remote engineering team</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="lg:col-span-7">
                <div className="rounded-3xl border border-border/60 bg-card/60 p-8 shadow-xl">
                  {submitted ? (
                    <div className="text-center py-12 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">Message Received</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Thank you for reaching out, <strong>{formData.name}</strong>. Our student success team will respond to <strong>{formData.email}</strong> shortly.
                      </p>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSubmitted(false);
                            setFormData({ name: "", email: "", subject: "", message: "" });
                          }}
                        >
                          Send Another Message
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <h3 className="text-xl font-bold text-foreground mb-4">Send a Direct Message</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Your Name *</label>
                          <Input
                            required
                            placeholder="Aarya Kumar"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Your Email *</label>
                          <Input
                            required
                            type="email"
                            placeholder="aarya@college.edu"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Subject *</label>
                        <Input
                          required
                          placeholder="Feedback, Placement Query, or Account Assistance"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">Message *</label>
                        <Textarea
                          required
                          rows={5}
                          placeholder="Tell us about your campus drive timelines or how we can help..."
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        />
                      </div>

                      <div className="pt-2">
                        <Button type="submit" size="lg" className="w-full">
                          Send Message
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
