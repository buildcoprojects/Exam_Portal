'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  Clock,
  TrendingUp,
  LogOut,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  BarChart3,
  User
} from 'lucide-react';
import { getCurrentSession, logout, getUserExamAttempts, type ExamAttempt } from '@/lib/auth';

interface UserDashboardProps {
  onStartExam: () => void;
  onLogout: () => void;
  onViewAdmin?: () => void;
}

export default function UserDashboard({ onStartExam, onLogout, onViewAdmin }: UserDashboardProps) {
  const [session, setSession] = useState(getCurrentSession());
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);

  useEffect(() => {
    const currentSession = getCurrentSession();
    setSession(currentSession);

    if (currentSession) {
      const userAttempts = getUserExamAttempts(currentSession.userId);
      setAttempts(userAttempts);
    }
  }, []);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: number, end: number) => {
    const minutes = Math.floor((end - start) / 1000 / 60);
    return `${minutes} min`;
  };

  // Calculate performance stats
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(a => a.passed).length;
  const averageScore = attempts.length > 0
    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
    : 0;
  const bestScore = attempts.length > 0
    ? Math.max(...attempts.map(a => a.percentage))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-slate-100">
                    {session?.username}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {session?.role === 'admin' ? 'Administrator' : 'Student'}
                  </CardDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session?.role === 'admin' && onViewAdmin && (
                  <Button
                    onClick={onViewAdmin}
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  onClick={onStartExam}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Start New Exam
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-slate-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-100">{totalAttempts}</div>
                <div className="text-sm text-slate-400 mt-1">Total Attempts</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">{passedAttempts}</div>
                <div className="text-sm text-slate-400 mt-1">Passed</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{averageScore.toFixed(1)}%</div>
                <div className="text-sm text-slate-400 mt-1">Average Score</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{bestScore.toFixed(1)}%</div>
                <div className="text-sm text-slate-400 mt-1">Best Score</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam History */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Exam History
            </CardTitle>
            <CardDescription className="text-slate-400">
              {attempts.length === 0 ? 'No exam attempts yet' : `${attempts.length} attempt${attempts.length === 1 ? '' : 's'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attempts.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No exam attempts yet. Start your first exam!</p>
                <Button
                  onClick={onStartExam}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Take Your First Exam
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    onClick={() => setSelectedAttempt(selectedAttempt?.id === attempt.id ? null : attempt)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedAttempt?.id === attempt.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {attempt.passed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-semibold text-slate-200">
                            {formatDate(attempt.completedAt)}
                          </span>
                          <Badge className={attempt.passed ? 'bg-emerald-600' : 'bg-red-600'}>
                            {attempt.passed ? 'PASSED' : 'NOT PASSED'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Overall:</span>
                            <span className="ml-2 font-semibold text-slate-200">
                              {attempt.percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">MCQ:</span>
                            <span className="ml-2 font-semibold text-slate-200">
                              {attempt.mcqPercentage.toFixed(1)}%
                            </span>
                            {attempt.mcqPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400 inline ml-1" />}
                          </div>
                          <div>
                            <span className="text-slate-400">Score:</span>
                            <span className="ml-2 font-semibold text-slate-200">
                              {attempt.score} marks
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Duration:</span>
                            <span className="ml-2 font-semibold text-slate-200">
                              {formatDuration(attempt.startedAt, attempt.completedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedAttempt?.id === attempt.id && (
                          <div className="mt-4 pt-4 border-t border-slate-600">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">Topic Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {attempt.topicBreakdown.map((topic) => (
                                <div
                                  key={topic.topic}
                                  className="flex items-center justify-between text-sm bg-slate-900/50 rounded p-2"
                                >
                                  <span className="text-slate-300">{topic.topic.replace(/_/g, ' ')}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400">
                                      {topic.correct}/{topic.total}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs ${
                                        topic.percentage >= 70
                                          ? 'border-emerald-500 text-emerald-400'
                                          : 'border-red-500 text-red-400'
                                      }`}
                                    >
                                      {topic.percentage.toFixed(0)}%
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Trend */}
        {attempts.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-2">
                {attempts.slice(-10).reverse().map((attempt, index) => {
                  const height = (attempt.percentage / 100) * 100;
                  return (
                    <div key={attempt.id} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className={`w-full rounded-t transition-all ${
                          attempt.passed ? 'bg-emerald-600' : 'bg-red-600'
                        }`}
                        style={{ height: `${height}%` }}
                      />
                      <div className="text-xs text-slate-400">{attempts.length - index}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center text-sm text-slate-400">
                Last {Math.min(10, attempts.length)} attempts
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
