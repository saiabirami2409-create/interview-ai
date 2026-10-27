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
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Code2,
  Briefcase,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterviewAILogo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isError?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello! I'm your AI Interview Assistant. I can help you prepare for technical, behavioral, and HR interviews. What would you like to know?",
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
};

const SUGGESTED_PROMPTS = [
  {
    category: "Technical",
    prompt: "What is polymorphism in Java? Explain runtime vs compile-time with code.",
  },
  {
    category: "Technical",
    prompt: "Explain Python dictionaries internal implementation, hash collisions, and Big-O.",
  },
  {
    category: "Behavioral",
    prompt: "What is the STAR method? How do I structure an answer for a time I resolved team conflict?",
  },
  {
    category: "HR Round",
    prompt: "How should I introduce myself in an HR interview for a Software Engineer role?",
  },
  {
    category: "Strategy",
    prompt: "How can I improve my technical MCQ accuracy and avoid negative marking traps?",
  },
  {
    category: "HR Round",
    prompt: "How should I answer 'What is your greatest weakness?' without hurting my chances?",
  },
];

export default function ChatbotPage() {
  const router = useRouter();
  const [messages, setMessages] = React.useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string>("Student");
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load session & previous history if available
  React.useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.name) {
          setUserName(data.user.name.split(" ")[0]);
        }
      })
      .catch(() => {});

    // Fetch conversation history from backend
    fetch("/api/chatbot/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          const loaded: Message[] = data.messages.map((m: any) => ({
            id: m.id || Math.random().toString(),
            role: m.sender === "USER" ? "user" : "assistant",
            content: m.message,
            timestamp: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }));
          setMessages([WELCOME_MESSAGE, ...loaded]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: "u-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch AI response");
      }

      const aiReply: Message = {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply || "I couldn't process your request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      const errorReply: Message = {
        id: "err-" + Date.now(),
        role: "assistant",
        content:
          "⚠️ " +
          (err.message || "Failed to connect to the AI service. Please verify your connection or try again."),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (confirm("Clear your current conversation history?")) {
      try {
        await fetch("/api/chatbot/history", { method: "DELETE" });
      } catch {}
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const handleNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="h-16 px-4 md:px-8 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight">InterviewAI Assistant</h1>
                <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                  Gemini Powered
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Technical, Behavioral, and HR Preparation Copilot</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewChat}
            className="text-xs h-8 gap-1.5 hidden sm:flex"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Quick Prompt Shortcuts & Guide (desktop) */}
        <aside className="w-80 border-r border-border/50 bg-card/20 p-4 hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Suggested Prompts
              </h3>
              <p className="text-xs text-muted-foreground">
                Click any topic to get instant expert guidance.
              </p>
            </div>

            <div className="space-y-2">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-xl border border-border/60 bg-card/60 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-xs group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-foreground/90 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Round Links */}
          <div className="p-3.5 rounded-2xl border border-border/60 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 space-y-2 mt-4">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Practice All 3 Rounds
            </h4>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <Link
                href="/technical/setup"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>1. Technical MCQs</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/behavioral/setup"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>2. Behavioral (STAR)</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
              <Link
                href="/hr/setup"
                className="flex items-center justify-between p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>3. HR Interview</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Center: Conversation Stream */}
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
          <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-5">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 md:gap-4 max-w-4xl mx-auto ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`group relative rounded-2xl px-4 py-3.5 max-w-[85%] md:max-w-[75%] text-sm leading-relaxed shadow-sm ${
                      isAssistant
                        ? msg.isError
                          ? "bg-destructive/10 border border-destructive/30 text-destructive"
                          : "bg-card border border-border/70 text-foreground"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-600/10"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans break-words text-[13.5px] leading-relaxed">
                      {msg.content}
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-border/20 text-[10px] text-muted-foreground">
                      <span>{msg.timestamp}</span>
                      {isAssistant && !msg.isError && (
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground flex items-center gap-1"
                          title="Copy reply"
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
                      )}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      {userName.charAt(0)}
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 md:gap-4 max-w-4xl mx-auto justify-start">
                <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="rounded-2xl px-4 py-3 bg-card border border-border/70 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-muted-foreground ml-2">InterviewAI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-4 md:px-8 border-t border-border/60 bg-card/40 backdrop-blur-md">
            <div className="max-w-4xl mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center gap-2 bg-background border border-border/80 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 rounded-2xl p-2 transition-all shadow-sm"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a technical question, STAR example, or HR interview tip... (Press Enter to send)"
                  rows={1}
                  className="flex-1 bg-transparent resize-none border-none outline-none px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 min-h-[40px] max-h-32"
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={loading || !input.trim()}
                  className="rounded-xl px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-500/20 shrink-0 h-9"
                >
                  <Send className="w-4 h-4 mr-1.5" />
                  <span>Send</span>
                </Button>
              </form>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2 pt-2">
                <span>Supported: Java, Python, SQL, React, DSA, STAR Method, HR Pitches</span>
                <span>Press Shift + Enter for new line</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
