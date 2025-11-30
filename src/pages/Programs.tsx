import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { VendorSidebar } from '../components/VendorSidebar';
import DashboardHeader from '../components/DashboardHeader';
import { GridBackground } from '../components/ui/grid-background';
import CommissionCalculator from '../components/CommissionCalculator';
import OfferSetupForm from '../components/OfferSetupForm';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ExternalLink, Calendar, DollarSign, Users, Plus, X } from 'lucide-react';
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
      setPrograms(data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  };

  const formatCommission = (program: VendorProgram) => {
    if (program.commission_type === 'percentage') {
      return `${program.commission_value}%`;
    } else {
      return `$${parseFloat(program.commission_value).toLocaleString()}`;
    }
  };

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
          <VendorSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
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
                    className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {program.program_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs px-2 py-1 rounded",
                              program.is_active
                                ? "bg-green-900/30 text-green-400 border border-green-800"
                                : "bg-gray-900/30 text-gray-400 border border-gray-800"
                            )}
                          >
                            {program.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">
                          Commission: <span className="text-white font-medium">{formatCommission(program)}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">
                          Cookie: <span className="text-white font-medium">{program.cookie_duration} days</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-gray-800">
                      <Link
                        to={`/p/${program.vendor_slug}`}
                        target="_blank"
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 rounded-md text-sm text-white transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Page
                      </Link>
                      <Link
                        to={`/programs/${program.vendor_slug}/edit`}
                        className="flex-1 px-3 py-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 rounded-md text-sm text-white text-center transition"
                      >
                        Edit
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


