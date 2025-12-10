# Next Steps: Complete Supabase Setup

## Step 1: Get Your Correct Supabase Credentials

The key you provided (`sb_publishable_...`) might be a different type of key. For our setup, we need:

### In Supabase Dashboard:

1. Go to **Settings** → **API** (left sidebar)
2. You'll see two important values:

   **a) Project URL**
   - Look for "Project URL" section
   - It looks like: `https://xxxxxxxxxxxxx.supabase.co`
   - Copy this entire URL

   **b) anon public key**
   - Look for "Project API keys" section
   - Find the key labeled **"anon public"** (NOT "service_role")
   - It's a long JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Click the eye icon to reveal it, then copy it

## Step 2: Update .env.local File

1. Open `.env.local` in your project root
2. Replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-jwt-token-here
```

**Important:** 
- Use the **anon public** key, NOT the service_role secret key
- The service_role key should NEVER be used in frontend code

## Step 3: Create the Database Table

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file `supabase-schema.sql` from your project
4. Copy the ENTIRE contents of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Cmd/Ctrl + Enter)
7. You should see: "Success. No rows returned"

This creates:
- ✅ The `vendors` table
- ✅ All required columns
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Auto-updating timestamps

## Step 4: Verify Table Creation

1. Go to **Table Editor** in Supabase dashboard
2. You should see a `vendors` table
3. Click on it to see all the columns

## Step 5: Restart Your Dev Server

Environment variables are loaded when Vite starts, so you need to restart:

1. Stop your current dev server (Ctrl+C in terminal)
2. Run: `npm run dev`
3. The app should start without Supabase connection errors

## Step 6: Test the Integration

1. Go to your dashboard: `http://localhost:5173`
2. Fill out the Commission Calculator
3. Fill out the Offer Setup Form
4. Click **"Save Program Rules"**
5. Check your Supabase `vendors` table - you should see a new row! 🎉

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env.local` exists in project root
- Make sure variable names start with `VITE_`
- Restart your dev server after creating/updating `.env.local`

**Error: "Failed to save" or network error**
- Check browser console for specific error
- Verify your Project URL is correct (should end with `.supabase.co`)
- Verify your anon key is correct (should be a JWT token)
- Make sure you ran the SQL schema to create the table

**Can't see data in Supabase**
- Check you're looking at the right project
- Refresh the Table Editor
- Check RLS policies allow public reads (they should, based on our schema)




