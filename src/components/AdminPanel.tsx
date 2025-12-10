'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  getAllUsers,
  getAllExamAttempts,
  registerUser,
  deleteUser,
  generatePassword,
  type User,
  type ExamAttempt
} from '@/lib/auth';

interface AdminPanelProps {
  onBackToDashboard: () => void;
}

export default function AdminPanel({ onBackToDashboard }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(getAllUsers());
    setAttempts(getAllExamAttempts());
  };

  const handleCreateUser = async () => {
    setCreateError('');
    setCreateSuccess('');

    if (!newUsername.trim()) {
      setCreateError('Username is required');
      return;
    }

    if (!newPassword.trim()) {
      setCreateError('Password is required');
      return;
    }

    console.log('[AdminPanel] Creating user:', newUsername.trim());
    const result = await registerUser(newUsername.trim(), newPassword, 'user');

    if (result.success) {
      console.log('[AdminPanel] User created successfully:', newUsername);
      setCreateSuccess(`✅ User "${newUsername}" created successfully! They can now login with username "${newUsername}" and the password you set.`);
      setNewUsername('');
      setNewPassword('');
      loadData();
      setTimeout(() => {
        setShowCreateUser(false);
        setCreateSuccess('');
      }, 3000);
    } else {
      console.error('[AdminPanel] Failed to create user:', result.error);
      setCreateError(result.error || 'Failed to create user');
    }
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (username === 'Buildco_admin') {
      alert('Cannot delete the admin account');
      return;
    }

    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      const success = deleteUser(userId);
      if (success) {
        loadData();
      }
    }
  };

  const handleGeneratePassword = () => {
    const password = generatePassword();
    setNewPassword(password);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const createBenAccount = async () => {
    const password = generatePassword();
    console.log('[AdminPanel] Creating account for Ben with password:', password);
    const result = await registerUser('Ben', password, 'user');

    if (result.success) {
      console.log('[AdminPanel] Ben account created successfully');
      alert(`✅ Account created for Ben!\n\nUsername: Ben\nPassword: ${password}\n\n⚠️ IMPORTANT: Save this password now!\n\nYou can now logout and login as Ben using these credentials.`);
      loadData();
    } else {
      console.error('[AdminPanel] Failed to create Ben account:', result.error);
      alert(`❌ Failed to create account: ${result.error}`);
    }
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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
                  User Management & System Overview
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={createBenAccount}
                  variant="outline"
                  className="border-purple-600 text-purple-400 hover:bg-purple-900/20"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account for Ben
                </Button>
                <Button
                  onClick={() => setShowCreateUser(!showCreateUser)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
                <Button
                  onClick={onBackToDashboard}
                  variant="outline"
                  className="border-slate-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Create User Form */}
        {showCreateUser && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Create New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {createError && (
                <Alert className="border-red-700 bg-red-900/20">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">{createError}</AlertDescription>
                </Alert>
              )}

              {createSuccess && (
                <Alert className="border-emerald-700 bg-emerald-900/20">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <AlertDescription className="text-emerald-200">{createSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username" className="text-slate-200">
                    Username
                  </Label>
                  <Input
                    id="new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-slate-900/50 border-slate-600 text-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-slate-200">
                    Password
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-password"
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter or generate password"
                      className="bg-slate-900/50 border-slate-600 text-slate-100"
                    />
                    <Button
                      onClick={handleGeneratePassword}
                      variant="outline"
                      className="border-slate-600"
                      type="button"
                    >
                      Generate
                    </Button>
                    <Button
                      onClick={handleCopyPassword}
                      variant="outline"
                      className="border-slate-600"
                      type="button"
                      disabled={!newPassword}
                    >
                      {copiedPassword ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateUser}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Create User
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateUser(false);
                    setNewUsername('');
                    setNewPassword('');
                    setCreateError('');
                    setCreateSuccess('');
                  }}
                  variant="outline"
                  className="border-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

                      {user.username !== 'Buildco_admin' && (
                        <Button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
