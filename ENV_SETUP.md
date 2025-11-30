# Environment Variables Setup

## Where to Find Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon in the left sidebar)
3. Click on **API** in the settings menu

You'll see:
- **Project URL**: Something like `https://xxxxxxxxxxxxx.supabase.co`
- **anon public** key: A long string starting with `eyJ...` (this is a JWT token)

## Important Notes

⚠️ **DO NOT use the `service_role` secret key** - that's for backend/server use only and should never be exposed in frontend code.

✅ **Use the `anon public` key** - this is safe for frontend use and is protected by Row Level Security (RLS).

## Create Your .env.local File

1. In the root of your project (same folder as `package.json`), create a file named `.env.local`
2. Add these two lines (replace with your actual values):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

## Example

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.example
```

## After Creating .env.local

1. **Restart your dev server** - Vite needs to restart to pick up new environment variables
2. Stop the current server (Ctrl+C)
3. Run `npm run dev` again



