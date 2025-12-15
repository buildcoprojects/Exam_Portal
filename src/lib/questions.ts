import type { Question } from '@/types/exam';

/**
 * Load and validate questions from the expanded question bank
 * The question bank contains 1,000 questions (960 MCQ + 40 Plan)
 */
export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch('/exam-questions.csv');
  const csvText = await response.text();

  const questions = parseCSV(csvText);

  // Validate question bank integrity
  const validation = validateQuestionBank(questions);
  if (!validation.valid) {
    console.error('Question bank validation failed:', validation.errors);
    throw new Error(`Question bank validation failed: ${validation.errors.join(', ')}`);
  }

  if (validation.warnings.length > 0) {
    console.warn('Question bank warnings:', validation.warnings);
  }

  console.log(`✅ Loaded ${questions.length} questions (${validation.counts.mcq} MCQ, ${validation.counts.plan} Plan)`);

  return questions;
}

/**
 * Validate the question bank for integrity and correctness
 */
export function validateQuestionBank(questions: Question[]): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  counts: { mcq: number; plan: number; total: number };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const counts = { mcq: 0, plan: 0, total: questions.length };

  const seenIds = new Set<string>();

  questions.forEach((q, index) => {
    const lineNum = index + 2; // +1 for 0-index, +1 for header row

    // Check for duplicate IDs
    if (seenIds.has(q.id)) {
      errors.push(`Duplicate question ID "${q.id}" at line ${lineNum}`);
    }
    seenIds.add(q.id);

    // Validate type
    if (q.type !== 'mcq' && q.type !== 'plan') {
      errors.push(`Invalid type "${q.type}" at line ${lineNum} (must be 'mcq' or 'plan')`);
    } else {
      counts[q.type]++;
    }

    // Validate stem/prompt
    if (!q.stem_or_prompt || q.stem_or_prompt.trim().length === 0) {
      errors.push(`Empty stem_or_prompt at line ${lineNum} (ID: ${q.id})`);
    }

    // MCQ-specific validation
    if (q.type === 'mcq') {
      // Check all options exist
      const options = [q.optionA, q.optionB, q.optionC, q.optionD];
      const nonEmptyOptions = options.filter(opt => opt && opt.trim().length > 0);

      if (nonEmptyOptions.length < 2) {
        errors.push(`MCQ at line ${lineNum} has fewer than 2 options (ID: ${q.id})`);
      }

      if (nonEmptyOptions.length < 4) {
        warnings.push(`MCQ at line ${lineNum} has only ${nonEmptyOptions.length} options (ID: ${q.id})`);
      }

      // Validate correctIndex
      if (q.correctIndex < 0 || q.correctIndex >= nonEmptyOptions.length) {
        errors.push(`MCQ at line ${lineNum} has invalid correctIndex ${q.correctIndex} (ID: ${q.id})`);
      }

      // Check that correct option exists
      const correctOption = options[q.correctIndex];
      if (!correctOption || correctOption.trim().length === 0) {
        errors.push(`MCQ at line ${lineNum} has empty correct option at index ${q.correctIndex} (ID: ${q.id})`);
      }
    }

    // Validate marks
    if (q.marks < 1) {
      errors.push(`Invalid marks (${q.marks}) at line ${lineNum} (ID: ${q.id})`);
    }
  });

  // Summary validations
  if (counts.total === 0) {
    errors.push('Question bank is empty');
  }

  if (counts.mcq < 50) {
    warnings.push(`Only ${counts.mcq} MCQ questions available (exam needs 50 per attempt)`);
  }

  if (counts.plan < 2) {
    warnings.push(`Only ${counts.plan} Plan questions available (exam needs 2 per attempt)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts
  };
}

function parseCSV(csvText: string): Question[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');

  const questions: Question[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line handling quoted fields
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;

    const question: Question = {
      id: values[0],
      type: values[1].toLowerCase() as 'mcq' | 'plan',
      topic: values[2],
      subtopic: values[3],
      difficulty: values[4] as 'easy' | 'medium' | 'hard',
      stem_or_prompt: values[5],
      optionA: values[6] || undefined,
      optionB: values[7] || undefined,
      optionC: values[8] || undefined,
      optionD: values[9] || undefined,
      correctIndex: Number.parseInt(values[10]) || 0,
      marks: Number.parseInt(values[11]) || 1,
      explanation: values[12] || '',
      markingGuideline: values[13] || '',
    };

    questions.push(question);
  }

  return questions;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
