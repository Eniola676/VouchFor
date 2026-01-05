import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AffiliateStats {
  clicks: number;
  signups: number;
  pendingCommission: number;
  paidCommission: number;
}

export function useAffiliateStats(refId?: string) {
  const [stats, setStats] = useState<AffiliateStats>({
    clicks: 0,
    signups: 0,
    pendingCommission: 0,
    paidCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchStats();
  }, [refId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user if refId not provided
      let affiliateId = refId;
      if (!affiliateId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }
        affiliateId = user.id;
      }

      // Fetch all referrals for this affiliate
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('status, commission_amount')
        .eq('affiliate_id', affiliateId);

      if (referralsError) {
        throw referralsError;
      }

      if (!referrals) {
        setStats({
          clicks: 0,
          signups: 0,
          pendingCommission: 0,
          paidCommission: 0,
        });
        setLoading(false);
        return;
      }

      // Calculate stats from referrals
      // Clicks: Count rows where status === 'click'
      const clicks = referrals.filter((r) => r.status === 'click').length;

      // Signups: Count rows where status === 'pending_commission' (conversions pending approval)
      const signups = referrals.filter((r) => r.status === 'pending_commission').length;

      // Pending Commission: Sum commission_amount where status === 'pending_commission'
      const pendingCommission = referrals
        .filter((r) => r.status === 'pending_commission')
        .reduce((sum, r) => {
          const amount = typeof r.commission_amount === 'string' 
            ? parseFloat(r.commission_amount) 
            : Number(r.commission_amount) || 0;
          return sum + amount;
        }, 0);

      // Paid Commission: Sum commission_amount where status === 'paid_commission'
      const paidCommission = referrals
        .filter((r) => r.status === 'paid_commission')
        .reduce((sum, r) => {
          const amount = typeof r.commission_amount === 'string' 
            ? parseFloat(r.commission_amount) 
            : Number(r.commission_amount) || 0;
          return sum + amount;
        }, 0);

      setStats({
        clicks,
        signups,
        pendingCommission,
        paidCommission,
      });
    } catch (err) {
      console.error('Error fetching affiliate stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refetch: fetchStats };
}








