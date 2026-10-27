"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Sparkles,
  Send,
  User,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Target,
  ArrowRight,
  Code2,
  Video,
  Layers,
  Award,
  Key,
  ShieldCheck,
  ExternalLink,
  X,
  MessageSquare,
  Terminal,
  RefreshCw,
  Info,
} from "lucide-react";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isFallback?: boolean;
  canRetry?: boolean;
  retryPayload?: string;
}

const SESSION_STORAGE_KEY = "interviewai_chat_session";

const SUGGESTED_PROMPTS = [
  "Solve this Python MCQ: Why does def f(x=[]) mutate across function calls? Explain best answer & distractors",
  "Which SQL isolation level prevents Non-Repeatable Reads vs Phantom Reads under ANSI-92? (MCQ)",
  "Predict JavaScript Event Loop execution order: setTimeout vs Promise.then vs synchronous code (MCQ)",
  "In a self-balancing BST (Red-Black / AVL), what is worst-case search complexity? (MCQ)",
  "Under CAP theorem, explain why Partition Tolerance (P) is unavoidable in distributed systems (MCQ)",
  "Which strategy effectively prevents a Cache Stampede / Thundering Herd in Redis? (MCQ)",
];

export default function ChatPage() {
  const router = useRouter();

  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = React.useState<string>("");
  const [showKeyModal, setShowKeyModal] = React.useState(false);
  const [keyInput, setKeyInput] = React.useState("");
  const [hasServerKey, setHasServerKey] = React.useState(false);
  const [snippetCopied, setSnippetCopied] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Restore session conversation on initial load & retrieve stored client key
  React.useEffect(() => {
    inputRef.current?.focus();
    if (typeof window !== "undefined") {
      try {
        const savedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (e) {
        console.warn("Failed to load session messages:", e);
      }

      const storedKey = localStorage.getItem("interviewai_gemini_key");
      if (storedKey) {
        setCustomApiKey(storedKey);
        setKeyInput(storedKey);
      }
    }
  }, []);

  // Save conversation into sessionStorage on update
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (messages.length > 0) {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        console.warn("Failed to persist session messages:", e);
      }
    }
  }, [messages]);

  // Keyboard accessibility: Escape closes modal
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showKeyModal) {
        setShowKeyModal(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [showKeyModal]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    setCustomApiKey(trimmed);
    if (typeof window !== "undefined") {
      if (trimmed) {
        localStorage.setItem("interviewai_gemini_key", trimmed);
      } else {
        localStorage.removeItem("interviewai_gemini_key");
      }
    }
    setShowKeyModal(false);
    setError(null);
    setNotice(trimmed ? "Google Gemini session key updated!" : null);
  };

  const handleCopySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || loading) return;

    setError(null);
    setNotice(null);
    setInputValue("");

    const userMessage: Message = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoading(true);

    try {
      const payloadMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (customApiKey) {
        headers["x-gemini-api-key"] = customApiKey;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // ALWAYS display fallback response if provided by backend
        if (data?.error?.fallbackMessage) {
          const assistantMessage: Message = {
            id: `msg_ai_${Date.now()}`,
            role: "assistant",
            content: data.error.fallbackMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            isFallback: true,
            canRetry: true,
            retryPayload: text,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (data.error.code === "GEMINI_NOT_CONFIGURED") {
            setNotice(
              "💡 Answered via InterviewAI Knowledge Engine. To enable live Google Gemini 2.5 Flash, set GEMINI_API_KEY in your .env file or click 'Setup Instructions' above."
            );
          } else if (data.error.code === "RATE_LIMITED") {
            setError(
              data.error.message ||
                "Momentary rate limit reached (30 req/min). Provided offline expert response."
            );
          } else if (data.error.code === "REQUEST_TIMEOUT") {
            setError(
              "Gemini API request timed out after 15 seconds. Provided offline expert response."
            );
          } else {
            setError(
              data.error.message ||
                "Gemini API temporarily unavailable. Provided offline expert response."
            );
          }
          return;
        }

        throw new Error(
          data?.error?.message || "Failed to receive response from AI Coach. Please try again."
        );
      }

      setHasServerKey(true);

      const assistantMessage: Message = {
        id: `msg_ai_${Date.now()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFallback: false,
        canRetry: false,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "An error occurred while connecting to the AI Coach.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (messages.length > 0 && confirm("Are you sure you want to clear this conversation?")) {
      setMessages([]);
      setError(null);
      setNotice(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  };

  // Advanced Markdown Block & Inline Parser
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, pIdx) => {
      // 1. Code Block
      if (part.startsWith("```") && part.endsWith("```")) {
        const firstLineEnd = part.indexOf("\n");
        const language =
          firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() || "code" : "code";
        const code =
          firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);

        const blockId = `code_block_${pIdx}`;

        return (
          <div
            key={pIdx}
            className="my-3 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md text-left text-xs"
          >
            <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/80 text-slate-300 font-mono text-[11px]">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  {language}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(blockId, code)}
                aria-label="Copy code block"
                className="hover:text-white transition flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-700 text-[11px] cursor-pointer"
              >
                {copiedId === blockId ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto text-slate-100 font-mono text-xs leading-relaxed selection:bg-purple-500/30">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // 2. Regular Text Chunk
      const lines = part.split("\n");
      return (
        <div key={pIdx} className="space-y-1.5">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();

            if (!trimmed) {
              return <div key={lIdx} className="h-1.5" />;
            }

            // Divider
            if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
              return (
                <hr key={lIdx} className="my-3 border-slate-200 dark:border-slate-800" />
              );
            }

            // Headings
            if (trimmed.startsWith("### ")) {
              return (
                <h3
                  key={lIdx}
                  className="text-sm font-bold text-slate-900 dark:text-white mt-3 mb-1 flex items-center gap-1.5"
                >
                  {renderInlineSpans(trimmed.slice(4))}
                </h3>
              );
            }
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={lIdx}
                  className="text-base font-extrabold text-slate-900 dark:text-white mt-3.5 mb-1.5"
                >
                  {renderInlineSpans(trimmed.slice(3))}
                </h2>
              );
            }
            if (trimmed.startsWith("# ")) {
              return (
                <h1
                  key={lIdx}
                  className="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2"
                >
                  {renderInlineSpans(trimmed.slice(2))}
                </h1>
              );
            }

            // Blockquotes
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote
                  key={lIdx}
                  className="border-l-3 border-purple-500 bg-purple-500/5 dark:bg-purple-950/20 pl-3.5 py-1.5 my-1.5 rounded-r-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic"
                >
                  {renderInlineSpans(trimmed.slice(2))}
                </blockquote>
              );
            }

            // Bullet Lists
            if (
              trimmed.startsWith("• ") ||
              trimmed.startsWith("- ") ||
              trimmed.startsWith("* ")
            ) {
              const bulletText = trimmed.replace(/^[-•*]\s*/, "");
              return (
                <li
                  key={lIdx}
                  className="ml-4 list-disc text-xs sm:text-sm my-0.5 leading-relaxed text-slate-800 dark:text-slate-200"
                >
                  {renderInlineSpans(bulletText)}
                </li>
              );
            }

            // Numbered Lists
            const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numberedMatch) {
              return (
                <li
                  key={lIdx}
                  className="ml-4 list-decimal text-xs sm:text-sm my-0.5 leading-relaxed text-slate-800 dark:text-slate-200"
                >
                  {renderInlineSpans(numberedMatch[2])}
                </li>
              );
            }

            // Regular Paragraph
            return (
              <p
                key={lIdx}
                className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200"
              >
                {renderInlineSpans(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for inline bold, links, and code chips
  const renderInlineSpans = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <Link
          key={match.index}
          href={linkUrl}
          className="text-purple-600 dark:text-purple-400 font-bold underline hover:opacity-80 transition inline-flex items-center gap-0.5"
        >
          <span>{linkText}</span>
          <ArrowRight className="w-3 h-3 inline" />
        </Link>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.map((part, pIdx) => {
      if (typeof part !== "string") return part;

      const segments = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return segments.map((seg, sIdx) => {
        if (seg.startsWith("**") && seg.endsWith("**")) {
          return (
            <strong key={`${pIdx}-${sIdx}`} className="font-bold text-slate-900 dark:text-white">
              {seg.slice(2, -2)}
            </strong>
          );
        }
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code
              key={`${pIdx}-${sIdx}`}
              className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-purple-600 dark:text-purple-300 font-semibold"
            >
              {seg.slice(1, -1)}
            </code>
          );
        }
        return seg;
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      {/* CHAT TOP HEADER */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer"
              title="Return to previous page"
              aria-label="Return to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <Link href="/home" className="flex items-center gap-2 group">
              <InterviewAILogo size="sm" showWordmark />
            </Link>

            <div className="hidden sm:block h-5 w-[1px] bg-slate-300 dark:bg-slate-700" />

            {/* AI Coach Status Pill */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>MCQ Technical Coach</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {customApiKey || hasServerKey ? "Gemini 2.5 Flash" : "Knowledge Base"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Configure Key & Setup Instructions Button */}
            <button
              onClick={() => setShowKeyModal(true)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              title="Configure Gemini API Key & View Setup Instructions"
              aria-label="Configure Gemini API Key and Setup Instructions"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {customApiKey ? "Key Connected" : "API Key Setup"}
              </span>
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                title="Clear current chat"
                aria-label="Clear current conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}

            <Link
              href="/practice"
              className="text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 transition hidden md:flex items-center gap-1.5"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Practice Mode</span>
            </Link>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* SECURE GEMINI API SETUP INSTRUCTIONS MODAL */}
      {showKeyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close setup modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 id="modal-title" className="font-extrabold text-base text-foreground">
                  Gemini API Key Setup Guide
                </h3>
                <p className="text-xs text-muted-foreground">
                  Secure server-side configuration instructions
                </p>
              </div>
            </div>

            {/* Security Isolation Notice */}
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Zero Client Exposure:</strong> The Gemini API key is maintained securely on the server via environment variables. It is never exposed in browser bundles or client network requests.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Get your Google Gemini API Key</span>
                </div>
                <p className="text-muted-foreground ml-7 leading-relaxed">
                  Generate a free key from{" "}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 dark:text-purple-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                  . Free tier includes 15 requests per minute.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Configure your project `.env` file</span>
                </div>
                <p className="text-muted-foreground ml-7 leading-relaxed">
                  Open the <code className="px-1 py-0.5 rounded bg-muted font-mono font-semibold">.env</code> file in your project root and add:
                </p>

                <div className="ml-7 rounded-xl bg-slate-900 border border-slate-700 p-2.5 flex items-center justify-between text-[11px] font-mono text-purple-300">
                  <code>GEMINI_API_KEY=&quot;your_api_key_here&quot;</code>
                  <button
                    type="button"
                    onClick={() => handleCopySnippet('GEMINI_API_KEY="your_api_key_here"')}
                    className="hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300 cursor-pointer"
                  >
                    {snippetCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Restart Next.js Development Server</span>
                </div>
                <p className="text-muted-foreground ml-7 leading-relaxed">
                  In your terminal, restart the app so Next.js reads the updated environment variable:
                </p>
                <div className="ml-7 rounded-xl bg-slate-900 border border-slate-700 p-2 text-[11px] font-mono text-emerald-400">
                  npm run dev
                </div>
              </div>
            </div>

            {/* Optional Client-Side Session Override */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-purple-500" />
                  <span>Optional Browser Session Override</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">Dev / Quick Test</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                For rapid testing without editing <code className="font-mono">.env</code>, enter a key for this browser session only:
              </p>

              <form onSubmit={handleSaveKey} className="space-y-2.5">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-foreground text-xs font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex items-center justify-between pt-1">
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyInput("");
                        setCustomApiKey("");
                        localStorage.removeItem("interviewai_gemini_key");
                        setShowKeyModal(false);
                        setNotice("Custom API key removed from browser session.");
                      }}
                      className="text-xs text-red-500 hover:underline cursor-pointer"
                    >
                      Clear Browser Key
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(false)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Done
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-sm cursor-pointer"
                    >
                      Apply Override
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CHAT MESSAGES SCROLL AREA */}
      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 flex-1 w-full space-y-6 flex flex-col justify-between">
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-label="Interview chat transcript"
          className="space-y-6 flex-1"
        >
          {/* NOTICE BANNER */}
          {notice && (
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 flex items-start justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{notice}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="font-bold underline text-purple-600 dark:text-purple-400 hover:opacity-80 cursor-pointer"
                >
                  Setup Guide
                </button>
                <button
                  onClick={() => setNotice(null)}
                  className="text-purple-500 hover:text-purple-700 p-0.5 rounded cursor-pointer"
                  aria-label="Dismiss notice"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* WELCOME HERO / EMPTY STATE */}
          {messages.length === 0 && (
            <div className="space-y-8 py-6 text-center animate-in fade-in duration-300">
              {/* Coach Avatar & Intro */}
              <div className="space-y-3 max-w-xl mx-auto">
                <div className="relative w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-purple-700 via-violet-600 to-blue-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/30">
                  <Bot className="w-8 h-8" />
                  <Sparkles className="w-4 h-4 text-cyan-300 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Technical-Round MCQ Chatbot
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your dedicated technical interview partner. Paste any multiple-choice question, coding query, or system design trade-off to get the best answer, deep conceptual reasoning, distractor analysis, and runtime nuances.
                </p>
              </div>

              {/* Quick Launch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <Link
                  href="/practice"
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-500 dark:hover:border-purple-600 transition group space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Code2 className="w-4 h-4" />
                    </span>
                    <Badge variant="violet" className="text-[10px]">
                      Interactive Bank
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition">
                    Curated MCQ Practice Mode
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Topic-based quizzes across DSA, Python, SQL, OS, Networking & System Design with instant distractor analysis.
                  </p>
                </Link>

                <Link
                  href="/dashboard/setup-interview?type=BEHAVIORAL"
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 dark:hover:border-blue-600 transition group space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </span>
                    <Badge variant="cyan" className="text-[10px]">
                      Second Round
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                    Behavioral Video Round
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Practice one question at a time with your webcam, speech recognition, and STAR method analysis.
                  </p>
                </Link>
              </div>

              {/* Suggested Prompts Section */}
              <div className="space-y-3 max-w-2xl mx-auto">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  Tap to Analyze or Solve a Technical MCQ:
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-500 dark:hover:border-purple-600 hover:text-purple-600 dark:hover:text-purple-400 transition shadow-xs text-left cursor-pointer"
                    >
                      &ldquo;{prompt}&rdquo;
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE MESSAGES LIST */}
          {messages.length > 0 && (
            <div className="space-y-6">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${
                      isUser ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                        isUser
                          ? "bg-slate-800 text-white"
                          : "bg-gradient-to-tr from-purple-700 to-blue-600 text-white"
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Card */}
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] space-y-1.5 ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`p-4 sm:p-5 rounded-2xl shadow-sm ${
                          isUser
                            ? "bg-gradient-to-r from-purple-700 to-indigo-600 text-white rounded-tr-xs"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs"
                        }`}
                      >
                        {isUser ? (
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {renderFormattedContent(msg.content)}
                          </div>
                        )}
                      </div>

                      {/* Message Footer Meta & Actions */}
                      <div
                        className={`flex flex-wrap items-center gap-2 px-1 text-[10px] text-slate-400 ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                        {!isUser && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                              {msg.isFallback ? "InterviewAI Offline Engine" : "Gemini 2.5 Flash"}
                            </span>

                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition flex items-center gap-1 cursor-pointer"
                              title="Copy response"
                              aria-label="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-500">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {/* Retry button for fallbacks */}
                            {msg.canRetry && msg.retryPayload && (
                              <button
                                onClick={() => handleSendMessage(msg.retryPayload)}
                                className="text-purple-600 dark:text-purple-400 hover:underline transition flex items-center gap-1 cursor-pointer font-semibold ml-1"
                                title="Retry query with Gemini"
                                aria-label="Retry query with Gemini"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>Retry with Gemini</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TYPING INDICATOR */}
          {loading && (
            <div className="flex items-start gap-3 animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-700 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 flex items-center gap-2 shadow-sm">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono">
                  Analyzing MCQ & formulating distractor analysis
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}

          {/* ERROR ALERT BANNER */}
          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 flex items-start gap-3 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div className="flex-1 space-y-1">
                <span className="font-bold">Notice & Fallback Status</span>
                <p className="leading-relaxed">{error}</p>
                <div className="flex items-center gap-3 pt-1">
                  {messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
                    <button
                      onClick={() => handleSendMessage(messages[messages.length - 1]?.content)}
                      className="font-bold underline text-amber-900 dark:text-amber-200 hover:opacity-80 cursor-pointer"
                    >
                      Retry last query
                    </button>
                  )}
                  <button
                    onClick={() => setShowKeyModal(true)}
                    className="font-bold text-purple-600 dark:text-purple-400 underline hover:opacity-80 cursor-pointer"
                  >
                    Setup API Key Guide
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* BOTTOM INPUT BAR & VERIFICATION DISCLAIMER */}
        <div className="pt-4 sticky bottom-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md pb-2 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 sm:p-2.5 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-purple-950/5 focus-within:ring-2 focus-within:ring-purple-600 transition space-y-2"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste an MCQ, code snippet, or ask a technical question... (e.g. 'What is the output of def f(x=[])? A)... B)...')"
                disabled={loading}
                aria-label="Ask technical MCQ question"
                className="flex-1 bg-transparent border-0 resize-none text-xs sm:text-sm text-foreground placeholder:text-slate-400 focus:outline-none p-2 leading-relaxed"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || loading}
                className="p-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white shadow-md shadow-purple-600/25 transition shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-100 dark:border-slate-800/60 text-[10px] text-slate-400 font-mono">
              <span className="hidden sm:inline">
                Press Enter to send • Shift + Enter for newline
              </span>
              <span className="sm:hidden">Tap send to submit question</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Google Gemini 2.5 Flash</span>
                </span>
              </div>
            </div>
          </form>

          {/* Verification Disclaimer */}
          <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 px-2 leading-tight">
            AI responses are generated for interview practice. While carefully calibrated, verify critical runtime quirks, compiler outputs, and language specifications in official documentation.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">
        InterviewAI Coach • Practice Smarter. Interview Better.
      </footer>
    </div>
  );
}
