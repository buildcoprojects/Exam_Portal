# 🧪 LIVE TESTING GUIDE

## ✅ Setup Complete - Now Testing!

All prerequisites are done:
- ✅ Supabase database created
- ✅ Netlify environment variables configured
- ✅ Browser cache cleared
- ✅ Latest code deployed

---

## 🎯 Testing Sequence

### Test 1: Verify Login Page

**What to check**:
- [ ] Login page loads without errors
- [ ] Shows "Pre-configured Accounts:"
- [ ] Lists: Jon / JonAdmin
- [ ] Lists: Ben / Buildcoben
- [ ] Lists: Sam / Buildcosam
- [ ] Debug button is visible

**Open browser console (F12)** and check:
- [ ] No red errors
- [ ] Should see Supabase configuration logs

---

### Test 2: Jon (Admin) - Complete Workflow

#### 2.1 Login
```
Username: Jon
Password: JonAdmin
```

**Expected**:
- [ ] Login successful (no errors)
- [ ] Redirects to dashboard
- [ ] Header shows "Jon"
- [ ] Role shows "Administrator"
- [ ] "Admin Panel" button visible
- [ ] Dashboard shows 0 attempts (if first time)

**Console check**:
```
[AUTH_DB] login: Attempting login for "Jon"
[AUTH_DB] login: User "Jon" found in database
[AUTH_DB] login: Password verified for "Jon"
[AUTH_DB] login: Session created for "Jon"
```

#### 2.2 Take Practice Exam

- [ ] Click "Start New Exam"
- [ ] Timer starts (120:00)
- [ ] Questions display correctly
- [ ] Can select answers
- [ ] Can flag questions
- [ ] Answer at least 15-20 questions
- [ ] Click "Finish Exam"

**Console check**:
- [ ] No errors during exam
- [ ] Questions load properly

#### 2.3 View Results

**Expected**:
- [ ] Results page displays
- [ ] Shows total score and percentage
- [ ] Shows MCQ score and percentage
- [ ] Shows pass/fail status
- [ ] Topic breakdown visible
- [ ] Click "Back to Dashboard"

**Console check**:
```
[AUTH_DB] saveExamAttempt: Saving to database...
[AUTH_DB] saveExamAttempt: ✅ Saved to database
```

#### 2.4 Verify Dashboard Update

**Expected**:
- [ ] Dashboard now shows "1 Total Attempts"
- [ ] Exam appears in "Exam History"
- [ ] Date and score match results
- [ ] Click exam to expand details
- [ ] Topic breakdown visible
- [ ] Percentages match results

#### 2.5 Test Admin Panel

- [ ] Click "Admin Panel"
- [ ] Should see "System Overview"
- [ ] Shows "3 Total Users"
- [ ] Lists Jon (admin), Ben (user), Sam (user)
- [ ] Shows Jon's exam attempt
- [ ] Click "Back to Dashboard"

#### 2.6 Test Persistence

- [ ] Click "Logout"
- [ ] Login again as Jon
- [ ] Dashboard still shows 1 attempt
- [ ] Exam history persists
- ✅ **PASSED**: Jon's data is persistent

---

### Test 3: Ben (User) - Student Account

#### 3.1 Login
```
Username: Ben
Password: Buildcoben
```

**Expected**:
- [ ] Login successful
- [ ] Header shows "Ben"
- [ ] Role shows "Student"
- [ ] NO "Admin Panel" button (correct!)
- [ ] Dashboard shows 0 attempts
- [ ] "No exam attempts yet" message

**Console check**:
```
[AUTH_DB] login: Attempting login for "Ben"
[AUTH_DB] login: User "Ben" found in database
[AUTH_DB] login: Session created for "Ben"
```

#### 3.2 Take First Exam

- [ ] Click "Start New Exam" or "Take Your First Exam"
- [ ] Complete exam (15-20 questions)
- [ ] Click "Finish Exam"
- [ ] Results display correctly

#### 3.3 Verify Ben's Results

**Expected**:
- [ ] Return to dashboard
- [ ] Now shows "1 Total Attempts"
- [ ] Exam appears in history
- [ ] Score matches results
- [ ] Can expand details

#### 3.4 Test Cross-Account Isolation

- [ ] Logout
- [ ] Login as Jon
- [ ] Jon's dashboard shows Jon's exams only
- [ ] Admin Panel shows both Jon and Ben's attempts
- [ ] Logout
- [ ] Login as Ben
- [ ] Ben's dashboard shows Ben's exams only
- ✅ **PASSED**: Account data is isolated

---

### Test 4: Sam (User) - Third Account

#### 4.1 Login
```
Username: Sam
Password: Buildcosam
```

**Expected**:
- [ ] Login successful
- [ ] Shows "Sam" in header
- [ ] Dashboard is empty
- [ ] No Admin Panel button

#### 4.2 Quick Exam Test

- [ ] Take practice exam
- [ ] Complete and submit
- [ ] Results save correctly
- [ ] Dashboard updates

#### 4.3 Verify All Three Accounts

- [ ] Logout and login as Jon
- [ ] Admin Panel shows attempts from all three users
- [ ] Each user's data is separate and correct
- ✅ **PASSED**: All accounts work independently

---

### Test 5: Database Verification (Supabase)

#### 5.1 Check Users Table

1. Go to Supabase dashboard
2. **Table Editor** → **users**

