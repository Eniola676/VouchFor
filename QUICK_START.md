# Quick Start: Supabase Setup

## ⚠️ Important: Get the Right Keys

The key you mentioned (`sb_publishable_...`) might not be the right one. Here's what you need:

### In Supabase Dashboard:

1. **Go to Settings → API**
2. Look for these TWO values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   (Copy the entire URL)

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
   ```
   (This is a JWT token - long string starting with `eyJ`)

   ⚠️ **NOT the service_role key** - that's secret and should never be in frontend code!

## Step 1: Update .env.local

Open `.env.local` and replace with your actual values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-token
```

## Step 2: Run SQL Schema

1. In Supabase → **SQL Editor**
2. Click **"New Query"**
3. Open `supabase-schema.sql` from your project
4. **Copy ALL the SQL** (from `CREATE TABLE` to the end)
5. Paste into SQL Editor
6. Click **"Run"** ✅

## Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Step 4: Test It!

1. Go to `http://localhost:5173`
2. Fill out calculator → form
3. Click "Save Program Rules"
4. Check Supabase Table Editor → `vendors` table
5. You should see your data! 🎉

---

**Need help finding the keys?** The Project URL and anon key are in **Settings → API** in your Supabase dashboard.




