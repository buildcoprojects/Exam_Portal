# Database Migration: localStorage → Supabase

## 🎯 What Changed

This version migrates the exam portal from browser localStorage to a cloud-based Supabase database for persistent server-side storage.

### Before (localStorage):
- ❌ Data stored only in browser
- ❌ Lost when browser cache cleared
- ❌ No multi-device sync
- ❌ Admin needed to create users manually
- ❌ Users couldn't login (localStorage issues)

### After (Supabase):
- ✅ Data stored in cloud database
- ✅ Persists permanently
- ✅ Multi-device access
- ✅ Pre-configured accounts (Jon, Ben, Sam)
- ✅ Reliable authentication
- ✅ Exam history never lost

---

## 👥 Pre-configured Accounts

Three accounts are automatically created when the app initializes:

| Username | Password | Role |
|----------|----------|------|
| **Jon** | JonAdmin | Admin |
| **Ben** | Buildcoben | User |
| **Sam** | Buildcosam | User |

These are hard-coded in `src/lib/authDb.ts` and created automatically on first app load.

---

## 🚀 Setup Required

###  1. Set Up Supabase (5 minutes)

See `SUPABASE_SETUP.md` for detailed instructions.

**Quick version**:
1. Create free account at https://supabase.com
2. Create new project
3. Go to Settings → API
4. Copy Project URL and anon key
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

### 2. Create Database Tables

1. Go to Supabase SQL Editor
2. Run the SQL from `supabase-schema.sql`
3. Verify tables created in Table Editor

### 3. Deploy to Netlify

1. Add environment variables to Netlify:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
2. Trigger new deployment

---

## 📋 Files Changed

### New Files:
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/authDb.ts` - Database-backed authentication
- `supabase-schema.sql` - Database schema
- `SUPABASE_SETUP.md` - Setup guide
- `.env.local.example` - Environment variables template

### Modified Files:
- `src/app/page.tsx` - Use authDb instead of auth
- `src/components/LoginPage.tsx` - Show new credentials
- `src/components/UserDashboard.tsx` - Fetch from database
- `src/components/ExamInterface.tsx` - Save to database
- `src/components/AdminPanel.tsx` - Read-only stats view
- `package.json` - Added Supabase and bcryptjs

### Deprecated Files (still exist but not used):
- `src/lib/auth.ts` - Old localStorage auth (can be deleted)

---

## 🔄 Migration Path

### For Development:
1. Setup Supabase (see above)
2. Run `bun install` to get new dependencies
3. Create `.env.local` with Supabase credentials
4. Run `bun run dev`
5. Login as Jon, Ben, or Sam
6. Take exam, verify results persist

### For Production (Netlify):
1. Add environment variables to Netlify
2. Push changes to GitHub
3. Netlify auto-deploys
4. Test login and exam completion

---

## ⚠️ Breaking Changes

### Authentication:
- **Old**: `Buildco_admin` / `admin`
- **New**: `Jon` / `JonAdmin`

- **Old**: Create users via admin panel
- **New**: Fixed accounts (Jon, Ben, Sam)

### Data Storage:
- **Old**: localStorage in browser
- **New**: Supabase PostgreSQL database

### User Creation:
- **Old**: Admin could create new users
- **New**: Only pre-configured accounts exist

---

## 🐛 Troubleshooting

### "Database not configured"
- Check `.env.local` exists with correct values
- Restart dev server
- On Netlify: check environment variables

### "Users not found"
- Run `supabase-schema.sql` in Supabase
- Check Supabase Table Editor for `users` table
- Verify app initialized (check console logs)

### Login fails
- Use exact credentials: `Jon` / `JonAdmin` (case-sensitive)
- Check Supabase Logs for errors
- Run `window.debugAuthDb()` in console

### Results not saving
- Check RLS policies in Supabase
- Verify `exam_results` table exists
- Check browser console for errors

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (10 rounds)
- Supabase RLS policies control access
- Anon key is safe for client-side use
- No service role key in code

---

## 📦 Dependencies Added

```json
{
  "@supabase/supabase-js": "^2.87.1",
  "bcryptjs": "^3.0.3",
  "@types/bcryptjs": "^3.0.0"
}
```

---

## ✅ Testing Checklist

- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Database tables created
- [ ] Can login as Jon
- [ ] Can login as Ben
- [ ] Can login as Sam
- [ ] Dashboard loads for each user
- [ ] Can take practice exam
- [ ] Results save to database
- [ ] Results persist after logout/login
- [ ] Results show in dashboard
- [ ] Admin panel shows all users

---

## 🆘 Need Help?

1. See `SUPABASE_SETUP.md` for detailed setup
2. Check Supabase documentation: https://supabase.com/docs
3. Run `window.debugAuthDb()` in browser console
4. Check Supabase Logs for errors

---

**Last Updated**: December 10, 2025
**Status**: Migration Complete - Requires Setup
