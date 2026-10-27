"use client";

import * as React from "react";
import {
  Bot,
  X,
  Minus,
  Send,
  Sparkles,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  MessageSquare,
  HelpCircle,
  Loader2,
  Mic,
  MicOff,
  History,
  Plus,
  ArrowDown,
  Square,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatMessageContent } from "./ChatMessageContent";
import { useActiveInterview } from "@/context/ActiveInterviewContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  detectedAnswer?: string;
  suggestedFollowUps?: string[];
  isFallback?: boolean;
  isError?: boolean;
  sources?: Array<{ title: string; url: string }>;
  searchQueries?: string[];
  groundingUsed?: boolean;
  createdAt?: string | Date;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

interface ChatbotStatus {
  isOnline: boolean;
  hasApiKey: boolean;
  model: string;
  provider: string;
  statusText: string;
}

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `### Hello! I'm InterviewAI Assistant 👋

I'm your intelligent interview preparation coach and mentor. I'm here to help you crack your technical, behavioral, and HR interview rounds with confidence.

---

**How I can help you today:**
- 💻 **Technical Concepts**: Explain DSA, System Design, SQL indexing, ACID properties, and language mechanics (Python, Java, C++, JS).
- 🎯 **MCQ Explanations**: Break down tricky technical questions and why specific choices are right or wrong.
- 🌟 **Behavioral Interviews**: Structure high-scoring responses using the **STAR Method** (Situation, Task, Action, Result).
- 👔 **HR Rounds**: Polish your "Tell me about yourself" pitch, salary negotiation, and strengths/weaknesses answers.

*Select a quick topic below or type your question to get started!*`,
  suggestedFollowUps: [
    "Explain the STAR Method for behavioral interviews",
    "How should I answer 'Tell me about yourself' in an HR round?",
    "Explain polymorphism in Java with an example",
    "What are ACID properties and B-Tree indexes?",
  ],
};

const SUGGESTED_STARTER_CHIPS = [
  "Explain STAR method for behavioral rounds",
  "How to introduce myself in HR interview?",
  "Java Polymorphism & method overriding",
  "Python dictionary lookup complexity",
  "Operating Systems: 4 deadlock conditions",
  "Explain B-Tree indexes & ACID properties",
];

