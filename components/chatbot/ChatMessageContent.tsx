"use client";

import * as React from "react";
import { Copy, Check, Terminal, Code2 } from "lucide-react";

interface ChatMessageContentProps {
  content: string;
}

export function ChatMessageContent({ content }: ChatMessageContentProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = React.useState<number | null>(null);

  const copyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => {
      setCopiedCodeIndex(null);
    }, 2000);
  };

  // Parse markdown into structured segments: code blocks, headings, lists, alerts, paragraphs
  const parsedElements = React.useMemo(() => {
    const segments: React.ReactNode[] = [];
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeBuffer: string[] = [];
    let codeBlockCount = 0;

    let inList = false;
    let listItems: string[] = [];
    let isOrderedList = false;

    const flushList = () => {
      if (!inList || listItems.length === 0) return;
      const key = `list-${segments.length}`;
      if (isOrderedList) {
        segments.push(
          <ol key={key} className="list-decimal pl-5 space-y-1.5 my-2 text-foreground/90 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ol>
        );
      } else {
        segments.push(
          <ul key={key} className="list-disc pl-5 space-y-1.5 my-2 text-foreground/90 leading-relaxed">
            {listItems.map((item, idx) => (
              <li key={idx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      }
      inList = false;
      listItems = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code block start or end
      if (line.trim().startsWith("```")) {
        if (!inCodeBlock) {
          flushList();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim() || "code";
          codeBuffer = [];
        } else {
          // Flush code block
          const codeText = codeBuffer.join("\n");
          const currentIndex = codeBlockCount++;
          const lang = codeLanguage;
          segments.push(
            <div
              key={`code-${currentIndex}`}
              className="my-3 rounded-xl overflow-hidden border border-border/80 bg-neutral-950 text-neutral-100 shadow-md font-mono text-[11px]"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-neutral-400">
                <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider text-primary-300">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{lang}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyCode(codeText, currentIndex)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-neutral-800/80 hover:bg-neutral-800 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedCodeIndex === currentIndex ? (
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
              <pre className="p-3.5 overflow-x-auto leading-relaxed whitespace-pre font-mono">
                <code>{codeText}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeBuffer = [];
          codeLanguage = "";
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Alerts / Blockquotes
      if (line.startsWith("> [!NOTE]") || line.startsWith("> [!TIP]") || line.startsWith("> [!IMPORTANT]") || line.startsWith("> [!WARNING]")) {
        flushList();
        const type = line.includes("TIP") ? "TIP" : line.includes("WARNING") ? "WARNING" : "NOTE";
        const alertLines: string[] = [];
        while (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
          i++;
          alertLines.push(lines[i].replace(/^>\s?/, ""));
        }
        segments.push(
          <div
            key={`alert-${i}`}
            className={`my-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
              type === "TIP"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                : type === "WARNING"
                ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-900 dark:text-indigo-200"
            }`}
          >
            <div className="font-bold text-[11px] mb-1 uppercase tracking-wide flex items-center gap-1">
              <span>{type === "TIP" ? "💡 Pro Tip" : type === "WARNING" ? "⚠️ Warning" : "ℹ️ Important Note"}</span>
            </div>
            <div>{renderInlineMarkdown(alertLines.join(" "))}</div>
          </div>
        );
        continue;
      }

      // Headings
      if (line.startsWith("### ")) {
        flushList();
        segments.push(
          <h3 key={`h3-${i}`} className="text-sm font-bold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-3.5 rounded-full bg-primary" />
            <span>{renderInlineMarkdown(line.slice(4))}</span>
          </h3>
        );
        continue;
      }

      if (line.startsWith("#### ")) {
        flushList();
        segments.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-foreground/90 mt-2.5 mb-1 text-primary-400">
            {renderInlineMarkdown(line.slice(5))}
          </h4>
        );
        continue;
      }

      // Horizontal dividers
      if (line.trim() === "---" || line.trim() === "***") {
        flushList();
        segments.push(<hr key={`hr-${i}`} className="my-2.5 border-border/60" />);
        continue;
      }

      // Bullet lists
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList || isOrderedList) {
          flushList();
          inList = true;
          isOrderedList = false;
        }
        listItems.push(bulletMatch[2]);
        continue;
      }

      // Numbered lists
      const numberedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (numberedMatch) {
        if (!inList || !isOrderedList) {
          flushList();
          inList = true;
          isOrderedList = true;
        }
        listItems.push(numberedMatch[2]);
        continue;
      }

      // If line is empty
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Regular paragraph
      flushList();
      segments.push(
        <p key={`p-${i}`} className="my-1.5 text-foreground/90 leading-relaxed text-xs">
          {renderInlineMarkdown(line)}
        </p>
      );
    }

    // Flush any pending list or unclosed code block
    flushList();
    if (inCodeBlock && codeBuffer.length > 0) {
      segments.push(
        <pre key="unclosed-code" className="p-3 my-2 rounded-xl bg-neutral-950 text-neutral-100 text-xs overflow-x-auto">
          <code>{codeBuffer.join("\n")}</code>
        </pre>
      );
    }

    return segments;
  }, [content, copiedCodeIndex]);

  return <div className="space-y-0.5">{parsedElements}</div>;
}

/**
 * Render inline markdown: bold, italic, inline code, and links
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex to split by bold (**text**), inline code (`code`), or italics (*text*)
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith("`") && token.endsWith("`") && token.length > 1) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted text-primary font-mono text-[11px] font-semibold border border-border/70"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith("**") && token.endsWith("**") && token.length > 3) {
      return (
        <strong key={idx} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
      return (
        <em key={idx} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}
