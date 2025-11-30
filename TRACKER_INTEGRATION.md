# VouchFor Tracker Integration Guide

This guide explains how to integrate the VouchFor tracking SDK into vendor websites to track affiliate signups.

## Overview

The VouchFor tracker (`public/tracker.js`) is a JavaScript SDK that:
1. Detects referral IDs from URL parameters (`?ref=`) or cookies
2. Stores the referral ID in localStorage and cookies
3. Provides a `track()` function to send events to your API
4. Records signups in the referrals table

## Setup

### 1. Include the Tracker Script

Add the tracker script to your vendor's website (the destination URL):

```html
<!-- Add before closing </body> tag -->
<script src="https://your-domain.com/tracker.js"></script>
```

Or if hosting locally:
```html
<script src="/tracker.js"></script>
```

### 2. Set Up the API Endpoint

You have two options for the API endpoint:

#### Option A: Express Server (Recommended for Development)

1. Install dependencies:
```bash
npm install express cors
```

2. Set environment variables:
```bash
export SUPABASE_URL=your-supabase-url
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Run the server:
```bash
node server.js
```

The API will be available at `http://localhost:3001/api/track/event`

#### Option B: Supabase Edge Function

Create a Supabase Edge Function at `supabase/functions/track-event/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { referral_id, event_name, metadata } = await req.json()
  
  // Your tracking logic here
  // Similar to server/api-track.js but adapted for Deno
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 3. Configure the Tracker Endpoint

If your API is on a different domain, configure it:

```html
<script>
  window.VOUCHFOR_API_ENDPOINT = 'https://your-api-domain.com/api/track/event';
</script>
<script src="/tracker.js"></script>
```

## Usage

### Tracking Signups

When a user signs up on the vendor's website, call the track function:

```javascript
// Example: Signup form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  
  // Track the signup
  window.vouchfor.track('signup', {
    email: email,
    // Add any other metadata you want to track
  }).then(function(response) {
    console.log('Signup tracked:', response);
    // Continue with form submission
  }).catch(function(error) {
    console.error('Tracking error:', error);
    // Still continue with form submission even if tracking fails
  });
});
```

### How It Works

1. **User clicks tracking link**: `/go/{affiliateId}/{vendorId}`
   - Click is recorded in referrals table
   - User is redirected to destination URL with `?ref={affiliateId}`

2. **Tracker script loads** on vendor's website:
   - Detects `?ref=` parameter from URL
   - Saves to localStorage as `vouchfor_referral_id`
   - Sets cookie for 90 days

3. **User signs up**:
   - Vendor calls `window.vouchfor.track('signup', { email: '...' })`
   - Tracker sends POST to `/api/track/event`
   - API finds the most recent click for that affiliate
   - Creates a new referral record with `status: 'signup'`

4. **Affiliate dashboard updates**:
   - Signups are counted in Performance Overview
   - Shows in the "Signups" stat card

## API Endpoint Details

### POST /api/track/event

**Request Body:**
```json
{
  "referral_id": "affiliate-uuid",
  "event_name": "signup",
  "metadata": {
    "email": "user@example.com"
  },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "url": "https://vendor-site.com/signup",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Signup recorded successfully",
  "referral_id": "new-referral-uuid"
}
```

## Testing

1. **Test the tracker script**:
   - Visit a page with `?ref=test-affiliate-id`
   - Check browser console for "VouchFor: Referral ID detected"
   - Check localStorage: `localStorage.getItem('vouchfor_referral_id')`

2. **Test tracking**:
   ```javascript
   window.vouchfor.track('signup', { email: 'test@example.com' })
   ```

3. **Verify in database**:
   - Check `referrals` table for new signup record
   - Check affiliate dashboard for updated signup count

## Troubleshooting

### Tracker not detecting referral ID
- Check browser console for errors
- Verify URL has `?ref=` parameter
- Check localStorage and cookies in DevTools

### API endpoint not responding
- Verify server is running
- Check CORS settings
- Verify Supabase credentials are set

### Signups not showing in dashboard
- Check referrals table for records with `status: 'signup'`
- Verify affiliate_id matches the user's ID
- Check browser console for API errors

## Security Notes

- The tracker uses the **anon key** for client-side operations
- The API endpoint should use the **service_role key** (server-side only)
- Never expose the service_role key in client-side code
- The tracker validates referral IDs before sending events


