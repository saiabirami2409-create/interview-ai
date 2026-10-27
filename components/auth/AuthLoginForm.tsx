"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle2,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Bot,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InterviewAILogo } from "@/components/ui/logo";

export function AuthLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [existingUser, setExistingUser] = React.useState<any | null>(null);

  // Check if redirected from registration
  React.useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Account created successfully! Please sign in with your credentials.");
    }
  }, [searchParams]);

  // Check if session exists for convenience banner, but DO NOT auto-redirect away from login page
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        const u = data.user || data.data?.user;
        if (u) {
          setExistingUser(u);
        }
      })
      .catch(() => {});
  }, []);

  const handleFillDemo = () => {
    setEmail("aarya.kumar@example.com");
    setPassword("Password123!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg =
          typeof data.error === "object" && data.error !== null
            ? data.error.message
            : data.error || data.message || "Invalid credentials. Please verify your email and password.";
        throw new Error(errorMsg);
      }

      // Successful login: redirect to the existing InterviewAI landing page (/home)
      router.push("/home");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Sign in failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#fbfaff] via-[#f4f1fd] to-[#eae6fc] dark:from-[#080914] dark:via-[#100d24] dark:to-[#0a0818] relative overflow-hidden transition-colors">
      {/* Top Bar with Home Link, AI Chatbot Link & Theme Toggle */}
      <div className="absolute top-5 left-5 z-20">
        <Link
          href="/home"
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/40 border border-border/40 backdrop-blur-md"
        >
          <span>Explore Platform Overview →</span>
        </Link>
      </div>

      <div className="absolute top-5 right-5 z-20 flex items-center gap-2.5">
        <Link
          href="/chat"
          className="text-xs font-semibold text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 backdrop-blur-md shadow-xs"
        >
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span>AI Coach Chatbot</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Ambient glowing radial effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-gradient-to-tr from-violet-500/20 via-indigo-500/15 to-cyan-400/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 my-8">
        {/* Brand Logo Header */}
        <div className="mb-6 text-center">
          <Link href="/home" className="inline-block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
            <InterviewAILogo size="lg" showWordmark subtitle="Practice Smarter. Interview Better." />
          </Link>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="w-full rounded-3xl bg-white/85 dark:bg-card/85 border border-purple-200/60 dark:border-purple-500/20 p-8 sm:p-10 shadow-[0_20px_60px_-15px_rgba(124,58,237,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl relative">
          {/* Header Typography matching Section 6 Requirements */}
          <div className="space-y-1.5 text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Welcome to InterviewAI
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Your journey to interview excellence starts here. Sign in to your account.
            </p>
          </div>

          {/* Active Session Status Notification */}
          {existingUser && (
            <div className="mb-5 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-foreground">
                  Logged in as <strong>{existingUser.name || existingUser.email}</strong>
                </span>
              </div>
              <Link
                href="/home"
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                Go to Home →
              </Link>
            </div>
          )}

          {/* Quick 1-Click Demo Account for Evaluation */}
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-cyan-500/10 border border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-foreground">Demo Testing Profile</p>
                <p className="text-[10px] text-muted-foreground font-mono">Pre-seeded evaluation candidate</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-card border border-violet-300 dark:border-violet-600/40 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors shadow-sm cursor-pointer"
            >
              Fill Demo
            </button>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="login-email" className="text-xs font-medium text-foreground block">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu or candidate@work.com"
                  autoComplete="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-medium text-foreground block">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-muted/40 border border-border/80 text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center text-left pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary focus:ring-offset-0 bg-muted/40 cursor-pointer"
                />
                <span>Remember Me on this device</span>
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 hover:brightness-110 shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Signing in to InterviewAI...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/60" />
            </div>
            <span className="relative px-3 bg-white dark:bg-card text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              New to InterviewAI?
            </span>
          </div>

          {/* Create Account Option */}
          <Link
            href="/register"
            className="w-full py-2.5 px-4 rounded-xl border border-border/80 hover:bg-muted/40 text-foreground font-semibold text-sm transition-colors flex items-center justify-center gap-2 block text-center"
          >
            <span>Create a Free Student Account</span>
          </Link>
        </div>

        {/* Security & Confidentiality Trust Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/80 font-mono text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Encrypted Session • Database-Backed Authentication</span>
        </div>
      </div>
    </div>
  );
}