const FAB_SIZE_DESKTOP = 60;
const FAB_SIZE_MOBILE = 52;
const STORAGE_KEY = "interviewai_chatbot_position";

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Active Interview context (syncs with active round & question)
  const { activeQuestion, submitAnswerFromChatbot } = useActiveInterview();

  // Status & Auth state
  const [status, setStatus] = React.useState<ChatbotStatus>({
    isOnline: false,
    hasApiKey: false,
    model: "offline-coach",
    provider: "InterviewAI Offline Coach",
    statusText: "Checking status...",
  });
  const [isGuest, setIsGuest] = React.useState(false);

  // Conversation Threads Drawer
  const [showDrawer, setShowDrawer] = React.useState(false);
  const [conversations, setConversations] = React.useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = React.useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = React.useState(false);

  // Drag and drop state
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, initX: 0, initY: 0, hasMoved: false });

  // Web Speech API
  const [isListening, setIsListening] = React.useState(false);
  const [speechSupported, setSpeechSupported] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  // Auto-scroll and scroll-to-bottom button
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Initialize Position & Resize Listeners
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const clampPosition = (x: number, y: number) => {
      const isMobile = window.innerWidth < 640;
      const size = isMobile ? FAB_SIZE_MOBILE : FAB_SIZE_DESKTOP;
      const padding = 16;
      const minX = padding;
      const maxX = Math.max(padding, window.innerWidth - size - padding);
      const minY = padding;
      const maxY = Math.max(padding, window.innerHeight - size - padding);
      return {
        x: Math.min(Math.max(x, minX), maxX),
        y: Math.min(Math.max(y, minY), maxY),
      };
    };

    // Try reading from localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPos(clampPosition(parsed.x, parsed.y));
          return;
        }
      }
    } catch {
      // ignore JSON or localStorage error
    }

    // Default: bottom-right corner
    const isMobile = window.innerWidth < 640;
    const size = isMobile ? FAB_SIZE_MOBILE : FAB_SIZE_DESKTOP;
    const defaultX = window.innerWidth - size - 24;
    const defaultY = window.innerHeight - size - 24;
    setPos(clampPosition(defaultX, defaultY));

    const handleResize = () => {
      setPos((prev) => clampPosition(prev.x, prev.y));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Status on Mount
  React.useEffect(() => {
    fetch("/api/chatbot/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus({
            isOnline: data.isOnline,
            hasApiKey: data.hasApiKey,
            model: data.model,
            provider: data.provider,
            statusText: data.statusText,
          });
        }
      })
      .catch(() => {
        setStatus({
          isOnline: false,
          hasApiKey: false,
          model: "offline-coach",
          provider: "InterviewAI Offline Coach",
          statusText: "Offline Coach Mode",
        });
      });
  }, []);

  // Initialize Speech Recognition
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Fetch User Conversations
  const fetchConversations = React.useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch("/api/chatbot/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        setIsGuest(Boolean(data.isGuest));
      }
    } catch (err) {
      console.warn("Failed to fetch conversations:", err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Load Active Conversation
  const loadConversation = async (convId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chatbot/conversations/${convId}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setActiveConversationId(convId);
        setMessages([
          DEFAULT_WELCOME_MESSAGE,
          ...data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        ]);
        setShowDrawer(false);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Check scroll position for scroll-to-bottom button
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
    setShowScrollBottom(isUp);
  };

  React.useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Load conversations when drawer opens or on first window open
  React.useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen, fetchConversations]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only drag on primary mouse button (0) or touch
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: pos.x,
      initY: pos.y,
      hasMoved: false,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    // Movement threshold check (6px)
    if (!dragRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 6) {
      dragRef.current.hasMoved = true;
    }

    if (dragRef.current.hasMoved) {
      const isMobile = window.innerWidth < 640;
      const size = isMobile ? FAB_SIZE_MOBILE : FAB_SIZE_DESKTOP;
      const padding = 16;
      const minX = padding;
      const maxX = Math.max(padding, window.innerWidth - size - padding);
      const minY = padding;
      const maxY = Math.max(padding, window.innerHeight - size - padding);

      const nextX = Math.min(Math.max(dragRef.current.initX + deltaX, minX), maxX);
      const nextY = Math.min(Math.max(dragRef.current.initY + deltaY, minY), maxY);

      setPos({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    setIsDragging(false);

    if (!dragRef.current.hasMoved) {
      // It was a click!
      if (isMinimized) {
        setIsMinimized(false);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else {
      // It was a drag: save new position
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
      } catch {
        // ignore
      }
    }
  };

  // Toggle Speech Recognition
  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  // Send Message Handler
  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: textToSend,
          conversationId: activeConversationId || undefined,
          activeInterviewQuestion: activeQuestion
            ? {
                roundNumber: activeQuestion.roundNumber,
                roundName: activeQuestion.roundName,
                questionId: activeQuestion.questionId,
                questionText: activeQuestion.questionText,
                category: activeQuestion.category,
                options: activeQuestion.options,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        // If the AI classified this as an explicit interview answer, submit it to active round
        if (data.intent === "ANSWER_INTERVIEW_QUESTION") {
          const ansToSubmit = data.detectedAnswer || textToSend;
          try {
            await submitAnswerFromChatbot(ansToSubmit);
          } catch (submitErr) {
            console.warn("Could not auto-submit answer to active interview:", submitErr);
          }
        }

        const assistantMsg: Message = {
          id: data.messageId || `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          intent: data.intent,
          detectedAnswer: data.detectedAnswer,
          suggestedFollowUps: data.suggestedFollowUps || [],
          isFallback: data.isFallback,
          sources: data.sources || [],
          searchQueries: data.searchQueries || [],
          groundingUsed: Boolean(data.groundingUsed),
          createdAt: new Date(),
        };

        if (data.conversationId && !activeConversationId) {
          setActiveConversationId(data.conversationId);
          fetchConversations();
        }

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              data.error ||
              "Unable to generate a response. Please check your connection or try again.",
            isError: true,
          },
        ]);
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            id: `aborted-${Date.now()}`,
            role: "assistant",
            content: "*Response generation was stopped.*",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "Network error: Unable to reach the interview assistant service. Please verify your connection and try again.",
            isError: true,
          },
        ]);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Start New Chat Thread
  const handleNewChat = async () => {
    setActiveConversationId(null);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setShowDrawer(false);
    if (!isGuest) {
      try {
        const res = await fetch("/api/chatbot/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New Conversation" }),
        });
        const data = await res.json();
        if (data.success && data.conversation) {
          setActiveConversationId(data.conversation.id);
          fetchConversations();
        }
      } catch (err) {
        console.warn("Could not create empty conversation thread:", err);
      }
    }
  };

  // Clear Current Conversation Messages
  const handleClearChat = async () => {
    if (!confirm("Clear all messages in the current conversation?")) return;
    if (activeConversationId) {
      try {
        await fetch(`/api/chatbot/conversations/${activeConversationId}/clear`, {
          method: "POST",
        });
      } catch (err) {
        console.warn("Could not clear messages on server:", err);
      }
    } else {
      try {
        await fetch("/api/chatbot/history", { method: "DELETE" });
      } catch {
        // ignore
      }
    }
    setMessages([DEFAULT_WELCOME_MESSAGE]);
  };

  // Delete Conversation Thread
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation thread permanently?")) return;
    try {
      await fetch(`/api/chatbot/conversations/${convId}`, { method: "DELETE" });
      if (activeConversationId === convId) {
        handleNewChat();
      }
      fetchConversations();
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  // Regenerate Response
  const handleRegenerate = () => {
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIndex !== -1) {
      const userMsg = [...messages].reverse()[lastUserIndex];
      // remove trailing assistant message
      setMessages((prev) => prev.slice(0, prev.length - 1));
      handleSend(userMsg.content);
    }
  };

  // Copy Message Text
  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // Calculate Chat Panel Position relative to FAB
  const chatWindowStyle = React.useMemo(() => {
    if (typeof window === "undefined" || pos.x < 0) return {};

    const isMobile = window.innerWidth < 640;
    if (isMobile) {
      return {
        bottom: 12,
        left: 12,
        right: 12,
        top: 12,
      };
    }

    const panelWidth = 420;
    const panelHeight = 600;
    const margin = 16;

    // Prefer placing the panel on whichever side has more room
    let left = pos.x + FAB_SIZE_DESKTOP - panelWidth;
    if (left < margin) {
      left = pos.x;
    }
    if (left + panelWidth > window.innerWidth - margin) {
      left = window.innerWidth - panelWidth - margin;
    }
    if (left < margin) left = margin;

    let top = pos.y - panelHeight - 12;
    if (top < margin) {
      // place below FAB if not enough room above
      top = pos.y + FAB_SIZE_DESKTOP + 12;
    }
    if (top + panelHeight > window.innerHeight - margin) {
      top = window.innerHeight - panelHeight - margin;
    }
    if (top < margin) top = margin;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${panelWidth}px`,
      height: `${panelHeight}px`,
    };
  }, [pos]);

  if (pos.x < 0) return null; // Wait for client-side mount

  return (
    <>
      {/* =========================================================================
          DRAGGABLE FLOATING ACTION BUTTON (FAB)
      ========================================================================= */}
      <div
        style={{
          position: "fixed",
          left: pos.x >= 0 ? `${pos.x}px` : "auto",
          top: pos.y >= 0 ? `${pos.y}px` : "auto",
          right: pos.x >= 0 ? "auto" : "24px",
          bottom: pos.y >= 0 ? "auto" : "24px",
          zIndex: 9999,
          touchAction: "none",
        }}
        className="print:hidden select-none"
      >
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          aria-label="InterviewAI Assistant Chatbot"
          title="InterviewAI Assistant (Drag to move, click to chat)"
          className={`group relative flex items-center justify-center rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-2xl transition-transform cursor-grab active:cursor-grabbing border-2 border-white/25 backdrop-blur-lg hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 ${
            isDragging ? "ring-4 ring-cyan-400/50 scale-105" : ""
          }`}
          style={{
            width: `${FAB_SIZE_DESKTOP}px`,
            height: `${FAB_SIZE_DESKTOP}px`,
          }}
        >
          {/* Glowing Animated Ambient Ring */}
          <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-400 opacity-40 blur-md group-hover:opacity-80 transition-opacity animate-pulse pointer-events-none" />

          {/* White Assistant Icon */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md transition-transform group-hover:rotate-6" />
          </div>

          {/* Active Status Dot */}
          <span
            className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-neutral-900 pointer-events-none ${
              status.isOnline ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400"
            }`}
            title={status.statusText}
          />
        </button>
      </div>

      {/* =========================================================================
          CHATBOT WINDOW PANEL
      ========================================================================= */}
      {isOpen && !isMinimized && (
        <div
          style={chatWindowStyle}
          className="fixed z-[9998] print:hidden rounded-3xl bg-card/95 border border-border/80 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header Bar */}
          <div className="p-3.5 bg-gradient-to-r from-violet-600/15 via-indigo-600/15 to-cyan-500/10 border-b border-border/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 text-white flex items-center justify-center shadow-md shrink-0">
                <Bot className="w-5 h-5 drop-shadow" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    InterviewAI Assistant
                  </h3>
                  <Badge variant="cyan" className="text-[9px] py-0 px-1 font-mono shrink-0">
                    AI Mentor
                  </Badge>
                </div>
                {/* Verified Real Online Status Indicator */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      status.isOnline
                        ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"
                        : "bg-amber-400"
                    }`}
                  />
                  <span className="truncate" title={status.statusText}>
                    {status.isOnline ? "Online • Gemini 2.5 Flash" : "Offline Coach Mode"}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              {/* History / Conversations Drawer Button */}
              <button
                type="button"
                onClick={() => {
                  setShowDrawer((prev) => !prev);
                  if (!showDrawer) fetchConversations();
                }}
                className={`p-1.5 rounded-lg transition-colors ${
                  showDrawer
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-muted/70 hover:text-foreground"
                }`}
                title="Conversation History"
              >
                <History className="w-4 h-4" />
              </button>

              {/* New Chat Button */}
              <button
                type="button"
                onClick={handleNewChat}
                className="p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-colors"
                title="Start New Chat"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Clear Messages in Current Chat */}
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-muted/70 hover:text-destructive transition-colors"
                title="Clear Current Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Minimize Button */}
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-colors"
                title="Minimize Window"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/70 hover:text-foreground transition-colors"
                title="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Interview Question Context Banner */}
          {activeQuestion && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-cyan-500/10 border-b border-border/60 flex items-center justify-between text-[11px] shrink-0">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <div className="min-w-0">
                  <span className="font-semibold text-foreground truncate block">
                    Round {activeQuestion.roundNumber}: {activeQuestion.roundName}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    handleSend(
                      "Can you clarify the pending question without giving away the answer?"
                    )
                  }
                  className="px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-medium border border-primary/20 transition-colors"
                  title="Ask assistant to clarify what this question is testing"
                >
                  Clarify Question
                </button>
              </div>
            </div>
          )}

          {/* Conversations Drawer Slide-Over */}
          {showDrawer && (
            <div className="absolute inset-x-0 top-[57px] bottom-0 z-30 bg-card/98 border-b border-border/80 backdrop-blur-xl flex flex-col p-4 animate-in slide-in-from-top-2 duration-150 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Your Conversations
                  </h4>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNewChat}
                  className="h-7 text-xs gap-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </Button>
              </div>

              {isGuest && (
                <div className="my-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                  <span className="font-semibold">Guest Mode:</span> Sign in to your InterviewAI
                  account to save your multi-turn chat conversations across devices.
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1 no-scrollbar text-xs">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Loading conversations...</span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-primary" />
                    <p className="font-medium">No previous conversations yet</p>
                    <p className="text-[11px] opacity-75 mt-0.5">
                      Start asking questions to build your interview preparation history.
                    </p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activeConversationId === conv.id
                          ? "bg-primary/10 border-primary/40 text-primary font-medium"
                          : "bg-muted/30 border-border/50 hover:bg-muted/70 text-foreground"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="truncate text-xs font-semibold">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                          {conv.messageCount} messages •{" "}
                          {new Date(conv.updatedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDrawer(false)}
                className="mt-2 text-xs w-full"
              >
                Back to Active Chat
              </Button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs relative"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Assistant Avatar */}
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`group relative max-w-[88%] rounded-2xl p-3.5 leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-tr-sm shadow-indigo-500/10"
                      : "bg-muted/50 border border-border/70 text-foreground rounded-tl-sm backdrop-blur-sm"
                  }`}
                >
                  {/* Message Content */}
                  <div className="pr-6">
                    {msg.intent === "ANSWER_INTERVIEW_QUESTION" && (
                      <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Answer recorded for interview question</span>
                      </div>
                    )}
                    {msg.isError ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-rose-500 dark:text-rose-400 font-medium text-xs">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{msg.content}</span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleRegenerate}
                          className="text-xs h-7 gap-1.5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Retry
                        </Button>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <ChatMessageContent content={msg.content} />
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>

                  {/* Actions for Assistant Message */}
                  {msg.role === "assistant" && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, msg.id)}
                        className="p-1 rounded bg-background/60 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Grounded Sources & Citations */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border/50">
                      <p className="text-[10px] text-muted-foreground font-mono mb-1.5 flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-cyan-500" />
                        <span>Sources & Citations:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all inline-flex items-center gap-1 truncate max-w-full"
                            title={src.title}
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[200px]">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Follow-Up Question Chips */}
                  {msg.role === "assistant" &&
                    msg.suggestedFollowUps &&
                    msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/50">
                        <p className="text-[10px] text-muted-foreground font-mono mb-1.5 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span>Suggested Next Steps:</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestedFollowUps.map((chip, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSend(chip)}
                              className="text-[10px] px-2.5 py-1 rounded-full bg-background/80 border border-border/80 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all text-left"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}

            {/* AI Thinking Indicator */}
            {loading && (
              <div className="flex gap-2.5 items-center text-muted-foreground text-xs py-1 animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-xl bg-primary/15 text-primary flex items-center justify-center animate-spin">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] bg-muted/40 px-3 py-1.5 rounded-full border border-border/50">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span>InterviewAI is analyzing your question...</span>
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="ml-2 flex items-center gap-1 text-[10px] text-destructive hover:underline"
                    title="Stop generation"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              className="absolute right-6 bottom-24 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all z-20"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}

          {/* Suggested Starter Topics (visible on new chat) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2.5 bg-card/60 border-t border-border/50 shrink-0">
              <p className="text-[10px] text-muted-foreground font-mono mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>
                  {activeQuestion
                    ? `Round ${activeQuestion.roundNumber} Help Prompts:`
                    : "Explore Popular Topics:"}
                </span>
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {(activeQuestion
                  ? [
                      "Can you clarify the pending question without giving away the answer?",
                      "What core concept is being tested here?",
                      ...(activeQuestion.options
                        ? ["Explain the difference between the options"]
                        : ["Help me structure my response using STAR"]),
                    ]
                  : SUGGESTED_STARTER_CHIPS
                ).map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(chip)}
                    className="shrink-0 text-[10px] px-2.5 py-1 rounded-full bg-muted/60 border border-border/60 text-foreground/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 bg-card border-t border-border/60 shrink-0">
            {/* Active Speech Recognition Banner */}
            {isListening && (
              <div className="flex items-center justify-between mb-2 px-3 py-1.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-[11px] animate-pulse">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                  <span className="font-semibold">Listening... Speak now</span>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="text-[10px] font-bold hover:underline uppercase"
                >
                  Done
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-end gap-2"
            >
              {/* Multi-line auto-resizing input */}
              <div className="flex-1 relative rounded-2xl border border-border/70 bg-background/90 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all flex items-center">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={
                    activeQuestion
                      ? `Ask for help on Round ${activeQuestion.roundNumber} or submit your answer...`
                      : "Ask about technical MCQs, STAR method, HR tips..."
                  }
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim()) {
                        handleSend();
                      }
                    }
                  }}
                  disabled={loading}
                  className="w-full max-h-28 px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground bg-transparent resize-none focus:outline-none"
                />

                {/* Clear Input Button */}
                {input.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      if (textareaRef.current) textareaRef.current.style.height = "auto";
                    }}
                    className="p-1.5 mr-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Web Speech API Microphone Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  className={`p-2.5 rounded-xl border transition-all shrink-0 ${
                    isListening
                      ? "bg-destructive text-destructive-foreground border-destructive animate-pulse"
                      : "bg-muted/60 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title={isListening ? "Stop listening" : "Speak to InterviewAI"}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Send / Stop Button */}
              {loading ? (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={handleStopGeneration}
                  className="h-9 px-3 rounded-xl gap-1 shrink-0"
                  title="Stop generation"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                  className="h-9 px-3.5 rounded-xl gap-1.5 shrink-0 bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white shadow-md hover:shadow-indigo-500/25 transition-all"
                  title="Send message (Enter)"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
