import { useEffect, useState } from 'react';
import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import { GridBackground } from '@/components/ui/grid-background';
import FundsOverview from '@/components/affiliate/FundsOverview';
import CommissionsTableWithFilters from '@/components/affiliate/CommissionsTableWithFilters';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function CommissionsPage() {
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalCommissions: 0,
    processingFee: 1.0, // Fixed $1 processing fee
    projectedEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    fetchCommissionStats();
  }, []);

  const fetchCommissionStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all commissions (excluding clicks)
      const { data: referrals, error } = await supabase
        .from('referrals')
        .select('status, commission_amount, created_at')
        .eq('affiliate_id', user.id)
        .in('status', ['pending_commission', 'paid_commission', 'signup']);

      if (error) {
        console.error('Error fetching commissions:', error);
        setLoading(false);
        return;
      }

      interface Referral {
        status: string;
        commission_amount: number | string;
        created_at: string;
      }

      // Calculate total commissions (paid + pending)
      const totalCommissions = referrals?.reduce(
        (sum: number, r: Referral) => sum + parseFloat(String(r.commission_amount || 0)),
        0
      ) || 0;

      // Calculate paid commissions (available for withdrawal)
      const paidCommissions = referrals
        ?.filter((r: Referral) => r.status === 'paid_commission')
        .reduce((sum: number, r: Referral) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;

      // Get current month's pending commissions for projected earnings
      const now = new Date();
      const currentMonthPending = referrals
        ?.filter((r: Referral) => {
          const createdDate = new Date(r.created_at);
          return (
            r.status === 'pending_commission' &&
            createdDate.getMonth() === now.getMonth() &&
            createdDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum: number, r: Referral) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;

      // Total available = paid commissions - processing fee (if > 0)
      const totalAvailable = paidCommissions > 0 ? Math.max(0, paidCommissions - stats.processingFee) : 0;

      setStats({
        totalAvailable,
        totalCommissions: paidCommissions,
        processingFee: stats.processingFee,
        projectedEarnings: currentMonthPending,
      });

      setTotalEarnings(totalCommissions);
    } catch (err) {
      console.error('Error fetching commission stats:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total earnings for banner
  const bannerAmount = totalEarnings > 0 ? totalEarnings : 0;

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row w-full flex-1 min-h-screen bg-black",
      "relative"
    )}>
      <GridBackground />
      <div className="relative z-10">
        <AffiliateSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-white mb-2">Commissions & withdrawals</h1>
            <p className="text-sm text-gray-400">View your commission history and manage withdrawals</p>
          </div>

          {/* Congratulatory Banner */}
          {bannerAmount > 0 && (
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 text-sm">
                🎉 Wow, you've made ${bannerAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} using VouchFor. Keep it up!
              </p>
            </div>
          )}

          {/* Funds Overview Cards */}
          {loading ? (
            <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
              <p className="text-gray-400 text-center">Loading funds data...</p>
            </div>
          ) : (
            <FundsOverview
              totalAvailable={stats.totalAvailable}
              totalCommissions={stats.totalCommissions}
              processingFee={stats.processingFee}
              projectedEarnings={stats.projectedEarnings}
            />
          )}

          {/* Commissions Table with Filters */}
          <CommissionsTableWithFilters />
        </div>
      </div>
    </div>
  );
}


