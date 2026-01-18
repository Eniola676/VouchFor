import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VendorSidebar } from '../components/VendorSidebar';
import DashboardHeader from '../components/DashboardHeader';
import CommissionCalculator from '../components/CommissionCalculator';
import OfferSetupForm from '../components/OfferSetupForm';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { DollarSign, Users, Plus, X, Copy, Check } from 'lucide-react';
import Button from '../components/ui/Button';

interface VendorProgram {
  id: string;
  vendor_slug: string;
  program_name: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  destination_url: string;
  cookie_duration: number;
  is_active: boolean;
  created_at: string;
  published_at: string | null;
  partners_count?: number;
  revenue?: number;
}

interface CalculationResults {
  grossMargin: number;
  grossMarginPercentage: number;
  commissionMinPercentage: number;
  commissionMaxPercentage: number;
  commissionMinAmount: number;
  commissionMaxAmount: number;
  helperMessage: string;
  error: string | null;
}

export default function Programs() {
  const [programs, setPrograms] = useState<VendorProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const showForm = calculationResults && !calculationResults.error;

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error getting user:', userError);
        setError('Authentication error. Please sign in again.');
        setLoading(false);
        return;
      }

      if (!user) {
        console.log('No user found');
        setError('Please sign in to view your programs.');
        setLoading(false);
        return;
      }

      console.log('Fetching programs for user:', user.id);

      const { data, error: supabaseError } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error details:', {
          message: supabaseError.message,
          code: supabaseError.code,
          details: supabaseError.details,
          hint: supabaseError.hint,
        });
        throw supabaseError;
      }

      console.log('Fetched programs:', data?.length || 0, 'programs');

      // Fetch partners count and revenue for each program
      const programsData: VendorProgram[] = (data || []) as VendorProgram[];
      if (programsData && programsData.length > 0) {
        const programsWithStats = await Promise.all(
          programsData.map(async (program) => {
            // Get partners count
            const { count: partnersCount } = await supabase
              .from('affiliate_programs')
              .select('*', { count: 'exact', head: true })
              .eq('vendor_id', program.id)
              .eq('status', 'active');

            // Get revenue (sum of commission_amount from paid and pending commissions)
            const { data: referralsData } = await supabase
              .from('referrals')
              .select('commission_amount')
              .eq('vendor_id', program.id)
              .in('status', ['paid_commission', 'pending_commission']);

            const revenue = referralsData?.reduce((sum: number, ref: { commission_amount: string | number }) => {
              return sum + parseFloat(ref.commission_amount.toString() || '0');
            }, 0) || 0;

            return {
              ...program,
              partners_count: partnersCount || 0,
              revenue: revenue,
            };
          })
        );

        setPrograms(programsWithStats);
      } else {
        setPrograms([]);
      }
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string, programId: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(programId);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatRevenue = (revenue: number) => {
    return `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={cn(
      "flex flex-col w-full min-h-screen bg-black",
      "relative"
    )}>
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>

      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <div className="relative z-10">
          <VendorSidebar />
        </div>

        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 border-l border-gray-800 bg-[#070614] backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl font-semibold text-white mb-2">Your Programs</h1>
                <p className="text-sm text-gray-400">Manage all your referral programs</p>
              </div>
              {showCreateForm ? (
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setCalculationResults(null);
                  }}
                  variant="secondary"
                  size="md"
                  className=" bg-red-600 hover:bg-red-700 text-white border-red-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </Button>
              ) : (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="primary"
                  size="sm"
                  className="flex items-center gap-3 bg-green-900 hover:bg-green-600 text-white rounded-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Program</span>
                </Button>
              )}
            </div>

            {/* Create Program Section */}
            {showCreateForm && (
              <div className="mb-6">
                <div className={cn(
                  "grid gap-6",
                  showForm ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
                )}>
                  <CommissionCalculator onCalculate={setCalculationResults} />
                  {showForm && (
                    <OfferSetupForm onSave={() => {
                      setShowCreateForm(false);
                      setCalculationResults(null);
                      fetchPrograms();
                    }} />
                  )}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-400">Loading programs...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-md p-4 mb-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && programs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 border border-gray-800 rounded-lg">
                <Users className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 mb-2">No programs yet</p>
                <p className="text-sm text-gray-500">Create your first program from the dashboard</p>
                <Link
                  to="/"
                  className="mt-4 px-4 py-2 bg-white text-black rounded-md hover:bg-gray-100 transition text-sm font-medium"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

            {!loading && !error && programs.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => (
                  <div
                    key={program.id}
                    className="bg-gradient-to-br from-[#0f0e21] to-[#1a1929] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(255,75,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,75,0,0.08)]"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {program.program_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded-full font-medium",
                              program.is_active
                                ? "bg-[rgba(34,197,94,0.15)] text-green-500 border border-[rgba(34,197,94,0.3)]"
                                : "bg-[rgba(107,114,128,0.15)] text-gray-400 border border-[rgba(107,114,128,0.3)]"
                            )}
                          >
                            {program.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#9ca3af]" />
                          <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
                            Partners
                          </span>
                        </div>
                        <span className="text-lg font-bold text-white">{program.partners_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[#9ca3af]" />
                          <span className="text-xs uppercase tracking-wider text-[#9ca3af] font-medium">
                            Revenue
                          </span>
                        </div>
                        <span className="text-lg font-bold text-white">{formatRevenue(program.revenue || 0)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/p/${program.vendor_slug}`;
                          copyToClipboard(url, program.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-white transition"
                      >
                        {copiedUrl === program.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </>
                        )}
                      </button>
                      <Link
                        to={`/programs/${program.vendor_slug}/edit`}
                        className="flex-1 px-3 py-2 bg-[#ff4b00] hover:bg-[#ff5d1a] border border-[#ff4b00] rounded-lg text-sm text-white text-center transition font-medium"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


