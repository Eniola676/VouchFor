# Debug: "No Active Programs" Bug

## Issue
The ActivePrograms component shows "No active programs" even when an affiliate has joined programs.

## Recent Fix
Updated the query structure to use two separate queries instead of foreign key relationship syntax, which may not work correctly with RLS.

## Debugging Steps

### 1. Check Browser Console
Open Developer Tools (F12) → Console tab and look for:
- `"No affiliate programs found for user: [user-id]"`
- `"Error fetching affiliate programs: [error]"`
- `"Error fetching vendors: [error]"`
- `"Transformed programs: [array]"`

### 2. Verify Database Entries

**Check affiliate_programs table:**
```sql
SELECT * FROM affiliate_programs 
WHERE affiliate_id = 'your-user-id';
```

**Check if join_program function was called:**
- Look for entries in `affiliate_programs` table
- Verify `status = 'active'`
- Verify `vendor_id` matches a vendor in `vendors` table

### 3. Verify RLS Policies

**Check if policies exist:**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'affiliate_programs';
```

**Test RLS access:**
```sql
-- As the authenticated user, try:
SELECT * FROM affiliate_programs WHERE affiliate_id = auth.uid();
SELECT * FROM vendors WHERE id IN (SELECT vendor_id FROM affiliate_programs WHERE affiliate_id = auth.uid());
```

### 4. Check User Authentication

**Verify user is authenticated:**
```javascript
// In browser console on dashboard page:
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

**Check if user has confirmed email:**
- Unconfirmed users might have limited RLS access
- Check Supabase Auth → Users → Email confirmed status

### 5. Verify join_program Function

**Test the function directly:**
```sql
-- In Supabase SQL Editor (as admin):
SELECT join_program(
  'affiliate-user-id'::uuid,
  'vendor-id'::uuid
);
```

### 6. Common Issues

**Issue: RLS blocking vendor table access**
- Solution: Vendors table might need a policy allowing affiliates to read active vendors
- Check: `SELECT * FROM pg_policies WHERE tablename = 'vendors';`

**Issue: User not fully authenticated**
- Solution: User needs to confirm email or be logged in
- Check: `supabase.auth.getUser()` returns user

**Issue: join_program() not being called**
- Solution: Check signup flow - verify vendor slug is in URL
- Check: Browser console during signup for "Successfully joined program" message

**Issue: Vendor not active**
- Solution: Verify vendor has `is_active = true`
- Check: `SELECT * FROM vendors WHERE id = 'vendor-id';`

## Quick Test Query

Run this in Supabase SQL Editor to see all data:

```sql
-- Get affiliate programs with vendor details
SELECT 
  ap.id as affiliate_program_id,
  ap.affiliate_id,
  ap.vendor_id,
  ap.status,
  v.program_name,
  v.vendor_slug,
  v.commission_type,
  v.commission_value,
  v.is_active as vendor_active
FROM affiliate_programs ap
LEFT JOIN vendors v ON ap.vendor_id = v.id
WHERE ap.affiliate_id = 'your-user-id-here';
```

## Next Steps

1. Check browser console for specific error messages
2. Verify data exists in `affiliate_programs` table
3. Test RLS policies with the queries above
4. Verify user authentication state
5. Check if vendors table has proper RLS policies for affiliates to read


