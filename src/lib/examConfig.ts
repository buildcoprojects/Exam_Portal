/**
 * Commercial Builder - Limited to Medium Rise Construction
 * Exam Configuration
 *
 * OFFICIAL BPC/VBA EXAM SPECIFICATIONS
 * Updated with verified official values
 */

export const EXAM_CONFIG = {
  examClass: "Commercial Builder – Limited to Medium Rise Construction",
  examCode: "CB-L-M",

  // OFFICIAL EXAM STRUCTURE
  numMcq: 50,     // Official: 50 multiple choice questions
  numPlan: 2,     // Official: 2 plan-based/technical exercises

  durationMinutes: 120,  // Official: 120 minutes total (60 min MCQ + 60 min plan-based)
  mcqDurationMinutes: 60,   // Suggested time allocation for MCQ section
  planDurationMinutes: 60,  // Suggested time allocation for plan section

  // OFFICIAL PASS REQUIREMENTS
  passMarkPercent: 70,    // Official: 70% required in EACH component
  requireBothComponentsPass: true,  // Must pass BOTH MCQ and plan sections separately
  mcqPassPercent: 70,     // Must achieve 70% in MCQ section
  planPassPercent: 70,    // Must achieve 70% in plan section

  // Practice mode features
  allowImmediateFeedback: true,  // Set to false to match real exam (summative, feedback at end only)
  allowFlagging: true,
  allowNavigation: true,  // Can jump between questions
  showTimer: true,
  showComponentTimer: false,  // Set to true to show separate MCQ/Plan timers

  // Question presentation
  questionsOrderMode: 'mcq-first' as 'mcq-first' | 'mixed' | 'plan-first',  // MCQ first, then plan
  shuffleWithinType: true,  // Shuffle MCQs among themselves, and plan questions among themselves

  // Scoring
  mcqWeight: 1,   // Each MCQ worth 1 mark (total 50 marks)
  planWeight: 25, // Each plan question worth 25 marks (total 50 marks, weighted to match MCQ)

  // Pool information (for practice portal only - not official exam feature)
  questionPoolSize: 1000,  // Total questions in the practice bank
  description: "This practice exam matches the official BPC Commercial Builder (Medium Rise) licensing exam format: 50 MCQs + 2 plan exercises, 120 minutes total, requiring 70% pass in BOTH components."
};

/**
 * Validates that exam configuration is properly set up
 */
export function validateExamConfig(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (EXAM_CONFIG.numMcq + EXAM_CONFIG.numPlan === 0) {
    warnings.push("Total question count is 0. Please update numMcq and numPlan with official values.");
  }

  if (EXAM_CONFIG.durationMinutes <= 0) {
    warnings.push("Exam duration is not set. Please update durationMinutes with official value.");
  }

  if (EXAM_CONFIG.passMarkPercent <= 0 || EXAM_CONFIG.passMarkPercent > 100) {
    warnings.push("Pass mark percentage is invalid. Please update passMarkPercent with official value.");
  }

  if (EXAM_CONFIG.requireBothComponentsPass) {
    if (EXAM_CONFIG.mcqPassPercent <= 0 || EXAM_CONFIG.mcqPassPercent > 100) {
      warnings.push("MCQ pass percentage is invalid.");
    }
    if (EXAM_CONFIG.planPassPercent <= 0 || EXAM_CONFIG.planPassPercent > 100) {
      warnings.push("Plan pass percentage is invalid.");
    }
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Get exam summary text
 */
export function getExamSummary(): string {
  return `${EXAM_CONFIG.numMcq} MCQ + ${EXAM_CONFIG.numPlan} plan questions, ${EXAM_CONFIG.durationMinutes} minutes total. Pass requirement: ${EXAM_CONFIG.passMarkPercent}% in each component.`;
}
