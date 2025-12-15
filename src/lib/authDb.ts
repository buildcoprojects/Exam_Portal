/**
 * Database-backed Authentication System
 * Replaces localStorage with Supabase for persistent server-side storage
 */

import { supabase, isSupabaseConfigured, type DbUser, type DbExamResult } from './supabase';
import bcrypt from 'bcryptjs';

const DEBUG = true;

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[AUTH_DB] ${message}`, data || '');
  }
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  loginAt: number;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  username: string;
  startedAt: number;
  completedAt: number;
  score: number;
  percentage: number;
  mcqScore: number;
  mcqPercentage: number;
  planAttempted: number;
  passed: boolean;
  mcqPassed: boolean;
  topicBreakdown: { topic: string; correct: number; total: number; percentage: number }[];
}

const AUTH_SESSION_KEY = 'exam_portal_auth_session';

// Pre-defined accounts
const DEFAULT_ACCOUNTS = [
  { username: 'Jon', password: 'JonAdmin', role: 'admin' as const },
  { username: 'Ben', password: 'Buildcoben', role: 'user' as const },
  { username: 'Sam', password: 'Buildcosam', role: 'user' as const },
];

/**
 * Initialize default accounts in database
 */
export async function initializeDefaultAccounts(): Promise<void> {
  debugLog('initializeDefaultAccounts: Starting...');

  if (!isSupabaseConfigured()) {
    console.error('⚠️ Supabase is not configured. Please set environment variables.');
    console.error('See .env.local.example for instructions.');
    return;
  }

  try {
    // Check which accounts already exist
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('username')
      .in('username', DEFAULT_ACCOUNTS.map(a => a.username));

    if (fetchError) {
      console.error('Error fetching existing users:', fetchError);
      return;
    }

    const existingUsernames = new Set(existingUsers?.map(u => u.username) || []);
    debugLog(`Found ${existingUsernames.size} existing default accounts`);

    // Create missing accounts
    for (const account of DEFAULT_ACCOUNTS) {
      if (existingUsernames.has(account.username)) {
        debugLog(`Account ${account.username} already exists, skipping`);
        continue;
      }

      debugLog(`Creating account for ${account.username}...`);

      // Hash password
      const passwordHash = await bcrypt.hash(account.password, 10);

      // Insert into database
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username: account.username,
          password_hash: passwordHash,
          role: account.role,
        });

      if (insertError) {
        console.error(`Failed to create account for ${account.username}:`, insertError);
      } else {
        debugLog(`✅ Created account for ${account.username}`);
      }
    }

    debugLog('initializeDefaultAccounts: Complete');
  } catch (error) {
    console.error('Error initializing default accounts:', error);
  }
}

/**
 * Login user
 */
export async function login(username: string, password: string): Promise<{ success: boolean; error?: string; session?: AuthSession }> {
  debugLog(`login: Attempting login for "${username}"`);

  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured. Please contact administrator.' };
  }

  try {
    // Fetch user from database
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);

    if (fetchError) {
      console.error('Database error during login:', fetchError);
      return { success: false, error: 'Database error. Please try again.' };
    }

    if (!users || users.length === 0) {
      debugLog(`login: User "${username}" not found`);
      return { success: false, error: 'Invalid username or password' };
    }

    const user = users[0] as DbUser;
    debugLog(`login: User "${username}" found in database`);

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      debugLog(`login: Password verification failed for "${username}"`);
      return { success: false, error: 'Invalid username or password' };
    }

    debugLog(`login: Password verified for "${username}"`);

    // Create session
    const session: AuthSession = {
      userId: user.id,
      username: user.username,
      role: user.role,
      loginAt: Date.now(),
    };

    saveAuthSession(session);
    debugLog(`login: Session created for "${username}"`, session);

    return { success: true, session };
  } catch (error) {
    console.error('Error during login:', error);
    return { success: false, error: 'An error occurred during login' };
  }
}

/**
 * Logout current user
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_SESSION_KEY);
  debugLog('logout: Session cleared');
}

/**
 * Get current auth session
 */
export function getCurrentSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTH_SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load auth session:', error);
    return null;
  }
}

/**
 * Save auth session (in browser only)
 */
function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    debugLog('saveAuthSession: Session saved to browser');
  } catch (error) {
    console.error('Failed to save auth session:', error);
  }
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  const session = getCurrentSession();
  return session?.role === 'admin';
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  if (!isAdmin()) return [];
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return (data || []).map(u => ({
      id: u.id,
      username: u.username,
      role: u.role as 'admin' | 'user',
      createdAt: u.created_at,
    }));
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
}

/**
 * Save exam attempt to database
 */
export async function saveExamAttempt(attempt: Omit<ExamAttempt, 'id'>): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.error('Cannot save exam attempt: Database not configured');
    return;
  }

  debugLog('saveExamAttempt: Saving to database...', { username: attempt.username });

  try {
    const { error } = await supabase
      .from('exam_results')
      .insert({
        user_id: attempt.userId,
        username: attempt.username,
        started_at: new Date(attempt.startedAt).toISOString(),
        completed_at: new Date(attempt.completedAt).toISOString(),
        score: attempt.score,
        total_marks: attempt.mcqScore + (attempt.planAttempted * 25), // Approximate total
        percentage: attempt.percentage,
        mcq_score: attempt.mcqScore,
        mcq_total: 50, // Fixed for this exam
        mcq_percentage: attempt.mcqPercentage,
        plan_attempted: attempt.planAttempted,
        passed: attempt.passed,
        mcq_passed: attempt.mcqPassed,
        topic_breakdown: attempt.topicBreakdown,
      });

    if (error) {
      console.error('Error saving exam attempt:', error);
    } else {
      debugLog('saveExamAttempt: ✅ Saved to database');
    }
  } catch (error) {
    console.error('Error in saveExamAttempt:', error);
  }
}

/**
 * Get user's exam attempts from database
 */
export async function getUserExamAttempts(userId: string): Promise<ExamAttempt[]> {
  if (!isSupabaseConfigured()) return [];

  debugLog('getUserExamAttempts: Fetching from database...', { userId });

  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching exam attempts:', error);
      return [];
    }

    const attempts = (data || []).map((r: DbExamResult) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      startedAt: new Date(r.started_at).getTime(),
      completedAt: new Date(r.completed_at).getTime(),
      score: r.score,
      percentage: Number(r.percentage),
      mcqScore: r.mcq_score,
      mcqPercentage: Number(r.mcq_percentage),
      planAttempted: r.plan_attempted,
      passed: r.passed,
      mcqPassed: r.mcq_passed,
      topicBreakdown: r.topic_breakdown,
    }));

    debugLog(`getUserExamAttempts: Found ${attempts.length} attempts`);
    return attempts;
  } catch (error) {
    console.error('Error in getUserExamAttempts:', error);
    return [];
  }
}

/**
 * Get all exam attempts (admin only)
 */
export async function getAllExamAttempts(): Promise<ExamAttempt[]> {
  if (!isAdmin()) return [];
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching all exam attempts:', error);
      return [];
    }

    return (data || []).map((r: DbExamResult) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      startedAt: new Date(r.started_at).getTime(),
      completedAt: new Date(r.completed_at).getTime(),
      score: r.score,
      percentage: Number(r.percentage),
      mcqScore: r.mcq_score,
      mcqPercentage: Number(r.mcq_percentage),
      planAttempted: r.plan_attempted,
      passed: r.passed,
      mcqPassed: r.mcq_passed,
      topicBreakdown: r.topic_breakdown,
    }));
  } catch (error) {
    console.error('Error in getAllExamAttempts:', error);
    return [];
  }
}

/**
 * Debug function for troubleshooting
 */
export async function debugAuth() {
  console.log('=== EXAM PORTAL AUTH DEBUG (DATABASE) ===');

  console.log('\n🔧 Supabase Configuration:');
  console.log('  Configured:', isSupabaseConfigured());
  console.log('  URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');

  const session = getCurrentSession();
  console.log('\n🔐 Current Session:', session || 'Not logged in');

  if (isSupabaseConfigured()) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('username, role')
        .order('username');

      if (error) {
        console.error('  Error fetching users:', error);
      } else {
        console.log(`\n📊 Total Users in Database: ${users?.length || 0}`);
        users?.forEach(u => {
          console.log(`  - ${u.username} (${u.role})`);
        });
      }

      if (session) {
        const { data: attempts, error: attemptsError } = await supabase
          .from('exam_results')
          .select('id')
          .eq('user_id', session.userId);

        if (!attemptsError) {
          console.log(`\n📝 Exam Attempts for ${session.username}: ${attempts?.length || 0}`);
        }
      }
    } catch (error) {
      console.error('Error during debug:', error);
    }
  } else {
    console.log('\n⚠️ Supabase not configured - see .env.local.example');
  }

  console.log('\n=== END DEBUG ===');
}

// Expose to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugAuthDb = debugAuth;
}
