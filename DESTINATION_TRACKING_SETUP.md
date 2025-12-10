# Destination Tracking Implementation Guide

## Overview

VouchFor now uses **Destination Tracking** - a clean, idempotent tracking system that records conversions when customers complete sales on vendor websites.

## How It Works

### Flow:
1. **Affiliate shares tracking link** → `/go/{affiliateId}/{vendorId}`
2. **Click is recorded** → Stored in `referrals` table with `status: 'click'`
3. **User redirected** → To vendor's destination URL with `?ref={affiliateId}`
4. **Tracker script loads** → Detects `?ref=` parameter, saves to localStorage (60 days)
5. **Customer completes sale** → Vendor calls `vouchfor('track', 'sale', {...})`
6. **Sale recorded** → Creates referral record with `status: 'pending_commission'`

## Implementation Status

### ✅ Phase 1: Audit & Clean Up
- **Status:** Complete
- Only `public/tracker.js` exists (no duplicates)
- No click tracking logic found in `src/` folder (only redirect logic in `TrackingLink.tsx` which is needed)

### ✅ Phase 2: Idempotent Tracker Script
- **File:** `public/tracker.js`
- **Features:**
  - Prevents double-loading with `window.vouchforInitialized` check
  - Saves `?ref=` parameter to localStorage (60 days expiry)
  - Exposes `vouchfor('track', 'sale', { program_id: '...', email: '...' })`
  - Sends to `/api/track` endpoint

### ✅ Phase 3: Smart Integration Page
- **File:** `src/pages/settings/integrations.tsx`
- **Features:**
  - Step 1: Global script with "Check Installation" button
  - Step 2: Program-specific thank you page code
  - Step 3: Validation/listening for events
  - Auto-activates program when first sale is received

### ✅ Phase 4: Database & API
- **Database:** SQL migration file created (`supabase-add-public-key.sql`)
- **API Endpoint:** `/api/track` (updated in `server/api-track.js`)
- **Server:** Express server updated (`server.js`)

## Setup Instructions

### 1. Run Database Migration

Execute in Supabase SQL Editor:
```sql
-- File: supabase-add-public-key.sql
ALTER TABLE vendors 
ADD COLUMN IF NOT EXISTS public_key TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_public_key ON vendors(public_key);
```

### 2. Start API Server

The API server needs to be running for tracking to work:

```bash
npm run server
```

This starts the Express server on port 3001 (or PORT from env).

**Environment Variables Required:**
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Vite Proxy (Optional)

If you want to proxy API requests through Vite dev server, add to `vite.config.ts`:

```typescript
export default defineConfig({
  // ... existing config
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api/track': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

## Usage

### For Vendors:

1. **Go to Settings → Integrations**
2. **Select your program**
3. **Step 1:** Copy the global script and add to your website
4. **Step 2:** Copy the thank you page code and add to your confirmation page
5. **Step 3:** Click "Start Listening" to validate installation
6. **Test:** Complete a test sale to verify tracking works

### For Affiliates:

- Share your tracking link: `/go/{yourId}/{vendorId}`
- Clicks are automatically recorded
- Sales appear in your dashboard when vendors track conversions

## API Endpoint

**POST** `/api/track`

**Request Body:**
```json
{
  "ref_id": "affiliate-uuid",
  "event_type": "sale",
  "program_id": "vendor-uuid",
  "email": "customer@example.com",
  "metadata": {},
  "timestamp": "2025-01-15T10:30:00.000Z",
  "url": "https://vendor-site.com/thank-you",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "sale recorded successfully",
  "referral_id": "uuid",
  "status": "pending_commission"
}
```

## Tracker API

**Global Function:**
```javascript
// Track a sale
vouchfor('track', 'sale', {
  program_id: 'vendor-uuid',
  email: 'customer@example.com'
});

// Get current referral ID
vouchfor('getRefId');
```

**Object API (backward compatible):**
```javascript
window.vouchfor.track('sale', { program_id: '...', email: '...' });
window.vouchfor.getReferralId();
```

## Notes

- **Idempotent:** Tracker script can be loaded multiple times safely
- **60-day expiry:** Referral IDs expire after 60 days
- **CORS:** Installation check may be limited by browser CORS policies
- **Program activation:** Programs are automatically marked as "Active" when first sale is received


