# Google OAuth Setup Guide

## The Problem

You're getting: **"Access blocked: This app's request is invalid"**

This happens when the redirect URI in your OAuth request doesn't match what's configured in Google Cloud Console.

## Solution: Configure Redirect URIs

### Step 1: Configure Redirect URI in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **URL Configuration**
3. Under **Redirect URLs**, add these URLs (one per line):
   ```
   http://localhost:5173/auth/callback
   https://yourdomain.com/auth/callback
   ```
   Replace `yourdomain.com` with your production domain when you deploy.

   **Note:** The port is fixed to `5173` in `vite.config.ts`, so you only need to add this URL once. It won't change when you restart the server.

4. Click **Save**

### Step 2: Get Your Supabase Project ID

1. Go to your **Supabase Dashboard**
2. Look at your **Project URL** in Settings → API
3. It will be in format: `https://xxxxxxxxxxxxx.supabase.co`
4. The `xxxxxxxxxxxxx` part is your **Project ID**

### Step 3: Set Up OAuth Consent Screen (If Not Done)

1. In Google Cloud Console, go to **APIs & Services** → **OAuth consent screen**
2. If not configured, set it up:
   - User Type: **External** (for testing) or **Internal** (for Google Workspace)
   - App name: `VouchFor` (or your app name)
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid` (usually added by default)
   - Add test users if in testing mode
   - Click **Save and Continue**

### Step 4: Configure Redirect URI in Google Cloud Console

1. In Google Cloud Console, navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (or create one if needed)
   - If you don't have one, click **Create Credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `VouchFor` (or your app name)
5. Click **Edit** on your OAuth client
6. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
   **Important:** Replace `YOUR_PROJECT_ID` with your actual Supabase project ID from Step 2.
   
   Example: If your Supabase URL is `https://abcdefghijklmnop.supabase.co`, then add:
   ```
   https://abcdefghijklmnop.supabase.co/auth/v1/callback
   ```

7. Click **Save**

### Step 5: Configure Google OAuth in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to enable it
4. Enter your **Google Client ID** and **Google Client Secret**
   - These are from Google Cloud Console → Credentials
5. Click **Save**

### Step 6: Verify Your Redirect URI Format

The code uses: `${window.location.origin}/auth/callback`

For **local development** (localhost:5173), this becomes:
- `http://localhost:5173/auth/callback`

For **production**, this becomes:
- `https://yourdomain.com/auth/callback`

**Important:** Supabase will automatically redirect to your custom callback URL after authentication, but Google needs to know about Supabase's callback URL first.

## Quick Checklist

- [ ] Set up OAuth consent screen in Google Cloud Console
- [ ] Created OAuth 2.0 Client ID in Google Cloud Console
- [ ] Added Supabase callback URL in Google Cloud Console (Authorized redirect URIs)
- [ ] Added redirect URIs in Supabase (Authentication → URL Configuration)
- [ ] Enabled Google provider in Supabase (Authentication → Providers)
- [ ] Added Google Client ID and Secret in Supabase
- [ ] Restarted your dev server after changes

## Testing

1. Try signing up with Google again
2. You should be redirected to Google's consent screen
3. After approving, you'll be redirected back to `/auth/callback`
4. The app should then redirect you to the appropriate dashboard

## Troubleshooting

### Still getting "invalid request"?
- Double-check the redirect URI in Google Cloud Console matches exactly: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
- Make sure there are no trailing slashes or extra characters
- Wait a few minutes after saving - Google sometimes takes time to propagate changes

### Getting redirected but seeing errors?
- Check browser console for errors
- Verify the `/auth/callback` route exists (it should - it's in App.tsx)
- Check that your Supabase project URL is correct in `.env.local`

