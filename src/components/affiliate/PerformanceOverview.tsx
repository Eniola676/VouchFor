import { TrendingUp, MousePointerClick, UserPlus, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceOverviewProps {
  clicks: number;
  signups: number;
  pendingCommission: number;
  paidCommission: number;
}

export default function PerformanceOverview({
  clicks,
  signups,
  pendingCommission,
  paidCommission,
}: PerformanceOverviewProps) {
  const stats = [
    {
      label: 'Total Clicks',
      value: clicks.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/20',
      borderColor: 'border-blue-800',
    },
    {
      label: 'Signups',
      value: signups.toLocaleString(),
      icon: UserPlus,
      color: 'text-green-400',
      bgColor: 'bg-green-900/20',
      borderColor: 'border-green-800',
    },
    {
      label: 'Pending Commission',
      value: `$${pendingCommission.toLocaleString()}`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-800',
    },
    {
      label: 'Paid Commission',
      value: `$${paidCommission.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-900/20',
      borderColor: 'border-emerald-800',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-white" />
        <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={cn(
                "bg-black/80 backdrop-blur-xl border rounded-lg p-6",
                stat.borderColor
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("w-5 h-5", stat.color)} />
                <div className={cn("w-2 h-2 rounded-full", stat.bgColor)} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

