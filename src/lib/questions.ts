import type { Question } from '@/types/exam';

export async function loadQuestions(): Promise<Question[]> {
  const response = await fetch('/exam-questions.csv');
  const csvText = await response.text();

  return parseCSV(csvText);
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
