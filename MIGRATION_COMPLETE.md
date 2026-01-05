# Migration Complete: New Tracking System Implemented

## ✅ What Was Changed

### 1. **Database Schema**
- New tables created (via `supabase-tracking-redesign-schema.sql`):
  - `referral_sessions` - Tracks clicks with session tokens
  - `conversions` - Idempotent conversion events (from webhooks)
  - `commissions` - Calculated commissions downstream
  - `conversion_events` - Audit log

### 2. **Click Tracking** (`src/pages/go/TrackingLink.tsx`)
- ✅ Now creates `referral_sessions` instead of `referrals`
- ✅ Generates unique `session_token` (UUID)
- ✅ Sets `expires_at` based on vendor's `cookie_duration`
- ✅ Redirects with `?session={token}` instead of `?ref={affiliateId}`

### 3. **Tracker.js** (`public/tracker.js`)
- ✅ Stores `session_token` instead of `affiliate_id`
- ✅ Looks for `?session=` parameter in URL
- ✅ Sends conversion hints (advisory only)
- ✅ Webhooks are authoritative for actual conversions

### 4. **API Endpoint** (`server/api-track.js`)
- ✅ New endpoint: `POST /api/track/conversion` - Accepts conversion hints
- ✅ New endpoint: `GET /api/track/session/:token` - Validates sessions
- ✅ Logs to `conversion_events` table for debugging

### 5. **Webhook Handler** (`server/webhooks/stripe.js`)
- ✅ Handles Stripe `payment_intent.succeeded` events
- ✅ Creates idempotent `conversions` records
- ✅ Triggers attribution service
- ✅ Handles refunds (`charge.refunded`)

### 6. **Attribution Service** (`server/services/attribution.js`)
- ✅ Links conversions to referral sessions
- ✅ Last-click attribution (most recent session wins)
- ✅ Enforces attribution windows (expired sessions excluded)
- ✅ Triggers commission calculation

### 7. **Commission Service** (`server/services/commission.js`)
- ✅ Calculates commissions from conversions
- ✅ Snapshot of vendor commission settings at conversion time
- ✅ Creates `commissions` records with status `pending`

### 8. **Frontend Updates**
- ✅ `CommissionsTableWithFilters.tsx` - Queries `commissions` table
- ✅ `commissions.tsx` - Updated stats calculation
- ✅ Status values: `pending`, `approved`, `paid`, `reversed`

### 9. **Server Setup** (`server.js`)
- ✅ New endpoints registered
- ✅ Webhook routes configured

---

## 🚀 Next Steps

### 1. **Apply Database Schema**
Run this SQL in Supabase SQL Editor:
```bash
# Run: supabase-tracking-redesign-schema.sql
```

### 2. **Configure Stripe Webhook**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `charge.refunded`
4. Copy webhook signing secret to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. **Update Vendor Integration**
Vendors need to:
1. Include tracker.js: `<script src="https://your-domain.com/tracker.js"></script>`
2. Set `vendor_id` in Stripe payment metadata:
   ```javascript
   stripe.paymentIntents.create({
     amount: 9900,
     currency: 'usd',
     metadata: {
       vendor_id: 'your-vendor-uuid'
     }
   });
   ```

### 4. **Test the Flow**
1. Click tracking link: `/go/{affiliateId}/{vendorId}`
2. Verify `referral_sessions` table has new record
3. Complete test payment with Stripe
4. Verify webhook creates `conversion`
5. Verify attribution links conversion to session
6. Verify commission is calculated

---

## 📊 Data Migration (Optional)

If you have existing data in `referrals` table:

```sql
-- Migrate old clicks to referral_sessions
INSERT INTO referral_sessions (affiliate_id, vendor_id, session_token, expires_at, created_at)
SELECT 
  affiliate_id,
  vendor_id,
  gen_random_uuid()::text as session_token,
  created_at + INTERVAL '60 days' as expires_at,
  created_at
FROM referrals
WHERE status = 'click';

-- Migrate old commissions (if needed)
-- Note: This is complex - may need manual review
```

---

## ⚠️ Breaking Changes

1. **Old `referrals` table is no longer used** for new tracking
2. **Status values changed**:
   - Old: `pending_commission`, `paid_commission`
   - New: `pending`, `approved`, `paid`, `reversed`
3. **URL parameter changed**:
   - Old: `?ref={affiliateId}`
   - New: `?session={token}`
4. **Tracker.js API changed**:
   - Old: `window.vouchfor('track', 'sale', { program_id: '...' })`
   - New: `window.vouchfor('track', 'conversion', { conversion_id: '...', amount: 99.00 })`

---

## 🔍 Verification Checklist

- [ ] Database schema applied
- [ ] Click tracking creates `referral_sessions`
- [ ] Tracker.js stores session tokens
- [ ] Stripe webhook configured
- [ ] Conversions created from webhooks
- [ ] Attribution links conversions to sessions
- [ ] Commissions calculated correctly
- [ ] Frontend displays commissions from new table
- [ ] Refunds reverse commissions

---

## 📝 Notes

- **Old `referrals` table remains** - not deleted (for historical data)
- **Both systems can run in parallel** during transition
- **Webhooks are authoritative** - client-side conversion hints are advisory only
- **Attribution windows enforced** - expired sessions cannot be attributed
- **Idempotent conversions** - same payment processed multiple times = same conversion

---

## 🐛 Troubleshooting

### Conversions not being attributed
- Check `referral_sessions` table for valid sessions
- Verify `expires_at` is in the future
- Check `is_active = true`

### Commissions not calculated
- Verify conversion status is `confirmed`
- Check vendor commission settings
- Review commission calculation logs

### Webhook not receiving events
- Verify Stripe webhook endpoint URL
- Check webhook signing secret
- Review Stripe webhook logs

---

## 📚 Documentation

- Design: `TRACKING_SYSTEM_DESIGN.md`
- Migration: `MIGRATION_STATUS.md`
- Schema: `supabase-tracking-redesign-schema.sql`





