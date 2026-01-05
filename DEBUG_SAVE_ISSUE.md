# Debug: Form Save Issue

## Common Issues and Solutions

### 1. Check Browser Console
Open your browser's Developer Tools (F12) and check the Console tab when you try to save. Look for:
- Red error messages
- Supabase error codes
- Network errors

### 2. Verify Supabase Key Format
The key you're using (`sb_publishable_...`) might not be the correct format. Supabase JS client typically expects:
- **anon public key**: A JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**To get the correct key:**
1. Go to Supabase Dashboard → Settings → API
2. Look for **"Project API keys"** section
3. Find the key labeled **"anon public"** (NOT "service_role" or "publishable")
4. It should be a long JWT token starting with `eyJ...`

### 3. Verify Table Exists
1. Go to Supabase Dashboard → Table Editor
2. Check if `vendors` table exists
3. If not, run the SQL schema from `supabase-schema.sql` in SQL Editor

### 4. Check RLS Policies
1. Go to Supabase Dashboard → Authentication → Policies
2. Or run this in SQL Editor to check:
```sql
SELECT * FROM pg_policies WHERE tablename = 'vendors';
```

### 5. Test Supabase Connection
Open browser console and run:
```javascript
// Check if Supabase client is working
import { supabase } from './lib/supabase';
supabase.from('vendors').select('count').then(console.log).catch(console.error);
```

### 6. Common Error Codes
- `42501`: Permission denied (RLS policy issue)
- `42P01`: Table doesn't exist
- `23505`: Unique constraint violation (slug already exists)
- `23502`: Not null violation (missing required field)

## Quick Fixes

### If key format is wrong:
Update `.env.local` with the JWT token (anon public key):
```env
VITE_SUPABASE_URL=https://mechsbbkdlgqxdvhdxdf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-jwt-token
```

### If table doesn't exist:
1. Go to Supabase → SQL Editor
2. Copy entire `supabase-schema.sql` file
3. Paste and run

### If RLS is blocking:
The schema should allow inserts, but if not, run:
```sql
CREATE POLICY "Anyone can insert vendors"
  ON vendors FOR INSERT
  WITH CHECK (true);
```











