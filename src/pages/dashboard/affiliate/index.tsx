import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import PerformanceOverview from '@/components/affiliate/PerformanceOverview';
import YourActivity from '@/components/affiliate/YourActivity';
import ActivePrograms from '@/components/affiliate/ActivePrograms';
import { useAffiliateStats } from '@/hooks/useAffiliateStats';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function AffiliateDashboard() {
  const { stats, loading, error } = useAffiliateStats();

  return (
    <div className={cn(
      "flex flex-col w-full min-h-screen bg-bg-primary",
      "relative"
    )}>
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>
      
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <div className="relative z-10">
          <AffiliateSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-border bg-surface-elevated/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            {/* Page Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Affiliate Dashboard</h1>
              <p className="text-sm text-text-secondary">Track your referrals and earnings</p>
            </div>
            
            {loading ? (
              <div className="bg-surface-elevated backdrop-blur-xl border border-border rounded-lg p-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <p className="text-text-secondary">Loading performance data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-surface-elevated backdrop-blur-xl border border-red-800 rounded-lg p-6">
                <p className="text-red-400 text-center">
                  Error loading performance data: {error.message}
                </p>
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
    </div>
  );
}

