# Netlify Deployment with Supabase

## 🚀 Complete Deployment Guide

This guide will walk you through deploying the exam portal to Netlify with Supabase database.

---

## Part 1: Set Up Supabase (5 minutes)

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Click **"Start your project"** → Sign up (free account)
3. Click **"New project"**
4. Fill in:
   - **Name**: `exam-portal` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location
5. Click **"Create new project"**
6. Wait 2-3 minutes for initialization

### Step 2: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open `supabase-schema.sql` from your project
4. Copy ALL the SQL code
5. Paste into Supabase SQL Editor
6. Click **RUN** (or Cmd/Ctrl + Enter)
7. You should see: **"Success. No rows returned"**

### Step 3: Get API Credentials

1. Click **Settings** (gear icon in sidebar)
2. Click **API**
3. Find and copy these two values:
   - **Project URL** (under "Project URL")
     - Example: `https://abcdefgh12345678.supabase.co`
   - **anon public** key (under "Project API keys")
     - Long JWT token starting with `eyJ...`

**Save these values** - you'll need them in the next steps!

---

## Part 2: Configure Local Environment

### Step 4: Set Local Environment Variables

1. In your exam-portal project, create `.env.local` file:

```bash
cd exam-portal
touch .env.local
```

2. Edit `.env.local` and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here
```

3. Replace with your actual values from Step 3

### Step 5: Test Locally

```bash
bun install  # Install dependencies
bun run dev  # Start dev server
```

Visit http://localhost:3000

You should see:
- Login page with Jon, Ben, Sam credentials
- No errors in browser console
- Able to login as Jon (`Jon` / `JonAdmin`)

If you see errors, check:
- `.env.local` has correct values
- Supabase project is active (not paused)
- SQL schema ran successfully

---

## Part 3: Deploy to Netlify

### Step 6: Push to GitHub

```bash
git add -A
git commit -m "Add Supabase database integration"
git push origin main
```

### Step 7: Configure Netlify Environment Variables

1. Go to https://app.netlify.com
2. Select your **exam-portal** site
3. Click **Site settings**
4. Click **Environment variables** (in left sidebar)
5. Click **Add a variable** → **Add variable**

Add these two variables:

**Variable 1:**
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: Your Supabase project URL
- **Scopes**: Same value for all deploy contexts
- Click **Create variable**

**Variable 2:**
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your Supabase anon key
- **Scopes**: Same value for all deploy contexts
- Click **Create variable**

### Step 8: Deploy

1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait 2-3 minutes for build to complete
4. Click on the deploy to see the live URL

---

## Part 4: Verify Deployment

### Step 9: Test Live Site

Visit your Netlify URL (e.g., `https://your-site.netlify.app`)

**Test Checklist:**

- [ ] Login page loads without errors
- [ ] Can login as Jon (`Jon` / `JonAdmin`)
- [ ] Dashboard loads and shows user info
- [ ] Can access Admin Panel (Jon only)
- [ ] Can start practice exam
- [ ] Can complete exam and see results
- [ ] Results appear in dashboard history
- [ ] Logout and login as Ben (`Ben` / `Buildcoben`)
- [ ] Ben's dashboard is empty (no history yet)
- [ ] Ben can take exam
- [ ] Ben's results persist after logout/login

### Step 10: Verify Database

1. Go back to Supabase dashboard
2. Click **Table Editor**
3. Select **users** table
   - You should see 3 users: Jon, Ben, Sam
4. Select **exam_results** table
   - You should see exam attempts from your tests

---

## 🔍 Troubleshooting

### "Database not configured" Error

**Cause**: Environment variables not set or incorrect

**Fix**:
1. Check Netlify environment variables are set correctly
2. Trigger new deployment
3. Check browser console for specific error
4. Verify Supabase URL and key are correct

### Users Not Created

**Cause**: SQL schema not run or failed

**Fix**:
1. Go to Supabase SQL Editor
2. Re-run `supabase-schema.sql`
3. Check Supabase **Logs** for errors
4. Verify tables exist in Table Editor

### Login Fails

**Cause**: Incorrect credentials or database connection issue

**Fix**:
1. Use exact credentials: `Jon` / `JonAdmin` (case-sensitive)
2. Check browser console for errors
3. Verify Supabase project is active (not paused)
4. Check Supabase **Logs** → **Auth Logs**

### Results Not Saving

**Cause**: RLS policies not created

**Fix**:
1. Verify RLS policies were created (run schema again)
2. Check Supabase **Authentication** → **Policies**
3. Ensure policies exist for `exam_results` table

---

## 📊 Pre-configured Accounts

These accounts are automatically created on first app initialization:

| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| Jon | JonAdmin | admin | Administrator access, stats view |
| Ben | Buildcoben | user | Student account |
| Sam | Buildcosam | user | Student account |

**Note**: Passwords are hashed with bcrypt before storage in database.

---

## 🔐 Security Best Practices

### Environment Variables

✅ **DO**:
- Store Supabase credentials in environment variables
- Use different projects for dev/production
- Keep `.env.local` in `.gitignore`

❌ **DON'T**:
- Commit `.env.local` to Git
- Share your anon key publicly (it's safe for client-side, but keep it private)
- Use service role key in frontend code

### Database Security

- Supabase RLS (Row Level Security) is enabled
- Users table: Read-only access for login verification
- Exam results: Public read/insert for app functionality
- Admin operations use role checks in application layer

---

## 🆘 Need Help?

### Debug Commands

**Browser Console** (F12):
```javascript
// Check if Supabase is configured
window.debugAuthDb()

// Check localStorage (session only)
localStorage.getItem('exam_portal_auth_session')
```

**Supabase Dashboard**:
- **Logs** → View API requests and errors
- **Auth Logs** → View login attempts
- **Table Editor** → View/edit data directly
- **SQL Editor** → Run custom queries

### Common Issues

1. **"NetworkError"**: Check Supabase URL is correct
2. **"Invalid API key"**: Check anon key is correct
3. **"relation does not exist"**: Run SQL schema
4. **"RLS policy violation"**: Re-run SQL schema
5. **"Project paused"**: Reactivate in Supabase dashboard

---

## 📝 Deployment Checklist

Before going live:

- [ ] Supabase project created
- [ ] Database tables created (SQL schema run)
- [ ] Supabase credentials saved
- [ ] Local `.env.local` configured
- [ ] Tested locally (can login and take exam)
- [ ] Netlify environment variables set
- [ ] Code pushed to GitHub
- [ ] Netlify deployment successful
- [ ] Tested live site (all 3 accounts work)
- [ ] Verified database has users
- [ ] Verified exam results save to database

---

## 🎉 Success!

Once all checkboxes are complete, your exam portal is live with:
- ✅ Persistent database storage
- ✅ Pre-configured user accounts
- ✅ Server-side authentication
- ✅ Exam history tracking
- ✅ Multi-device access

**Live URL**: https://your-site.netlify.app
**Supabase Dashboard**: https://app.supabase.com

---

**Last Updated**: December 10, 2025
**Status**: Ready for Deployment ✅
