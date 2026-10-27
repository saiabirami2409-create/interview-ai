import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ActiveInterviewProvider } from "@/context/ActiveInterviewContext";
import { FloatingChatbot } from "@/components/chatbot/FloatingChatbot";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewAI — Practice Smarter. Interview Better.",
  description:
    "AI-powered mock interview preparation system featuring Technical MCQs, Behavioral STAR interview, and HR interview with instant scoring.",
  metadataBase: new URL("https://converza.local"),
  icons: {
    icon: "/icon.png",
    apple: "/converza-badge-sm.png",
  },
  openGraph: {
    title: "InterviewAI — Practice Smarter. Interview Better.",
    description:
      "Practice with role-specific AI mock interviews, get instant question-by-question rubric evaluations, and track your interview readiness score.",
    siteName: "InterviewAI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ActiveInterviewProvider>
            {children}
            <FloatingChatbot />
          </ActiveInterviewProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
