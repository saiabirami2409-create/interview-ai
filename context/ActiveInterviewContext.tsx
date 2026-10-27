"use client";

import * as React from "react";

export interface ActiveInterviewQuestion {
  roundNumber: number; // 1 to 5
  roundName: string;
  questionId: string;
  questionText: string;
  category?: string;
  options?: Record<string, string>;
  onAnswerSubmit?: (answer: string) => void | Promise<void>;
}

interface ActiveInterviewContextType {
  activeQuestion: ActiveInterviewQuestion | null;
  setActiveQuestion: (q: ActiveInterviewQuestion | null) => void;
  submitAnswerFromChatbot: (answer: string) => void | Promise<void>;
}

export const ActiveInterviewContext = React.createContext<ActiveInterviewContextType>({
  activeQuestion: null,
  setActiveQuestion: () => {},
  submitAnswerFromChatbot: () => {},
});

export function ActiveInterviewProvider({ children }: { children: React.ReactNode }) {
  const [activeQuestion, setActiveQuestion] = React.useState<ActiveInterviewQuestion | null>(null);

  const submitAnswerFromChatbot = React.useCallback(
    async (answer: string) => {
      if (activeQuestion?.onAnswerSubmit) {
        await activeQuestion.onAnswerSubmit(answer);
      }
    },
    [activeQuestion]
  );

  return (
    <ActiveInterviewContext.Provider value={{ activeQuestion, setActiveQuestion, submitAnswerFromChatbot }}>
      {children}
    </ActiveInterviewContext.Provider>
  );
}

export function useActiveInterview() {
  return React.useContext(ActiveInterviewContext);
}
