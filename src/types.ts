export interface MathProblem {
  problem: string;
  type: "multiple-choice" | "short-answer";
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export interface UserStats {
  solvedCount: number;
  totalAttempts: number;
  streak: number;
  socraticBreakthroughs: number; // Corrected after consulting AI tutor
  lastActiveDate: string | null;
  topicMastery: {
    [key: string]: number; // Percentage 0 - 100
  };
}

export interface ActiveProblemState {
  problem: MathProblem | null;
  studentAnswer: string;
  studentStep: string;
  isEvaluated: boolean;
  isCorrect: boolean | null;
  feedback: string | null;
  hasUsedTutor: boolean;
  isBreakthrough: boolean; // Flag to check if they completed it through the tutor
}
