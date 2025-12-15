'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadQuestions } from '@/lib/questions';
import type { Question, ExamResults } from '@/types/exam';
import type { ExamSession } from '@/lib/examSession';
import {
  createExamSession,
  loadSession,
  updateAnswer,
  toggleFlag as sessionToggleFlag,
  submitSession,
  isQuestionAnswered,
  getTimeRemaining,
  clearSession,
  getShuffledOptions
} from '@/lib/examSession';
import { EXAM_CONFIG } from '@/lib/examConfig';
import { getCurrentSession, saveExamAttempt } from '@/lib/authDb';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Flag, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Home } from 'lucide-react';
import QuestionDisplay from './QuestionDisplay';
import ResultsPage from './ResultsPage';
import QuestionGrid from './QuestionGrid';

interface ExamInterfaceProps {
  onExit?: () => void;
}

export default function ExamInterface({ onExit }: ExamInterfaceProps) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(EXAM_CONFIG.durationMinutes * 60);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // Initialize or resume session
  useEffect(() => {
    const initSession = async () => {
      try {
        const questions = await loadQuestions();
        setAllQuestions(questions);

        // Try to load existing session
        const existingSession = loadSession();

        if (existingSession && !existingSession.submitted) {
          // Resume existing session
          setSession(existingSession);
          setTimeRemaining(getTimeRemaining(existingSession));

          // Load questions for this session
          const sessionQs = questions.filter(q => existingSession.questionIds.includes(q.id));
          // Sort by session order
          sessionQs.sort((a, b) => {
            return existingSession.questionIds.indexOf(a.id) - existingSession.questionIds.indexOf(b.id);
          });
          setSessionQuestions(sessionQs);
        } else {
          // Create new session
          const newSession = createExamSession(questions);
          setSession(newSession);
          setTimeRemaining(EXAM_CONFIG.durationMinutes * 60);

          // Load questions for new session
          const sessionQs = questions.filter(q => newSession.questionIds.includes(q.id));
          sessionQs.sort((a, b) => {
            return newSession.questionIds.indexOf(a.id) - newSession.questionIds.indexOf(b.id);
          });
          setSessionQuestions(sessionQs);
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // Timer
  useEffect(() => {
    if (loading || !session || session.submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          handleSubmitExam();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, session?.submitted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswer = useCallback((questionId: string, answer: Partial<any>) => {
    if (!session) return;
    const updated = updateAnswer(session, questionId, answer);
    setSession(updated);
  }, [session]);

  const handleToggleFlag = useCallback(() => {
    if (!session) return;
    const question = sessionQuestions[currentIndex];
    if (!question) return;

    const updated = sessionToggleFlag(session, question.id);
    setSession(updated);
  }, [session, sessionQuestions, currentIndex]);

  const handleSubmitExam = useCallback(() => {
    if (!session) return;

    const submitted = submitSession(session);
    setSession(submitted);

    const results = calculateResults(sessionQuestions, submitted);
    setResults(results);

    // Save exam attempt to user's history
    const authSession = getCurrentSession();
    if (authSession && submitted.submittedAt) {
      saveExamAttempt({
        userId: authSession.userId,
        username: authSession.username,
        startedAt: submitted.startedAt,
        completedAt: submitted.submittedAt,
        score: results.scoredMarks,
        percentage: results.percentage,
        mcqScore: results.mcqCorrect || 0,
        mcqPercentage: results.mcqPercentage || 0,
        planAttempted: results.planAnswered || 0,
        passed: results.overallPassed || false,
        mcqPassed: results.mcqPassed || false,
        topicBreakdown: results.topicBreakdown
      });
    }
  }, [session, sessionQuestions]);

  const calculateResults = (questions: Question[], session: ExamSession): ExamResults => {
    let correctAnswers = 0;
    let totalMarks = 0;
    let scoredMarks = 0;

    // Separate tracking for MCQ and Plan components
    let mcqCorrect = 0;
    let mcqTotal = 0;
    let mcqMarks = 0;
    let mcqScoredMarks = 0;

    let planTotal = 0;
    let planMarks = 0;

    const topicMap = new Map<string, { total: number; correct: number; totalMarks: number; scoredMarks: number }>();

    questions.forEach((q) => {
      totalMarks += q.marks;
      const answer = session.answers.get(q.id);

      // Track topic stats
      if (!topicMap.has(q.topic)) {
        topicMap.set(q.topic, { total: 0, correct: 0, totalMarks: 0, scoredMarks: 0 });
      }
      const topicStats = topicMap.get(q.topic)!;
      topicStats.total += 1;
      topicStats.totalMarks += q.marks;

      if (q.type === 'mcq') {
        mcqTotal += 1;
        mcqMarks += q.marks;

        // Check if answer is correct
        if (answer?.selectedOption === q.correctIndex) {
          correctAnswers += 1;
          mcqCorrect += 1;
          scoredMarks += q.marks;
          mcqScoredMarks += q.marks;
          topicStats.correct += 1;
          topicStats.scoredMarks += q.marks;
        }
      } else if (q.type === 'plan') {
        planTotal += 1;
        planMarks += q.marks;
        // Plan questions are manually assessed - track completion only
        if (answer?.drawing) {
          topicStats.correct += 1; // Mark as attempted
        }
      }
    });

    const topicBreakdown = Array.from(topicMap.entries()).map(([topic, stats]) => ({
      topic,
      total: stats.total,
      correct: stats.correct,
      percentage: stats.totalMarks > 0 ? (stats.scoredMarks / stats.totalMarks) * 100 : 0,
    }));

    const answeredCount = Array.from(session.answers.values()).filter(a =>
      a.selectedOption !== undefined || a.drawing !== undefined
    ).length;

    // Calculate component percentages
    const mcqPercentage = mcqMarks > 0 ? (mcqScoredMarks / mcqMarks) * 100 : 0;
    const overallPercentage = totalMarks > 0 ? (scoredMarks / totalMarks) * 100 : 0;

    // Check pass status
    const mcqPassed = mcqPercentage >= EXAM_CONFIG.mcqPassPercent;
    const overallPassed = EXAM_CONFIG.requireBothComponentsPass
      ? (mcqPassed && planTotal === 0) // Practice mode: verify MCQ only (plan is manually graded)
      : overallPercentage >= EXAM_CONFIG.passMarkPercent;

    return {
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      correctAnswers,
      totalMarks,
      scoredMarks,
      percentage: overallPercentage,
      topicBreakdown,
      timeTaken: EXAM_CONFIG.durationMinutes * 60 - timeRemaining,
      // Component-specific results
      mcqCorrect,
      mcqTotal,
      mcqPercentage,
      mcqPassed,
      planTotal,
      planAnswered: Array.from(session.answers.values()).filter(a => a.drawing !== undefined).length,
      requiresBothComponents: EXAM_CONFIG.requireBothComponentsPass,
      overallPassed,
    };
  };

  const handleExitToHome = () => {
    if (confirm('Are you sure you want to exit? Your progress will be lost.')) {
      clearSession();
      if (onExit) onExit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-200 text-xl">Loading exam questions...</div>
      </div>
    );
  }

  if (!session || sessionQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-200 text-xl">Failed to load exam. Please try again.</div>
      </div>
    );
  }

  if (session.submitted && results) {
    return (
      <ResultsPage
        results={results}
        questions={sessionQuestions}
        answers={session.answers}
        onExit={onExit}
      />
    );
  }

  const currentQuestion = sessionQuestions[currentIndex];
  const currentAnswer = currentQuestion ? session.answers.get(currentQuestion.id) : undefined;
  const progress = ((currentIndex + 1) / sessionQuestions.length) * 100;

  // Count answered questions
  const answeredCount = sessionQuestions.filter(q =>
    isQuestionAnswered(session, q.id, q.type)
  ).length;

  const flaggedCount = session.flagged.size;

  // Check if user has answered current question
  const hasAnsweredCurrent = currentQuestion ? isQuestionAnswered(session, currentQuestion.id, currentQuestion.type) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/90 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-100">
                {EXAM_CONFIG.examClass}
              </h1>
              <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                {currentQuestion?.difficulty}
              </Badge>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {EXAM_CONFIG.showTimer && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-5 h-5" />
                  <span className={`font-mono text-lg ${timeRemaining < 600 ? 'text-red-400' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{answeredCount}/{sessionQuestions.length}</span>
              </div>

              {EXAM_CONFIG.allowFlagging && (
                <div className="flex items-center gap-2 text-slate-300">
                  <Flag className="w-5 h-5 text-amber-400" />
                  <span>{flaggedCount}</span>
                </div>
              )}

              <Button
                onClick={() => setShowGrid(!showGrid)}
                variant="outline"
                className="border-slate-600 hover:bg-slate-700"
                size="sm"
              >
                {showGrid ? 'Hide Grid' : 'Show Grid'}
              </Button>

              {onExit && (
                <Button
                  onClick={handleExitToHome}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-700"
                  size="sm"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              )}
            </div>
          </div>

          <Progress value={progress} className="mt-4 h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Area */}
          <div className={`${showGrid ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <QuestionDisplay
              question={currentQuestion}
              answer={currentAnswer}
              onAnswer={handleAnswer}
              hasAnswered={hasAnsweredCurrent}
              shuffledOptions={session ? getShuffledOptions(session, currentQuestion.id) : undefined}
            />

            {/* Navigation */}
            <Card className="mt-6 bg-slate-800/50 border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <Button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    variant="outline"
                    className="border-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-2">
                    {EXAM_CONFIG.allowFlagging && (
                      <Button
                        onClick={handleToggleFlag}
                        variant={currentAnswer?.flagged ? 'default' : 'outline'}
                        className={currentAnswer?.flagged ? 'bg-amber-600 hover:bg-amber-700' : 'border-slate-600'}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        {currentAnswer?.flagged ? 'Flagged' : 'Flag'}
                      </Button>
                    )}

                    <Button
                      onClick={handleSubmitExam}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {currentIndex === sessionQuestions.length - 1 ? 'Submit Exam' : 'Finish Exam'}
                    </Button>
                  </div>

                  {currentIndex < sessionQuestions.length - 1 ? (
                    <Button
                      onClick={() => setCurrentIndex(currentIndex + 1)}
                      variant="outline"
                      className="border-slate-600"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <div className="w-24"></div>
                  )}
                </div>

                {timeRemaining < 600 && (
                  <Alert className="mt-4 border-red-700 bg-red-900/20">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-200">
                      Less than 10 minutes remaining!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar - Question Grid */}
          {showGrid && (
            <div className="lg:col-span-1">
              <QuestionGrid
                questions={sessionQuestions}
                answers={session.answers}
                currentIndex={currentIndex}
                onSelectQuestion={setCurrentIndex}
                flagged={session.flagged}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
