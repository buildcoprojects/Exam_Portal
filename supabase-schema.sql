-- Exam Portal Database Schema
-- Run this in Supabase SQL Editor to create tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Exam results table
CREATE TABLE IF NOT EXISTS exam_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  mcq_score INTEGER NOT NULL,
  mcq_total INTEGER NOT NULL,
  mcq_percentage NUMERIC(5,2) NOT NULL,
  plan_attempted INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  mcq_passed BOOLEAN NOT NULL,
  topic_breakdown JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_username ON exam_results(username);
CREATE INDEX IF NOT EXISTS idx_exam_results_completed_at ON exam_results(completed_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow anyone to read users (for login verification)
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for exam_results table
-- Allow anyone to read exam results (for dashboard display)
CREATE POLICY "Allow public read access to exam_results"
  ON exam_results FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow anyone to insert exam results (for saving results after exam)
CREATE POLICY "Allow public insert access to exam_results"
  ON exam_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Note: Default users (Jon, Ben, Sam) will be created by the application
-- on first initialization using bcrypt-hashed passwords
