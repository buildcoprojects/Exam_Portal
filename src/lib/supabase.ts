/**
 * Supabase Client Configuration
 * Server-side database for user authentication and exam results
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables are missing!');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We'll handle sessions ourselves
    autoRefreshToken: false,
  },
});

/**
 * Database Types
 */

export interface DbUser {
  id: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface DbExamResult {
  id: string;
  user_id: string;
  username: string;
  started_at: string;
  completed_at: string;
  score: number;
  total_marks: number;
  percentage: number;
  mcq_score: number;
  mcq_total: number;
  mcq_percentage: number;
  plan_attempted: number;
  passed: boolean;
  mcq_passed: boolean;
  topic_breakdown: any; // JSON field
  created_at: string;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder_key_replace_with_real_key'
  );
}
