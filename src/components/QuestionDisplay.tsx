'use client';

import { useState, useEffect } from 'react';
import type { Question, UserAnswer } from '@/types/exam';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import DrawingCanvas from './DrawingCanvas';
import { EXAM_CONFIG } from '@/lib/examConfig';

interface QuestionDisplayProps {
  question: Question;
  answer?: UserAnswer;
  onAnswer: (questionId: string, answer: Partial<UserAnswer>) => void;
  hasAnswered?: boolean;  // Track if user has actually selected an option
  shuffledOptions?: number[]; // Shuffled option indices for this question
}

export default function QuestionDisplay({ question, answer, onAnswer, hasAnswered = false, shuffledOptions }: QuestionDisplayProps) {
  // Local state to track if user has answered THIS question during THIS view
  const [userHasAnswered, setUserHasAnswered] = useState(hasAnswered);

  // Reset userHasAnswered when question changes (fixes pre-selection bug)
  useEffect(() => {
    setUserHasAnswered(hasAnswered);
  }, [question.id, hasAnswered]);

  const handleMCQAnswer = (optionIndex: number) => {
    onAnswer(question.id, { selectedOption: optionIndex });
    // Only NOW show validation (after user clicks)
    setUserHasAnswered(true);
  };

  const handleDrawingSubmit = (drawing: string) => {
    onAnswer(question.id, { drawing });
  };

  // Only calculate if user has answered
  const isCorrect = answer?.selectedOption === question.correctIndex;
  // Only show validation if immediate feedback is enabled AND user has answered
  const showFeedback = EXAM_CONFIG.allowImmediateFeedback && userHasAnswered && answer?.selectedOption !== undefined;

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                {question.type.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                {question.topic}
              </Badge>
              <Badge variant="outline" className="border-slate-500 text-slate-400">
                {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
              </Badge>
            </div>
            <CardTitle className="text-slate-100 text-lg leading-relaxed">
              {question.stem_or_prompt}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {question.type === 'mcq' ? (
          <>
            <RadioGroup
              key={question.id} // Force re-render when question changes (fixes pre-selection bug)
              value={answer?.selectedOption?.toString()}
              onValueChange={(value) => handleMCQAnswer(Number.parseInt(value))}
              className="space-y-3"
            >
              {(() => {
                // Get original options
                const originalOptions = [
                  { index: 0, text: question.optionA },
                  { index: 1, text: question.optionB },
                  { index: 2, text: question.optionC },
                  { index: 3, text: question.optionD },
                ].filter(opt => opt.text);

                // Apply shuffling if available, otherwise use original order
                const displayOptions = shuffledOptions
                  ? shuffledOptions.map((originalIndex, displayPosition) => ({
                      ...originalOptions[originalIndex],
                      displayPosition
                    }))
                  : originalOptions.map((opt, displayPosition) => ({ ...opt, displayPosition }));

                return displayOptions.map((option, displayIndex) => {
                  if (!option.text) return null;

                  const isSelected = answer?.selectedOption === option.index;
                  const isCorrectOption = option.index === question.correctIndex;

                  // Only highlight correct/incorrect AFTER user has answered
                  const showAsCorrect = showFeedback && isCorrectOption;
                  const showAsIncorrect = showFeedback && isSelected && !isCorrect;

                  return (
                    <div
                      key={`${question.id}-${option.index}`}
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all ${
                        showAsCorrect
                          ? 'border-emerald-500 bg-emerald-900/20'
                          : showAsIncorrect
                          ? 'border-red-500 bg-red-900/20'
                          : isSelected && !showFeedback
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <RadioGroupItem value={option.index.toString()} id={`${question.id}-option-${option.index}`} />
                      <Label
                        htmlFor={`${question.id}-option-${option.index}`}
                        className="flex-1 cursor-pointer text-slate-200 leading-relaxed"
                      >
                        <span className="font-semibold mr-2">
                          {String.fromCharCode(65 + displayIndex)}.
                        </span>
                        {option.text}
                      </Label>
                      {showAsCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                      {showAsIncorrect && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />}
                    </div>
                  );
                });
              })()}
            </RadioGroup>

            {/* Only show explanation AFTER user has answered */}
            {showFeedback && (
              <Alert className={`${isCorrect ? 'border-emerald-700 bg-emerald-900/20' : 'border-red-700 bg-red-900/20'}`}>
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
                <AlertDescription className={isCorrect ? 'text-emerald-200' : 'text-red-200'}>
                  <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong>
                  {!isCorrect && (
                    <span className="ml-2">
                      The correct answer is <strong>{String.fromCharCode(65 + question.correctIndex)}</strong>.
                    </span>
                  )}
                  <div className="mt-2 text-slate-300">{question.explanation}</div>
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-200">Plan-Based Question Instructions</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {question.markingGuideline}
                  </p>
                  <p className="text-slate-400 text-sm italic mt-2">
                    Use the drawing tools below to mark your answer on the plan. You can draw lines, add annotations,
                    and mark specific areas as required.
                  </p>
                </div>
              </div>
            </div>

            <DrawingCanvas
              questionId={question.id}
              existingDrawing={answer?.drawing}
              onSave={handleDrawingSubmit}
            />
          </>
        )}

        <div className="pt-4 border-t border-slate-600">
          <div className="flex items-start gap-2 text-sm text-slate-400">
            <span className="font-semibold">Subtopic:</span>
            <span>{question.subtopic}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
