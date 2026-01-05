import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Download, HelpCircle, ChevronDown, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Commission {
  id: string;
  created_at: string;
  vendor_id: string;
  status: 'pending' | 'approved' | 'paid' | 'reversed';
  commission_amount: number;
  sale_amount: number;
  vendor?: {
    program_name: string;
    vendor_slug: string;
  };
  conversion?: {
    converted_at: string;
    amount: number;
  };
}

export default function CommissionsTableWithFilters() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'commissions' | 'withdrawals'>('commissions');
  
  // Filters
  const [earnedFilter, setEarnedFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchCommissions();
  }, [earnedFilter, programFilter, statusFilter, dateFilter, sortOrder]);

  const fetchCommissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Build query - use new commissions table
      let query = supabase
        .from('commissions')
        .select(`
          id,
          created_at,
          vendor_id,
          status,
          commission_amount,
          sale_amount,
          vendors:vendor_id (
            program_name,
            vendor_slug
          ),
          conversions:conversion_id (
            converted_at,
            amount
          )
        `)
        .eq('affiliate_id', user.id)
        .in('status', ['pending', 'approved', 'paid']) // New status values
        .order('created_at', { ascending: sortOrder === 'asc' });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (programFilter !== 'all') {
        query = query.eq('vendor_id', programFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching commissions:', error);
        setLoading(false);
        return;
      }

      // Transform data to include vendor and conversion info
      const transformedCommissions = (data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        vendor_id: item.vendor_id,
        status: item.status,
        commission_amount: parseFloat(String(item.commission_amount || 0)),
        sale_amount: parseFloat(String(item.sale_amount || 0)),
        vendor: item.vendors ? {
          program_name: item.vendors.program_name,
          vendor_slug: item.vendors.vendor_slug,
        } : undefined,
        conversion: item.conversions ? {
          converted_at: item.conversions.converted_at,
          amount: parseFloat(String(item.conversions.amount || 0)),
        } : undefined,
      }));

      setCommissions(transformedCommissions);
    } catch (err) {
      console.error('Error fetching commissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getEstimatedAvailableDate = (createdAt: string, status: string, conversionDate?: string) => {
    if (status === 'paid') {
      return formatDate(createdAt);
    }
    if (status === 'approved') {
      // For approved, typically available soon (add 7 days)
      const date = new Date(conversionDate || createdAt);
      date.setDate(date.getDate() + 7);
      return formatDate(date.toISOString());
    }
    // For pending, add 30 days (net_30)
    const date = new Date(conversionDate || createdAt);
    date.setDate(date.getDate() + 30);
    return formatDate(date.toISOString());
  };

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      pending: {
        label: 'Pending',
        icon: Clock,
        className: 'text-yellow-400',
        bgClassName: 'bg-yellow-900/20',
        dotColor: 'bg-yellow-400',
      },
      approved: {
        label: 'Approved',
        icon: CheckCircle2,
        className: 'text-blue-400',
        bgClassName: 'bg-blue-900/20',
        dotColor: 'bg-blue-400',
      },
      paid: {
        label: 'Paid',
        icon: CheckCircle2,
        className: 'text-green-400',
        bgClassName: 'bg-green-900/20',
        dotColor: 'bg-green-400',
      },
      reversed: {
        label: 'Reversed',
        icon: Clock,
        className: 'text-red-400',
        bgClassName: 'bg-red-900/20',
        dotColor: 'bg-red-400',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
        <span className={cn("text-sm", config.className)}>{config.label}</span>
      </div>
    );
  };

  const getUniquePrograms = () => {
    const programs = new Map();
    commissions.forEach((c) => {
      if (c.vendor && !programs.has(c.vendor_id)) {
        programs.set(c.vendor_id, c.vendor.program_name);
      }
    });
    return Array.from(programs.entries()).map(([id, name]) => ({ id, name }));
  };

  if (loading) {
    return (
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-12 text-center">
        <p className="text-gray-400">Loading commissions...</p>
      </div>
    );
  }

  return (
    <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('commissions')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition relative",
              activeTab === 'commissions'
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            Commissions
            {activeTab === 'commissions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={cn(
              "px-6 py-4 text-sm font-medium transition relative",
              activeTab === 'withdrawals'
                ? "text-white"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            Withdrawals
            {activeTab === 'withdrawals' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'commissions' && (
        <>
          {/* Filters */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Earned:</label>
              <select
                value={earnedFilter}
                onChange={(e) => setEarnedFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              >
                <option value="all">All</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Program:</label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              >
                <option value="all">All</option>
                {getUniquePrograms().map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Commission status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Estimated available date:</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-3 py-1.5 focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
              >
                <option value="all">All</option>
                <option value="this_month">This Month</option>
                <option value="next_month">Next Month</option>
              </select>
            </div>

            <div className="ml-auto flex items-center gap-4">
              <a href="#" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                <HelpCircle className="w-4 h-4" />
                Learn about commission statuses
              </a>
              <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export commissions
              </button>
            </div>
          </div>

          {/* Table */}
          {commissions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-2">No commissions yet</p>
              <p className="text-sm text-gray-500">Start referring clients to earn commissions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center gap-1 hover:text-white"
                      >
                        Earned
                        <ChevronDown className={cn("w-4 h-4 transition", sortOrder === 'asc' && 'rotate-180')} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Commission status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Estimated available date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {commissions.map((commission) => (
                    <tr key={commission.id} className="hover:bg-gray-900/30 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {formatDate(commission.conversion?.converted_at || commission.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {commission.vendor?.program_name || 'Unknown Program'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {commission.vendor?.vendor_slug || commission.vendor_id.substring(0, 8) + '...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusDisplay(commission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {getEstimatedAvailableDate(
                          commission.created_at, 
                          commission.status,
                          commission.conversion?.converted_at
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                        ${commission.commission_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'withdrawals' && (
        <div className="p-12 text-center">
          <p className="text-gray-400 mb-2">No withdrawals yet</p>
          <p className="text-sm text-gray-500">Withdrawals will appear here once you make a withdrawal request</p>
        </div>
      )}
    </div>
  );
}

