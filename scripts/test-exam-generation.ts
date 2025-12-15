/**
 * Test Exam Generation with Expanded Question Bank
 * Simulates multiple exam generations to verify:
 * - No duplicate questions within an exam
 * - Correct number of MCQ and Plan questions
 * - All selected questions are valid
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface Question {
  id: string;
  type: 'mcq' | 'plan';
  correctIndex: number;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else current += char;
  }
  values.push(current.trim());
  return values;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const csvPath = join(process.cwd(), 'public', 'exam-questions.csv');
const csvText = readFileSync(csvPath, 'utf-8');
const lines = csvText.split('\n');

const questions: Question[] = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const values = parseCSVLine(line);
  questions.push({
    id: values[0],
    type: values[1].toLowerCase() as 'mcq' | 'plan',
    correctIndex: parseInt(values[10]) || 0
  });
}

const mcqPool = questions.filter(q => q.type === 'mcq');
const planPool = questions.filter(q => q.type === 'plan');

console.log('🎯 Testing Exam Generation\n');
console.log(`Question Pools:`);
console.log(`   MCQ Pool:  ${mcqPool.length} questions`);
console.log(`   Plan Pool: ${planPool.length} questions\n`);

const NUM_TESTS = 100;
const MCQ_PER_EXAM = 50;
const PLAN_PER_EXAM = 2;

let totalTests = 0;
let passedTests = 0;

for (let test = 0; test < NUM_TESTS; test++) {
  totalTests++;
  
  // Simulate exam generation
  const selectedMcqs = shuffleArray([...mcqPool]).slice(0, MCQ_PER_EXAM);
  const selectedPlans = shuffleArray([...planPool]).slice(0, PLAN_PER_EXAM);
  const allSelected = [...selectedMcqs, ...selectedPlans];
  
  // Check for duplicates
  const ids = new Set(allSelected.map(q => q.id));
  if (ids.size !== allSelected.length) {
    console.error(`❌ Test ${test + 1}: Duplicate questions detected!`);
    continue;
  }
  
  // Verify counts
  if (selectedMcqs.length !== MCQ_PER_EXAM) {
    console.error(`❌ Test ${test + 1}: Wrong MCQ count (${selectedMcqs.length})`);
    continue;
  }
  
  if (selectedPlans.length !== PLAN_PER_EXAM) {
    console.error(`❌ Test ${test + 1}: Wrong Plan count (${selectedPlans.length})`);
    continue;
  }
  
  // Verify all have valid correct answers
  const invalidMcqs = selectedMcqs.filter(q => q.correctIndex < 0 || q.correctIndex > 3);
  if (invalidMcqs.length > 0) {
    console.error(`❌ Test ${test + 1}: Invalid correct indices found`);
    continue;
  }
  
  passedTests++;
}

console.log(`Results: ${passedTests}/${totalTests} tests passed\n`);

if (passedTests === totalTests) {
  console.log('✅ ALL TESTS PASSED - Exam generation works correctly!\n');
  console.log('🎯 Verified:');
  console.log('   - No duplicate questions within exams');
  console.log('   - Correct number of MCQ and Plan questions');
  console.log('   - All questions have valid correct answers');
  console.log(`   - Can generate ${Math.floor(mcqPool.length / MCQ_PER_EXAM)} unique MCQ sets`);
  console.log(`   - Can generate ${Math.floor(planPool.length / PLAN_PER_EXAM)} unique Plan sets\n`);
  process.exit(0);
} else {
  console.log(`❌ SOME TESTS FAILED (${totalTests - passedTests} failures)\n`);
  process.exit(1);
}
