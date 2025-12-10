'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import ExamInterface from '@/components/ExamInterface';
import LoginPage from '@/components/LoginPage';
import UserDashboard from '@/components/UserDashboard';
import AdminPanel from '@/components/AdminPanel';
import { EXAM_CONFIG } from '@/lib/examConfig';
import { getCurrentSession, initializeDefaultAdmin } from '@/lib/auth';

type AppView = 'login' | 'dashboard' | 'exam' | 'admin';

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize admin account on first load
    const init = async () => {
      await initializeDefaultAdmin();

      // Check if user is already logged in
      const session = getCurrentSession();
      if (session) {
        setCurrentView('dashboard');
      }

      setIsInitialized(true);
    };

    init();
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-200 text-xl">Loading...</div>
      </div>
    );
  }

  if (currentView === 'login') {
    return <LoginPage onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'dashboard') {
    return (
      <UserDashboard
        onStartExam={() => setCurrentView('exam')}
        onLogout={() => setCurrentView('login')}
        onViewAdmin={() => setCurrentView('admin')}
      />
    );
  }

  if (currentView === 'admin') {
    return <AdminPanel onBackToDashboard={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'exam') {
    return <ExamInterface onExit={() => setCurrentView('dashboard')} />;
  }

  // Fallback - should not reach here
  return null;
}
