import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
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
      "flex flex-col w-full min-h-screen bg-black",
      "relative"
    )}>
      <GridBackground />
      
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
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            {/* Page Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-white mb-2">Affiliate Dashboard</h1>
              <p className="text-sm text-gray-400">Track your referrals and earnings</p>
            </div>
            
            {loading ? (
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                  <p className="text-gray-400">Loading performance data...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-black/80 backdrop-blur-xl border border-red-800 rounded-lg p-6">
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

