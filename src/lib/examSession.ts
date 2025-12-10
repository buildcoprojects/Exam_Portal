import type { Question, UserAnswer } from '@/types/exam';
import { EXAM_CONFIG } from './examConfig';

export interface ExamSession {
  sessionId: string;
  questionIds: string[];  // IDs of questions in this session, in order
  shuffledOptions: Map<string, number[]>; // Maps questionId to shuffled option indices
  startedAt: number;
  answers: Map<string, UserAnswer>;
  flagged: Set<string>;
  submitted: boolean;
  submittedAt?: number;
}

const SESSION_STORAGE_KEY = 'exam_portal_session';

/**
 * Sample questions from the pool to create a new exam session
 */
export function createExamSession(questionBank: Question[]): ExamSession {
  const mcqPool = questionBank.filter(q => q.type === 'mcq');
  const planPool = questionBank.filter(q => q.type === 'plan');

  // Randomly sample questions
  const selectedMcqs = shuffleArray([...mcqPool]).slice(0, EXAM_CONFIG.numMcq);
  const selectedPlans = shuffleArray([...planPool]).slice(0, EXAM_CONFIG.numPlan);

  // Order questions based on config
  let questionIds: string[];
  if (EXAM_CONFIG.questionsOrderMode === 'mcq-first') {
    questionIds = [
      ...(EXAM_CONFIG.shuffleWithinType ? shuffleArray(selectedMcqs) : selectedMcqs).map(q => q.id),
      ...(EXAM_CONFIG.shuffleWithinType ? shuffleArray(selectedPlans) : selectedPlans).map(q => q.id)
    ];
  } else if (EXAM_CONFIG.questionsOrderMode === 'plan-first') {
    questionIds = [
      ...(EXAM_CONFIG.shuffleWithinType ? shuffleArray(selectedPlans) : selectedPlans).map(q => q.id),
      ...(EXAM_CONFIG.shuffleWithinType ? shuffleArray(selectedMcqs) : selectedMcqs).map(q => q.id)
    ];
  } else {
    // Mixed mode: shuffle all together
    const allSelected = [...selectedMcqs, ...selectedPlans];
    questionIds = shuffleArray(allSelected).map(q => q.id);
  }

  // Generate shuffled option orders for MCQ questions
  const shuffledOptions = new Map<string, number[]>();
  [...selectedMcqs, ...selectedPlans].forEach(q => {
    if (q.type === 'mcq') {
      // Count how many options this question has
      const optionCount = [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean).length;
      // Create array [0, 1, 2, 3...] and shuffle it
      const indices = Array.from({ length: optionCount }, (_, i) => i);
      shuffledOptions.set(q.id, shuffleArray(indices));
    }
  });

  const session: ExamSession = {
    sessionId: generateSessionId(),
    questionIds,
    shuffledOptions,
    startedAt: Date.now(),
    answers: new Map(),
    flagged: new Set(),
    submitted: false
  };

  saveSession(session);
  return session;
}

/**
 * Load existing session from storage
 */
export function loadSession(): ExamSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      answers: new Map(parsed.answers || []),
      flagged: new Set(parsed.flagged || []),
      shuffledOptions: new Map(parsed.shuffledOptions || [])
    };
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Save session to storage
 */
export function saveSession(session: ExamSession): void {
  if (typeof window === 'undefined') return;

  try {
    const toStore = {
      ...session,
      answers: Array.from(session.answers.entries()),
      flagged: Array.from(session.flagged),
      shuffledOptions: Array.from(session.shuffledOptions.entries())
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Clear session from storage
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Update answer for a question
 */
export function updateAnswer(
  session: ExamSession,
  questionId: string,
  answer: Partial<UserAnswer>
): ExamSession {
  const existing = session.answers.get(questionId) || {
    questionId,
    timeTaken: 0,
    flagged: false
  };

  const updated: ExamSession = {
    ...session,
    answers: new Map(session.answers)
  };

  updated.answers.set(questionId, { ...existing, ...answer });
  saveSession(updated);
  return updated;
}

/**
 * Toggle flag for a question
 */
export function toggleFlag(session: ExamSession, questionId: string): ExamSession {
  const updated: ExamSession = {
    ...session,
    flagged: new Set(session.flagged)
  };

  if (updated.flagged.has(questionId)) {
    updated.flagged.delete(questionId);
  } else {
    updated.flagged.add(questionId);
  }

  // Also update the answer object
  const answer = updated.answers.get(questionId);
  if (answer) {
    answer.flagged = updated.flagged.has(questionId);
  }

  saveSession(updated);
  return updated;
}

/**
 * Submit exam session
 */
export function submitSession(session: ExamSession): ExamSession {
  const updated: ExamSession = {
    ...session,
    submitted: true,
    submittedAt: Date.now()
  };

  saveSession(updated);
  return updated;
}

/**
 * Check if a question has been answered
 */
export function isQuestionAnswered(session: ExamSession, questionId: string, questionType: 'mcq' | 'plan'): boolean {
  const answer = session.answers.get(questionId);
  if (!answer) return false;

  if (questionType === 'mcq') {
    return answer.selectedOption !== undefined;
  } else {
    return !!answer.drawing;
  }
}

/**
 * Get time remaining in seconds
 */
export function getTimeRemaining(session: ExamSession): number {
  const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
  const total = EXAM_CONFIG.durationMinutes * 60;
  return Math.max(0, total - elapsed);
}

/**
 * Get shuffled option indices for a question
 */
export function getShuffledOptions(session: ExamSession, questionId: string): number[] | undefined {
  return session.shuffledOptions.get(questionId);
}

// Utility functions

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
