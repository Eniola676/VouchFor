import { AlertCircle, Clock, DollarSign, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  type: 'partner_approval' | 'invoice_due' | 'payout_ready' | 'low_performance';
  title: string;
  description: string;
  count: number;
  href?: string;
}

interface ActionItemsProps {
  items: ActionItem[];
}

export default function ActionItems({ items }: ActionItemsProps) {
  const getIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'partner_approval':
        return UserCheck;
      case 'invoice_due':
        return DollarSign;
      case 'payout_ready':
        return Clock;
      case 'low_performance':
        return AlertCircle;
      default:
        return AlertCircle;
    }
  };

  const getColor = (type: ActionItem['type']) => {
    switch (type) {
      case 'partner_approval':
        return 'text-blue-400 bg-blue-900/20 border-blue-800';
      case 'invoice_due':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
      case 'payout_ready':
        return 'text-green-400 bg-green-900/20 border-green-800';
      case 'low_performance':
        return 'text-red-400 bg-red-900/20 border-red-800';
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-800';
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Action Items</h3>
        <p className="text-sm text-gray-400">No action items at this time</p>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Action Items</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = getIcon(item.type);
          return (
            <Link
              key={item.id}
              to={item.href || '#'}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition hover:bg-gray-900/50",
                getColor(item.type)
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white mb-1">{item.title}</p>
                <p className="text-xs text-gray-400">{item.description}</p>
              </div>
              {item.count > 0 && (
                <span className="px-2 py-1 bg-white/10 text-white text-xs font-medium rounded">
                  {item.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

