import { useEffect, useState } from 'react';
import { VendorSidebar } from '../components/VendorSidebar';
import DashboardHeader from '../components/DashboardHeader';
import { RevenueCard } from '../components/vendor/RevenueCard';
import { MetricCard } from '../components/vendor/MetricCard';
import { PerformanceChartV2 } from '../components/vendor/PerformanceChartV2';
import { ActionItemsWidget } from '../components/vendor/ActionItemsWidget';
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
      "flex flex-col w-full min-h-screen",
      "bg-[#070614]",
      "relative"
    )}>
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 relative z-10">
        {/* Left Sidebar */}
        <div className="relative z-10">
          <VendorSidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 relative z-10">
          <div className="p-6 md:p-8 lg:p-10 flex-1 w-full overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#ff4b00] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-[#9ca3af] text-sm">Loading dashboard...</p>
                </div>
              </div>
            ) : (
              <div className="max-w-[1800px] mx-auto">
                {/* 3-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* MIDDLE COLUMN - Main Content (spans 8 columns) */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* TOP KPI CARDS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Large Revenue Card - Takes 7 columns */}
                      <div className="md:col-span-7">
                        <RevenueCard amount={metrics.revenueGenerated} />
                      </div>

                      {/* Small Metric Cards - Take 5 columns, stacked */}
                      <div className="md:col-span-5 grid grid-rows-2 gap-4">
                        <MetricCard
                          title="Pending Payouts"
                          value={`$${metrics.pendingPayouts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          href="/programs"
                        />
                        <MetricCard
                          title="New Partners"
                          value={metrics.newPartners}
                          subtitle="This month"
                          trend={0}
                        />
                      </div>
                    </div>

                    {/* MAIN CHART SECTION */}
                    <PerformanceChartV2
                      data={chartData.length > 0 ? chartData : generateFauxChartData()}
                      dateRange="Last 30 days"
                    />
                  </div>

                  {/* RIGHT SIDEBAR - Action Items (spans 4 columns) */}
                  <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-6">
                      <ActionItemsWidget items={actionItems.length > 0 ? actionItems : generateFauxActionItems()} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate realistic faux chart data for demonstration
function generateFauxChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const baseClicks = 85;
  const baseConversions = 12;

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Create realistic variation with upward trend
    const trend = (30 - i) / 30; // Gradual increase over time
    const variation = Math.sin(i / 3) * 0.3 + Math.random() * 0.2;
    const clicks = Math.round(baseClicks * (1 + trend * 0.5 + variation));
    const conversions = Math.round(baseConversions * (1 + trend * 0.6 + variation * 0.8));

    data.push({
      date: dateStr,
      clicks,
      conversions
    });
  }

  return data;
}

// Generate realistic faux action items for demonstration
function generateFauxActionItems() {
  return [
    {
      id: 'new-partner-requests',
      type: 'partner_approval' as const,
      title: '3 New partner requests',
      description: 'Review and approve affiliate applications',
      count: 3,
      href: '/programs'
    },
    {
      id: 'pending-payouts',
      type: 'payout_ready' as const,
      title: 'Payouts ready',
      description: '$2,450.00 in pending commissions',
      count: 0,
      href: '/programs'
    },
    {
      id: 'update-commission',
      type: 'partner_approval' as const,
      title: 'Update commission rates',
      description: 'Review your current program structure',
      count: 1,
      href: '/programs'
    }
  ];
}

