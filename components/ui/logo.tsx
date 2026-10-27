import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface LogoProps {
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Whether to show the adjacent brand text */
  showWordmark?: boolean;
  /** Brand wordmark text */
  wordmark?: string;
  /** Custom subtitle under wordmark */
  subtitle?: string;
  /** Optional link href (defaults to undefined, renders as div unless href provided) */
  href?: string;
  /** Additional wrapper classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Hover glow animation */
  withGlow?: boolean;
}

const sizeConfig = {
  xs: {
    badge: "w-7 h-7 rounded-lg",
    imgSize: 28,
    text: "text-sm",
    subtitle: "text-[8px]",
  },
  sm: {
    badge: "w-8 h-8 rounded-xl",
    imgSize: 32,
    text: "text-base",
    subtitle: "text-[9px]",
  },
  md: {
    badge: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
    imgSize: 40,
    text: "text-lg",
    subtitle: "text-[10px]",
  },
  lg: {
    badge: "w-12 h-12 rounded-2xl",
    imgSize: 48,
    text: "text-2xl",
    subtitle: "text-xs",
  },
  xl: {
    badge: "w-16 h-16 sm:w-20 sm:h-20 rounded-3xl",
    imgSize: 80,
    text: "text-3xl sm:text-4xl",
    subtitle: "text-sm",
  },
};

export function InterviewAILogo({
  size = "md",
  showWordmark = false,
  wordmark = "InterviewAI",
  subtitle = "Practice Smarter. Interview Better.",
  href,
  className,
  onClick,
  withGlow = true,
}: LogoProps) {
  const config = sizeConfig[size];

  const content = (
    <div
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2.5 select-none transition-transform duration-200",
        href && "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
        className
      )}
    >
      {/* 
        Signature Shield Emblem inset inside the purple-blue gradient.
        Preserves exact 1:1 square proportions and glow styling.
      */}
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300",
          config.badge,
          withGlow && "shadow-md shadow-indigo-500/25 group-hover:shadow-lg group-hover:shadow-indigo-500/40 group-hover:scale-105"
        )}
      >
        <Image
          src="/converza-badge-md.png"
          alt="InterviewAI"
          width={config.imgSize}
          height={config.imgSize}
          className="w-full h-full object-contain rounded-[inherit] select-none"
          priority
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col text-left leading-none">
          <span
            className={cn(
              "font-extrabold tracking-[0.08em] text-foreground transition-colors",
              config.text
            )}
          >
            {wordmark}
          </span>
          {subtitle && (
            <span
              className={cn(
                "text-muted-foreground uppercase tracking-wider font-mono font-medium mt-0.5",
                config.subtitle
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block focus-visible:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

// Export ConverzaLogo as backward-compatible alias
export const ConverzaLogo = InterviewAILogo;
export type ConverzaLogoProps = LogoProps;
