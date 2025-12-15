# Supabase Database Setup Guide

## 🎯 Overview

This exam portal now uses **Supabase** (cloud PostgreSQL database) instead of browser localStorage for persistent, server-side storage of:
- User credentials (Jon, Ben, Sam)
- Exam results and history
- Session management

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click **"Start your project"**
3. Sign up with GitHub or email
4. Create a new project:
   - **Name**: exam-portal (or any name)
   - **Database Password**: (save this, you'll need it)
   - **Region**: Choose closest to you
5. Wait 2-3 minutes for project to initialize

### Step 2: Get API Credentials

1. In your Supabase dashboard, click **Settings** (gear icon)
2. Click **API** in the sidebar
3. Copy these two values:
   - **Project URL** (looks like: `https://abcd1234.supabase.co`)
   - **anon/public key** (long JWT token starting with `eyJ...`)

### Step 3: Configure Environment Variables

1. In your exam-portal project, create `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. Replace with your actual values from Step 2

### Step 4: Create Database Tables

1. In Supabase dashboard, click **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

### Step 5: Deploy to Netlify

1. Go to Netlify dashboard
2. Select your exam-portal site
3. Go to **Site settings** → **Environment variables**
4. Add the same two variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Click **Save**
6. Go to **Deploys** → **Trigger deploy** → **Deploy site**

---

## ✅ Verify Setup

### Test Locally:

```bash
cd exam-portal
bun run dev
```

Open http://localhost:3000

You should see:
- Login page with Jon, Ben, Sam credentials
- No error messages in console
- Able to login as any user

### Test on Netlify:

Visit your Netlify URL and:
1. Login as Jon (username: `Jon`, password: `JonAdmin`)
2. Check dashboard loads
3. Take a practice exam
4. Verify results appear in history
5. Logout and login as Ben - verify history persists

---

## 👥 Pre-configured Accounts

The application automatically creates these accounts on first run:

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| Jon | JonAdmin | admin | Administrator access |
| Ben | Buildcoben | user | Student user |
| Sam | Buildcosam | user | Student user |

**Note**: Passwords are hashed with bcrypt before storage.

---

## 🗄️ Database Schema

### `users` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| username | TEXT | Unique username |
| password_hash | TEXT | Bcrypt hashed password |
| role | TEXT | 'admin' or 'user' |
| created_at | TIMESTAMP | Account creation time |

### `exam_results` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| username | TEXT | Username (for quick lookup) |
| started_at | TIMESTAMP | Exam start time |
| completed_at | TIMESTAMP | Exam completion time |
| score | INTEGER | Total score |
| total_marks | INTEGER | Max possible marks |
| percentage | NUMERIC | Score percentage |
| mcq_score | INTEGER | MCQ component score |
| mcq_total | INTEGER | MCQ total marks |
| mcq_percentage | NUMERIC | MCQ percentage |
| plan_attempted | INTEGER | Plan questions attempted |
| passed | BOOLEAN | Overall pass status |
| mcq_passed | BOOLEAN | MCQ component pass status |
| topic_breakdown | JSONB | Detailed topic scores |
| created_at | TIMESTAMP | Record creation time |

---

## 🔍 Troubleshooting

### Error: "Database not configured"

**Cause**: Environment variables not set

**Solution**:
1. Check `.env.local` exists and has correct values
2. Restart dev server: `bun run dev`
3. On Netlify: Check environment variables in site settings

### Error: "relation 'users' does not exist"

**Cause**: Database tables not created

**Solution**:
1. Go to Supabase SQL Editor
2. Run `supabase-schema.sql` script
3. Verify tables exist in **Table Editor**

### Users Not Appearing

**Cause**: Tables exist but accounts not initialized

**Solution**:
1. Check browser console for errors
2. Verify Supabase URL and key are correct
3. Check Supabase **Logs** for API errors
4. Run debug: `window.debugAuthDb()` in console

### Login Fails

**Cause**: Incorrect credentials or database connection issue

**Solution**:
1. Try: Jon / JonAdmin (exact case)
2. Check browser console for errors
3. Verify Supabase project is active (not paused)
4. Check Supabase **Logs** → **Auth Logs**

### Results Not Saving

**Cause**: Row Level Security (RLS) policies blocking insert

**Solution**:
1. Verify RLS policies were created (in schema)
2. Check Supabase **Authentication** → **Policies**
3. Ensure "Allow public insert" policy exists
4. Check browser console for errors

---

## 🔐 Security

### Row Level Security (RLS)

The database uses Supabase RLS policies to control access:

- **Users table**: Public read access (for login)
- **Exam results**: Public read and insert (for dashboard & saving)

### Password Storage

- All passwords are hashed with **bcrypt** (10 rounds)
- Never stored in plain text
- Hashed server-side before database insert

### API Security

- Uses Supabase **anon key** (safe for client-side)
- Row-level policies prevent unauthorized modifications
- No service role key in code (only for admin operations)

---

## 📊 View Data in Supabase

### See All Users:

1. Go to **Table Editor**
2. Select **users** table
3. You should see Jon, Ben, Sam

### See Exam Results:

1. Go to **Table Editor**
2. Select **exam_results** table
3. Click any row to see full JSON details

### Query Database:

Use **SQL Editor** to run custom queries:

```sql
-- Count total exam attempts
SELECT COUNT(*) FROM exam_results;

-- Get Ben's exam history
SELECT * FROM exam_results
WHERE username = 'Ben'
ORDER BY completed_at DESC;

-- Average pass rate
SELECT
  COUNT(CASE WHEN passed THEN 1 END)::FLOAT / COUNT(*) * 100 as pass_rate
FROM exam_results;
```

---

## 🔄 Migrating from localStorage

If you have existing data in localStorage:

**Old data is not automatically migrated** - it stays in browser only.

To preserve old results:
1. Export data from browser console before upgrading
2. Manually insert into Supabase via SQL Editor
3. Or, retake exams to save results to database

---

## 💰 Supabase Pricing

**Free Tier** (no credit card required):
- Up to 500 MB database
- 50,000 monthly active users
- Unlimited API requests
- 2 GB bandwidth

This is more than enough for this exam portal!

---

## 📝 Environment Variables Summary

**Required**:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key

**Local Development**: `.env.local` file
**Netlify Production**: Site settings → Environment variables

---

## 🆘 Support

If you encounter issues:

1. Check Supabase **Logs** for errors
2. Run `window.debugAuthDb()` in browser console
3. Verify environment variables are set correctly
4. Check that database tables exist
5. Review Supabase documentation: https://supabase.com/docs

---

**Last Updated**: December 10, 2025
**Supabase Version**: 2.x
**Status**: Production Ready ✅
