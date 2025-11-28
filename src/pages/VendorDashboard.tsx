import { useEffect, useState } from 'react';
import { VendorSidebar } from '../components/VendorSidebar';
import { GridBackground } from '../components/ui/grid-background';
import OverviewMetrics from '../components/vendor/OverviewMetrics';
import PerformanceChart from '../components/vendor/PerformanceChart';
import ActionItems from '../components/vendor/ActionItems';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface ChartDataPoint {
  date: string;
  clicks: number;
  conversions: number;
}

export default function VendorDashboard() {
  const [metrics, setMetrics] = useState({
    revenueGenerated: 0,
    pendingPayouts: 0,
    newPartners: 0,
  });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [actionItems, setActionItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch vendor's programs
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id);

      if (!vendors || vendors.length === 0) {
        setLoading(false);
        return;
      }

      const vendorIds = vendors.map((v: { id: string }) => v.id);

      // Fetch all referrals for these vendors
      const { data: referrals } = await supabase
        .from('referrals')
        .select('status, commission_amount, created_at, vendor_id')
        .in('vendor_id', vendorIds);

      // Calculate revenue generated (paid commissions)
      const revenueGenerated = referrals
        ?.filter((r: any) => r.status === 'paid_commission')
        .reduce((sum: number, r: any) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;

      // Calculate pending payouts (pending commissions)
      const pendingPayouts = referrals
        ?.filter((r: any) => r.status === 'pending_commission')
        .reduce((sum: number, r: any) => sum + parseFloat(String(r.commission_amount || 0)), 0) || 0;

      // Fetch new partners (affiliates who joined in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: newPartnersData } = await supabase
        .from('affiliate_programs')
        .select('id')
        .in('vendor_id', vendorIds)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const newPartners = newPartnersData?.length || 0;

      setMetrics({
        revenueGenerated,
        pendingPayouts,
        newPartners,
      });

      // Generate chart data for last 30 days
      const chartDataPoints: ChartDataPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayClicks = referrals?.filter((r: any) => {
          const rDate = new Date(r.created_at).toISOString().split('T')[0];
          return rDate === dateStr && r.status === 'click';
        }).length || 0;

        const dayConversions = referrals?.filter((r: any) => {
          const rDate = new Date(r.created_at).toISOString().split('T')[0];
          return rDate === dateStr && (r.status === 'signup' || r.status === 'pending_commission' || r.status === 'paid_commission');
        }).length || 0;

        chartDataPoints.push({
          date: dateStr,
          clicks: dayClicks,
          conversions: dayConversions,
        });
      }

      setChartData(chartDataPoints);

      // Generate action items
      const items: any[] = [];

      // Partners waiting for approval
      const { data: pendingPartners } = await supabase
        .from('affiliate_programs')
        .select('id')
        .in('vendor_id', vendorIds)
        .eq('status', 'pending');

      if (pendingPartners && pendingPartners.length > 0) {
        items.push({
          id: 'pending-partners',
          type: 'partner_approval' as const,
          title: `${pendingPartners.length} Partner${pendingPartners.length > 1 ? 's' : ''} waiting for approval`,
          description: 'Review and approve affiliate applications',
          count: pendingPartners.length,
          href: '/programs',
        });
      }

      // Payouts ready
      if (pendingPayouts > 0) {
        items.push({
          id: 'payout-ready',
          type: 'payout_ready' as const,
          title: 'Payouts ready',
          description: `$${pendingPayouts.toLocaleString()} in pending commissions`,
          count: 0,
          href: '/programs',
        });
      }

      setActionItems(items);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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
        <VendorSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-white mb-2">Overview</h1>
            <p className="text-sm text-gray-400">Welcome back! Here's what's happening with your programs.</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-400">Loading dashboard...</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Metrics Cards */}
                <OverviewMetrics
                  revenueGenerated={metrics.revenueGenerated}
                  pendingPayouts={metrics.pendingPayouts}
                  newPartners={metrics.newPartners}
                />

                {/* Chart */}
                <PerformanceChart
                  data={chartData}
                  dateRange="Last 30 days"
                />
              </div>

              {/* Sidebar - Action Items */}
              <div>
                <ActionItems items={actionItems} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
