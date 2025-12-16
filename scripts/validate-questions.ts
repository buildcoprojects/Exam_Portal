/**
 * Question Bank Validation Script
 * Run: bun run scripts/validate-questions.ts
 */
import { readFileSync } from 'fs';
import { join } from 'path';

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

let mcqCount = 0, planCount = 0, errors = 0, warnings = 0;
const seenIds = new Set<string>();
const topics = new Map<string, number>();
const placeholderQuestions: string[] = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const values = parseCSVLine(line);
  const id = values[0];
  const type = values[1]?.toLowerCase();
  const topic = values[2];
  const stem = values[5];

  if (seenIds.has(id)) {
    console.error(`❌ Duplicate ID: ${id}`);
    errors++;
  }
  seenIds.add(id);

  topics.set(topic, (topics.get(topic) || 0) + 1);

  if (type === 'mcq') {
    mcqCount++;
    const correctIdx = parseInt(values[10]);
    if (correctIdx < 0 || correctIdx > 3) {
      console.error(`❌ Invalid correctIndex for ${id}: ${correctIdx}`);
      errors++;
    }

    // Check for placeholder text in options
    const optA = values[6];
    const optB = values[7];
    const optC = values[8];
    const optD = values[9];

    const hasPlaceholder =
      optA?.includes(`Option A for ${id}`) ||
      optB?.includes(`Option B for ${id}`) ||
      optC?.includes(`Option C for ${id}`) ||
      optD?.includes(`Option D for ${id}`) ||
      stem?.includes(`Question ${id.split('-')[1]}:`);

    if (hasPlaceholder) {
      placeholderQuestions.push(id);
      warnings++;
    }
  } else if (type === 'plan') {
    planCount++;
  }
}

console.log('\n📊 Question Bank Summary:');
console.log(`   Total: ${mcqCount + planCount}`);
console.log(`   MCQ:   ${mcqCount}`);
console.log(`   Plan:  ${planCount}\n`);

console.log('📚 Topics:');
const sortedTopics = Array.from(topics.entries()).sort((a, b) => b[1] - a[1]);
sortedTopics.forEach(([topic, count]) => {
  console.log(`   ${topic.padEnd(25)} ${count.toString().padStart(4)}`);
});

if (placeholderQuestions.length > 0) {
  console.log(`\n⚠️  WARNING: ${placeholderQuestions.length} questions have placeholder text:`);
  placeholderQuestions.slice(0, 10).forEach(id => {
    console.log(`   - ${id}`);
  });
  if (placeholderQuestions.length > 10) {
    console.log(`   ... and ${placeholderQuestions.length - 10} more`);
  }
  console.log('\n   These questions should be reviewed and updated with real content.');
  console.log(`   ${mcqCount - placeholderQuestions.length} MCQ questions are ready for use.`);
}

if (errors === 0) {
  if (warnings > 0) {
    console.log(`\n✅ VALIDATION PASSED (with ${warnings} warnings)\n`);
  } else {
    console.log('\n✅ VALIDATION PASSED\n');
  }
  process.exit(0);
} else {
  console.log(`\n❌ VALIDATION FAILED (${errors} errors, ${warnings} warnings)\n`);
  process.exit(1);
}
