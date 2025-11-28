import { Activity, Clock } from 'lucide-react';

// Mock activity data - will be replaced with real data from Supabase
const mockActivities = [
  {
    id: '1',
    type: 'new_lead',
    message: 'New signup from Acme Digital Agency program',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2',
    type: 'payout',
    message: 'Commission paid: $500 from Tech Solutions Inc',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: '3',
    type: 'new_lead',
    message: 'New click tracked for Marketing Pro program',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  },
];

export default function YourActivity() {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return '🎯';
      case 'payout':
        return '💰';
      default:
        return '📋';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-white" />
        <h2 className="text-lg font-semibold text-white">Your Activity</h2>
      </div>
      
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
        {mockActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mockActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0"
              >
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-white text-sm mb-1">{activity.message}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(activity.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


