/**
 * Question Bank Validation Script
 */
import { readFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  type: 'mcq' | 'plan';
  topic: string;
  correctIndex: number;
  stem_or_prompt: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  marks: number;
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

const csvPath = join(process.cwd(), 'public', 'exam-questions.csv');
const csvText = readFileSync(csvPath, 'utf-8');
const lines = csvText.split('\n');

let mcqCount = 0, planCount = 0, errors = 0;
const seenIds = new Set<string>();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const values = parseCSVLine(line);
  const id = values[0];
  const type = values[1]?.toLowerCase();
  
  if (seenIds.has(id)) {
    console.error(`❌ Duplicate ID: ${id}`);
    errors++;
  }
  seenIds.add(id);
  
  if (type === 'mcq') {
    mcqCount++;
    const correctIdx = parseInt(values[10]);
    if (correctIdx < 0 || correctIdx > 3) {
      console.error(`❌ Invalid correctIndex for ${id}: ${correctIdx}`);
      errors++;
    }
  } else if (type === 'plan') {
    planCount++;
  }
}

console.log('\n📊 Question Bank Summary:');
console.log(`   Total: ${mcqCount + planCount}`);
console.log(`   MCQ:   ${mcqCount}`);
console.log(`   Plan:  ${planCount}`);

if (errors === 0) {
  console.log('\n✅ VALIDATION PASSED\n');
  process.exit(0);
} else {
  console.log(`\n❌ VALIDATION FAILED (${errors} errors)\n`);
  process.exit(1);
}
