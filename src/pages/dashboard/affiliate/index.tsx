import { useEffect, useState } from 'react';
import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { GridBackground } from '@/components/ui/grid-background';
import PerformanceOverview from '@/components/affiliate/PerformanceOverview';
import YourActivity from '@/components/affiliate/YourActivity';
import ActivePrograms from '@/components/affiliate/ActivePrograms';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface PerformanceStats {
  clicks: number;
  signups: number;
  pendingCommission: number;
  paidCommission: number;
}

export default function AffiliateDashboard() {
  const [stats, setStats] = useState<PerformanceStats>({
    clicks: 0,
    signups: 0,
    pendingCommission: 0,
    paidCommission: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all referrals for this affiliate
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('status, commission_amount')
        .eq('affiliate_id', user.id);

      if (error) {
        console.error('Error fetching referrals:', error);
        setLoading(false);
        return;
      }

      interface Referral {
        status: string;
        commission_amount: number | string;
      }

      // Calculate stats from referrals
      const clicks = referrals?.filter((r: Referral) => r.status === 'click').length || 0;
      const signups = referrals?.filter((r: Referral) => r.status === 'signup').length || 0;
      
      const pendingCommission = referrals
        ?.filter((r: Referral) => r.status === 'pending_commission')
        .reduce((sum: number, r: Referral) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;
      
      const paidCommission = referrals
        ?.filter((r: Referral) => r.status === 'paid_commission')
        .reduce((sum: number, r: Referral) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;

      setStats({
        clicks,
        signups,
        pendingCommission,
        paidCommission,
      });
    } catch (err) {
      console.error('Error fetching performance stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row w-full flex-1 min-h-screen",
      "relative"
    )}>
      <GridBackground />
      <div className="relative z-10">
        <AffiliateSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-white mb-2">Affiliate Dashboard</h1>
            <p className="text-sm text-gray-400">Track your referrals and earnings</p>
          </div>
          
          {loading ? (
            <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-center">Loading performance data...</p>
            </div>
          ) : (
            <PerformanceOverview 
              clicks={stats.clicks}
              signups={stats.signups}
              pendingCommission={stats.pendingCommission}
              paidCommission={stats.paidCommission}
            />
          )}
          
          <ActivePrograms />
          
          <YourActivity />
        </div>
      </div>
    </div>
  );
}

