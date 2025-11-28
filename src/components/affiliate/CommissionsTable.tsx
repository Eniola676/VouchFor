import { DollarSign } from 'lucide-react';

// Mock commission data - will be replaced with real data from Supabase
const mockCommissions = [
  {
    id: '1',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: 'Acme Digital Agency',
    amount: 500,
    status: 'paid_commission',
  },
  {
    id: '2',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: 'Tech Solutions Inc',
    amount: 750,
    status: 'paid_commission',
  },
  {
    id: '3',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    vendor: 'Marketing Pro',
    amount: 300,
    status: 'pending_commission',
  },
];

export default function CommissionsTable() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid_commission: {
        label: 'Paid',
        className: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
      },
      pending_commission: {
        label: 'Pending',
        className: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
      },
      signup: {
        label: 'Signup',
        className: 'bg-blue-900/30 text-blue-400 border-blue-800',
      },
      click: {
        label: 'Click',
        className: 'bg-gray-900/30 text-gray-400 border-gray-800',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.click;

    return (
      <span className={`text-xs px-2 py-1 rounded border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg overflow-hidden">
      {mockCommissions.length === 0 ? (
        <div className="p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No commissions yet</p>
          <p className="text-sm text-gray-500">Start referring clients to earn commissions</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {mockCommissions.map((commission) => (
                <tr key={commission.id} className="hover:bg-gray-900/30 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(commission.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                    {commission.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                    ${commission.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(commission.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


