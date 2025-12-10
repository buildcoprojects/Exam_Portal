'use client';

import type { Question, UserAnswer } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Flag } from 'lucide-react';

interface QuestionGridProps {
  questions: Question[];
  answers: Map<string, UserAnswer>;
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  flagged?: Set<string>;
}

export default function QuestionGrid({
  questions,
  answers,
  currentIndex,
  onSelectQuestion,
  flagged,
}: QuestionGridProps) {
  const getQuestionStatus = (question: Question, index: number) => {
    const answer = answers.get(question.id);
    const isAnswered = question.type === 'mcq'
      ? answer?.selectedOption !== undefined
      : answer?.drawing !== undefined;
    const isFlagged = flagged ? flagged.has(question.id) : (answer?.flagged || false);
    const isCurrent = index === currentIndex;

    return { isAnswered, isFlagged, isCurrent };
  };

  // Separate MCQ and Plan questions
  const mcqQuestions: { question: Question; index: number }[] = [];
  const planQuestions: { question: Question; index: number }[] = [];

  questions.forEach((q, idx) => {
    if (q.type === 'mcq') {
      mcqQuestions.push({ question: q, index: idx });
    } else if (q.type === 'plan') {
      planQuestions.push({ question: q, index: idx });
    }
  });

  // Group MCQ questions by topic
  const groupedMCQ = mcqQuestions.reduce((acc, item) => {
    const topic = item.question.topic;
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(item);
    return acc;
  }, {} as Record<string, { question: Question; index: number }[]>);

  return (
    <Card className="bg-slate-800/50 border-slate-700 sticky top-24">
      <CardHeader>
        <CardTitle className="text-slate-100 text-lg">Question Navigator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Plan-Based Questions Section */}
        {planQuestions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-emerald-300 border-b border-emerald-600/50 pb-2">
              📐 Plan-Based Tasks ({planQuestions.length})
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {planQuestions.map(({ question, index }, planIdx) => {
                const { isAnswered, isFlagged, isCurrent } = getQuestionStatus(question, index);

                return (
                  <Button
                    key={question.id}
                    onClick={() => onSelectQuestion(index)}
                    variant="outline"
                    size="sm"
                    className={`relative h-10 ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-900/30 text-blue-200'
                        : isAnswered
                        ? 'border-emerald-500 bg-emerald-900/20 text-emerald-200'
                        : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    <span className="text-xs">P{planIdx + 1}</span>
                    {isFlagged && (
                      <Flag className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" />
                    )}
                    {isAnswered && !isCurrent && (
                      <CheckCircle2 className="w-3 h-3 absolute -bottom-1 -right-1 text-emerald-400" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* MCQ Questions by Topic */}
        {Object.entries(groupedMCQ).map(([topic, items]) => (
          <div key={topic} className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300 border-b border-slate-600 pb-2">
              {topic.replace(/_/g, ' ')}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {items.map(({ question, index }) => {
                const { isAnswered, isFlagged, isCurrent } = getQuestionStatus(question, index);

                return (
                  <Button
                    key={question.id}
                    onClick={() => onSelectQuestion(index)}
                    variant="outline"
                    size="sm"
                    className={`relative h-10 ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-900/30 text-blue-200'
                        : isAnswered
                        ? 'border-emerald-500 bg-emerald-900/20 text-emerald-200'
                        : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    <span className="text-xs">{index + 1}</span>
                    {isFlagged && (
                      <Flag className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" />
                    )}
                    {isAnswered && !isCurrent && (
                      <CheckCircle2 className="w-3 h-3 absolute -bottom-1 -right-1 text-emerald-400" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-slate-600">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-4 h-4 border-2 border-emerald-500 bg-emerald-900/20 rounded" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-4 h-4 border-2 border-slate-600 rounded" />
              <span>Not Answered</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-4 h-4 border-2 border-blue-500 bg-blue-900/30 rounded" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Flag className="w-4 h-4 text-amber-400" />
              <span>Flagged</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
