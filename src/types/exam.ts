export interface Question {
  id: string;
  type: 'mcq' | 'plan';
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  stem_or_prompt: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctIndex: number;
  marks: number;
  explanation: string;
  markingGuideline: string;
}

export interface UserAnswer {
  questionId: string;
  selectedOption?: number; // For MCQ
  drawing?: string; // Base64 encoded image for plan questions
  timeTaken: number;
  flagged: boolean;
}

export interface ExamState {
  currentQuestionIndex: number;
  answers: Map<string, UserAnswer>;
  timeRemaining: number;
  isCompleted: boolean;
  startTime: number;
}

export interface ShuffledOptions {
  questionId: string;
  shuffledIndices: number[]; // Maps display position to original option index
}

export interface ExamResults {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  totalMarks: number;
  scoredMarks: number;
  percentage: number;
  topicBreakdown: TopicScore[];
  timeTaken: number;
  // Component-specific results
  mcqCorrect?: number;
  mcqTotal?: number;
  mcqPercentage?: number;
  mcqPassed?: boolean;
  planTotal?: number;
  planAnswered?: number;
  requiresBothComponents?: boolean;
  overallPassed?: boolean;
}

export interface TopicScore {
  topic: string;
  total: number;
  correct: number;
  percentage: number;
}
