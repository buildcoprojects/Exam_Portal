'use client';

import type { ExamResults, Question, UserAnswer } from '@/types/exam';
import { EXAM_CONFIG } from '@/lib/examConfig';
import { clearSession } from '@/lib/examSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Target,
  TrendingUp,
  Download,
  Home,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface ResultsPageProps {
  results: ExamResults;
  questions: Question[];
  answers: Map<string, UserAnswer>;
  onExit?: () => void;
}

export default function ResultsPage({ results, questions, answers, onExit }: ResultsPageProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const passed = results.percentage >= EXAM_CONFIG.passMarkPercent;

  const getGrade = (percentage: number) => {
    if (percentage >= EXAM_CONFIG.passMarkPercent) {
      if (percentage >= 80) return { grade: 'Excellent Pass', color: 'text-emerald-400', bg: 'bg-emerald-900/20', icon: Trophy };
      if (percentage >= 70) return { grade: 'Strong Pass', color: 'text-emerald-400', bg: 'bg-emerald-900/20', icon: Trophy };
      return { grade: 'Pass', color: 'text-blue-400', bg: 'bg-blue-900/20', icon: CheckCircle2 };
    }
    return { grade: 'Did Not Pass', color: 'text-red-400', bg: 'bg-red-900/20', icon: XCircle };
  };

  const grade = getGrade(results.percentage);

  const handlePrint = () => {
    window.print();
  };

  const handleNewExam = () => {
    clearSession();
    if (onExit) onExit();
    else window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className={`border-2 ${passed ? 'bg-emerald-900/10 border-emerald-700' : 'bg-red-900/10 border-red-700'}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <grade.icon className={`w-20 h-20 ${grade.color}`} />
            </div>
            <CardTitle className={`text-4xl font-bold ${grade.color}`}>
              {passed ? 'Congratulations! You Passed!' : 'Exam Complete'}
            </CardTitle>
            <p className="text-slate-300 mt-2 text-lg">
              {EXAM_CONFIG.examClass}
            </p>
            <div className="mt-4">
              <Badge className={`text-lg px-4 py-2 ${grade.bg} ${grade.color} border-0`}>
                {results.percentage.toFixed(1)}% - {grade.grade}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 mt-3">
              Pass mark: {EXAM_CONFIG.passMarkPercent}%
            </p>
          </CardHeader>
        </Card>

        {/* Overall Score */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Overall Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-slate-100">
                  {results.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400 mt-1">Overall Score</div>
                <Badge className={`mt-2 ${grade.bg} ${grade.color} border-0`}>
                  {grade.grade}
                </Badge>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {results.correctAnswers}
                </div>
                <div className="text-sm text-slate-400 mt-1">Correct Answers</div>
                <div className="text-xs text-slate-500 mt-1">
                  out of {results.answeredQuestions} answered
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {results.scoredMarks}/{results.totalMarks}
                </div>
                <div className="text-sm text-slate-400 mt-1">Marks Scored</div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  {formatTime(results.timeTaken)}
                </div>
                <div className="text-sm text-slate-400 mt-1">Time Taken</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Progress</span>
                <span>{results.answeredQuestions} of {results.totalQuestions} questions</span>
              </div>
              <Progress
                value={(results.answeredQuestions / results.totalQuestions) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Component Breakdown (MCQ vs Plan) */}
        {results.requiresBothComponents && (results.mcqTotal || 0) > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Component Results</CardTitle>
              <p className="text-sm text-slate-400 mt-2">
                Official requirement: {EXAM_CONFIG.passMarkPercent}% in EACH component
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MCQ Component */}
                <div className={`rounded-lg p-6 border-2 ${
                  results.mcqPassed
                    ? 'bg-emerald-900/10 border-emerald-700'
                    : 'bg-red-900/10 border-red-700'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-200">
                      Multiple Choice Questions
                    </h3>
                    {results.mcqPassed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Score:</span>
                      <span className="text-2xl font-bold text-slate-100">
                        {(results.mcqPercentage || 0).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Correct:</span>
                      <span className="text-slate-200">
                        {results.mcqCorrect}/{results.mcqTotal}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Pass Mark:</span>
                      <span className="text-slate-200">{EXAM_CONFIG.mcqPassPercent}%</span>
                    </div>

                    <Progress
                      value={results.mcqPercentage || 0}
                      className="h-2 mt-3"
                    />

                    <div className="mt-3">
                      <Badge className={`${
                        results.mcqPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-red-600 text-white'
                      } border-0`}>
                        {results.mcqPassed ? 'PASSED MCQ Component' : 'Did Not Pass MCQ Component'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Plan Component */}
                {(results.planTotal || 0) > 0 && (
                  <div className="rounded-lg p-6 border-2 bg-blue-900/10 border-blue-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-200">
                        Plan-Based Exercises
                      </h3>
                      <Badge variant="outline" className="border-blue-500 text-blue-400">
                        Manual Grading
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Total Questions:</span>
                        <span className="text-2xl font-bold text-slate-100">
                          {results.planTotal}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Attempted:</span>
                        <span className="text-slate-200">
                          {results.planAnswered}/{results.planTotal}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Pass Mark:</span>
                        <span className="text-slate-200">{EXAM_CONFIG.planPassPercent}%</span>
                      </div>

                      <div className="bg-blue-900/20 rounded-lg p-3 mt-3">
                        <p className="text-xs text-blue-200">
                          ℹ️ Plan-based questions are manually assessed by BPC examiners.
                          You must achieve {EXAM_CONFIG.planPassPercent}% in this component to pass the exam.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {results.requiresBothComponents && (
                <Alert className="mt-4 bg-amber-900/20 border-amber-700/50">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-200">
                    <strong>Important:</strong> The official exam requires 70% in BOTH the MCQ component AND
                    the plan-based component. Your MCQ score is {(results.mcqPercentage || 0).toFixed(1)}%.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Topic Breakdown */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Topic Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.topicBreakdown
                .sort((a, b) => b.percentage - a.percentage)
                .map((topic) => {
                  const topicGrade = getGrade(topic.percentage);
                  return (
                    <div key={topic.topic} className="bg-slate-900/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-200">
                            {topic.topic.replace(/_/g, ' ')}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                            <span>{topic.correct} / {topic.total} correct</span>
                            <Badge className={`${topicGrade.bg} ${topicGrade.color} border-0 text-xs`}>
                              {topic.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Progress value={topic.percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Question Review</CardTitle>
            <p className="text-sm text-slate-400">
              Review your answers and explanations for each question
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((question, index) => {
                const answer = answers.get(question.id);
                const isAnswered = question.type === 'mcq'
                  ? answer?.selectedOption !== undefined
                  : answer?.drawing !== undefined;
                const isCorrect = question.type === 'mcq'
                  ? answer?.selectedOption === question.correctIndex
                  : false;

                return (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg"
                  >
                    <div className="flex-shrink-0">
                      {question.type === 'mcq' ? (
                        isAnswered ? (
                          isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )
                        ) : (
                          <div className="w-5 h-5 border-2 border-slate-600 rounded-full" />
                        )
                      ) : (
                        <Badge variant="outline" className="border-blue-500 text-blue-400 text-xs">
                          PLAN
                        </Badge>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-sm font-semibold text-slate-200">
                            Q{index + 1}.
                          </span>
                          <span className="text-sm text-slate-300 ml-2">
                            {question.stem_or_prompt.substring(0, 80)}...
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="border-purple-500 text-purple-400 text-xs">
                            {question.topic.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                            {question.marks}m
                          </Badge>
                        </div>
                      </div>

                      {question.type === 'mcq' && isAnswered && (
                        <div className="mt-2 text-xs text-slate-400">
                          {isCorrect ? (
                            <span className="text-emerald-400">Correct answer selected</span>
                          ) : (
                            <span className="text-red-400">
                              Selected: {String.fromCharCode(65 + (answer?.selectedOption || 0))} |
                              Correct: {String.fromCharCode(65 + question.correctIndex)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="border-slate-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Print Results
              </Button>
              <Button
                onClick={handleNewExam}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Take New Exam
              </Button>
              {onExit && (
                <Button
                  onClick={() => {
                    clearSession();
                    onExit();
                  }}
                  variant="outline"
                  className="border-slate-600"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study Recommendations */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Study Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.topicBreakdown
                .filter((topic) => topic.percentage < 70)
                .sort((a, b) => a.percentage - b.percentage)
                .map((topic) => (
                  <div
                    key={topic.topic}
                    className="bg-amber-900/10 border border-amber-700/50 rounded-lg p-4"
                  >
                    <h4 className="font-semibold text-amber-200">
                      Focus on: {topic.topic.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-amber-300/80 mt-1">
                      You scored {topic.percentage.toFixed(1)}% in this topic.
                      Review the NCC requirements and practice more questions in this area.
                    </p>
                  </div>
                ))}

              {results.topicBreakdown.every((topic) => topic.percentage >= 70) && (
                <div className="bg-emerald-900/10 border border-emerald-700/50 rounded-lg p-4">
                  <p className="text-emerald-200">
                    Great job! You've scored well across all topics.
                    Keep practicing to maintain your knowledge.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