**Expected**:
- [ ] 3 rows total
- [ ] Row 1: username = "Jon", role = "admin"
- [ ] Row 2: username = "Ben", role = "user"
- [ ] Row 3: username = "Sam", role = "user"
- [ ] All have created_at timestamps
- [ ] All have password_hash (encrypted, long string)

#### 5.2 Check Exam Results Table

**Table Editor** → **exam_results**

**Expected**:
- [ ] Shows rows for each exam taken
- [ ] Jon's attempts have user_id matching Jon
- [ ] Ben's attempts have user_id matching Ben
- [ ] Sam's attempts have user_id matching Sam
- [ ] Each has completed_at timestamp
- [ ] Each has score, percentage, passed fields
- [ ] topic_breakdown contains JSON data

#### 5.3 Run Test Query

**SQL Editor** → New query:

```sql
SELECT username, percentage, passed, completed_at
FROM exam_results
ORDER BY completed_at DESC;
```

**Expected**:
- [ ] Shows all exam attempts
- [ ] Usernames are Jon, Ben, or Sam
- [ ] Percentages are numbers
- [ ] passed is true/false
- ✅ **PASSED**: Database storing correctly

---

### Test 6: Advanced Features

#### 6.1 Question Randomization

- [ ] Login as any user
- [ ] Start exam
- [ ] Note the order of options for first question
- [ ] Submit exam
- [ ] Start new exam
- [ ] First question should have different option order
- ✅ **PASSED**: Answer randomization works

#### 6.2 Question Navigator

- [ ] In exam, click "Show Grid"
- [ ] Plan questions section visible at top
- [ ] MCQ questions grouped by topic
- [ ] Can jump to any question
- [ ] Answered questions show green checkmark
- [ ] Current question highlighted blue

#### 6.3 Flag Questions

- [ ] In exam, click "Flag" on a question
- [ ] Flag count increases in header
- [ ] Question shows flag icon in grid
- [ ] Navigate away and back
- [ ] Flag persists
- [ ] Click "Flag" again to remove

---

### Test 7: Cross-Browser Testing

#### 7.1 Different Browser

- [ ] Open site in different browser (Chrome/Firefox/Edge)
- [ ] Login as any user
- [ ] Data loads correctly
- [ ] Can take exam
- [ ] Results save

#### 7.2 Mobile Device

- [ ] Open on phone or tablet
- [ ] Login page is responsive
- [ ] Dashboard is mobile-friendly
- [ ] Can navigate exam
- [ ] Can complete exam
- [ ] Touch interactions work

#### 7.3 Incognito/Private Mode

- [ ] Open in incognito window
- [ ] Login works
- [ ] Data loads from database
- [ ] Not dependent on cookies
- ✅ **PASSED**: Works everywhere

---

### Test 8: Debug Console

**While logged in, press F12 and type**:

```javascript
window.debugAuthDb()
```

**Expected output**:
```
=== EXAM PORTAL AUTH DEBUG (DATABASE) ===

🔧 Supabase Configuration:
  Configured: true
  URL: https://yourproject.supabase.co...

🔐 Current Session: {userId: "...", username: "Jon", role: "admin"}

📊 Total Users in Database: 3
  - Jon (admin)
  - Ben (user)
  - Sam (user)

📝 Exam Attempts for Jon: [number]

=== END DEBUG ===
```

**Check**:
- [ ] Shows Supabase configured: true
- [ ] Lists all 3 users
- [ ] Shows current session correctly
- ✅ **PASSED**: Debug tools work

---

## ✅ Final Verification Checklist

### Critical Success Criteria

**All must be TRUE**:

- [ ] Login page shows Jon, Ben, Sam (not Buildco_admin)
- [ ] Jon can login with JonAdmin password
- [ ] Ben can login with Buildcoben password
- [ ] Sam can login with Buildcosam password
- [ ] Admin Panel accessible to Jon only
- [ ] All users can complete exams
- [ ] Results save to Supabase database
- [ ] Results persist after logout/login
- [ ] Database has 3 users and exam results
- [ ] No console errors during usage
- [ ] Works in different browsers
- [ ] Works in incognito mode

---

## 🎉 SUCCESS METRICS

### When All Tests Pass:

✅ **Authentication**: Server-side with bcrypt
✅ **Database**: Persistent Supabase storage
✅ **Accounts**: Jon, Ben, Sam all functional
✅ **Exams**: Complete workflow working
✅ **Results**: Saving and persisting
✅ **Cross-device**: Works everywhere
✅ **Production**: Fully deployed and operational

---

## 🐛 If Any Test Fails

### Login Fails

**Check**:
1. Exact credentials (case-sensitive!)
2. Browser console for errors
3. Supabase Logs for API errors
4. Environment variables in Netlify

### Results Don't Save

**Check**:
1. Browser console during exam submission
2. Supabase Logs (real-time)
3. exam_results table exists
4. RLS policies created

### "Database not configured"

**Check**:
1. Netlify environment variables
2. Variable names exactly: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
3. Trigger new deployment
4. Clear browser cache

---

## 📊 Expected Final State

**Supabase users table**: 3 rows
- Jon (admin)
- Ben (user)
- Sam (user)

**Supabase exam_results table**: Multiple rows
- At least 1 from Jon
- At least 1 from Ben
- At least 1 from Sam

**Netlify deployment**: Live and functional
**Live URL**: Your Netlify URL
**Status**: Production ready ✅

---

**Last Updated**: December 10, 2025
**Version**: 8.0
**Status**: Testing Phase
