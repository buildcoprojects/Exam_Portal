'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  ArrowLeft,
  CheckCircle2,
  BarChart3
} from 'lucide-react';
import {
  getAllUsers,
  getAllExamAttempts,
  type User,
  type ExamAttempt
} from '@/lib/authDb';

interface AdminPanelProps {
  onBackToDashboard: () => void;
}

export default function AdminPanel({ onBackToDashboard }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersData, attemptsData] = await Promise.all([
      getAllUsers(),
      getAllExamAttempts()
    ]);
    setUsers(usersData);
    setAttempts(attemptsData);
    setLoading(false);
  };

  // Calculate user stats
  const getUserStats = (userId: string) => {
    const userAttempts = attempts.filter(a => a.userId === userId);
    const totalAttempts = userAttempts.length;
    const passed = userAttempts.filter(a => a.passed).length;
    const avgScore = userAttempts.length > 0
      ? userAttempts.reduce((sum, a) => sum + a.percentage, 0) / userAttempts.length
      : 0;

    return { totalAttempts, passed, avgScore };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-200 text-xl">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-2xl text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  Admin Panel
                </CardTitle>
                <CardDescription className="text-slate-400">
                  System Overview & User Statistics
                </CardDescription>
              </div>

              <Button
                onClick={onBackToDashboard}
                variant="outline"
                className="border-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-100">{users.length}</div>
                <div className="text-sm text-slate-400 mt-1">Total Users</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{attempts.length}</div>
                <div className="text-sm text-slate-400 mt-1">Total Exam Attempts</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {attempts.filter(a => a.passed).length}
                </div>
                <div className="text-sm text-slate-400 mt-1">Total Passes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users ({users.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Pre-configured accounts - Jon (Admin), Ben (User), Sam (User)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => {
                const stats = getUserStats(user.id);
                return (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border-2 border-slate-600 bg-slate-900/30"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-200 text-lg">
                            {user.username}
                          </span>
                          <Badge variant="outline" className={
                            user.role === 'admin'
                              ? 'border-purple-500 text-purple-400'
                              : 'border-blue-500 text-blue-400'
                          }>
                            {user.role}
                          </Badge>
                          {stats.passed > 0 && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Created:</span>
                            <span className="ml-2 text-slate-200">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Attempts:</span>
                            <span className="ml-2 text-slate-200">{stats.totalAttempts}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Passed:</span>
                            <span className="ml-2 text-slate-200">{stats.passed}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Avg Score:</span>
                            <span className="ml-2 text-slate-200">
                              {stats.avgScore.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Recent Exam Attempts</CardTitle>
            <CardDescription className="text-slate-400">
              Latest 10 exam completions across all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attempts.slice(0, 10).map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-200">{attempt.username}</span>
                    <Badge className={attempt.passed ? 'bg-emerald-600' : 'bg-red-600'}>
                      {attempt.passed ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-300">{attempt.percentage.toFixed(1)}%</span>
                    <span className="text-slate-400">
                      {new Date(attempt.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {attempts.length === 0 && (
                <p className="text-center text-slate-400 py-4">No exam attempts yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
