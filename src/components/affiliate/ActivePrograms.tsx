import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, ExternalLink, LogOut, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Program {
  id: string;
  vendor_id: string;
  program_name: string;
  commission_type: 'percentage' | 'fixed';
  commission_value: string;
  destination_url: string;
  vendor_slug: string;
}

interface AffiliateProgram {
  id: string;
  vendor_id: string;
  status: string;
  vendor: Program;
}

export default function ActivePrograms() {
  const [programs, setPrograms] = useState<AffiliateProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [leavingProgramId, setLeavingProgramId] = useState<string | null>(null);
  const [showConfirmLeave, setShowConfirmLeave] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndPrograms();
    
    // Refetch when window gains focus (e.g., after returning from signup)
    const handleFocus = () => {
      fetchUserAndPrograms();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Also refetch after a short delay to catch any async signup completion
    const timeoutId = setTimeout(() => {
      fetchUserAndPrograms();
    }, 2000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timeoutId);
    };
  }, []);

  const fetchUserAndPrograms = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Fetch affiliate programs
      const { data: affiliateProgramsData, error: affiliateError } = await supabase
        .from('affiliate_programs')
        .select('id, vendor_id, status, created_at')
        .eq('affiliate_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (affiliateError) {
        console.error('Error fetching affiliate programs:', affiliateError);
        console.error('Error details:', {
          message: affiliateError.message,
          code: affiliateError.code,
          details: affiliateError.details,
          hint: affiliateError.hint,
        });
        setLoading(false);
        return;
      }

      if (!affiliateProgramsData || affiliateProgramsData.length === 0) {
        console.log('No affiliate programs found for user:', user.id);
        console.log('User ID:', user.id);
        setPrograms([]);
        setLoading(false);
        return;
      }

      console.log('Found affiliate programs:', affiliateProgramsData.length, affiliateProgramsData);

      // Fetch vendor details for each program
      interface AffiliateProgramRow {
        id: string;
        vendor_id: string;
        status: string;
        created_at: string;
      }
      
      const vendorIds = affiliateProgramsData.map((ap: AffiliateProgramRow) => ap.vendor_id);
      const { data: vendorsData, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, vendor_slug, program_name, commission_type, commission_value, destination_url')
        .in('id', vendorIds)
        .eq('is_active', true);

      if (vendorsError) {
        console.error('Error fetching vendors:', vendorsError);
        setLoading(false);
        return;
      }

      // Combine affiliate_programs with vendor data
      interface VendorRow {
        id: string;
        vendor_slug: string;
        program_name: string;
        commission_type: 'percentage' | 'fixed';
        commission_value: string;
        destination_url: string;
      }
      
      const transformedPrograms: AffiliateProgram[] = affiliateProgramsData
        .map((ap: AffiliateProgramRow) => {
          const vendor = vendorsData?.find((v: VendorRow) => v.id === ap.vendor_id);
          if (!vendor) {
            console.warn('Vendor not found for vendor_id:', ap.vendor_id);
            return null;
          }
          return {
            id: ap.id,
            vendor_id: ap.vendor_id,
            status: ap.status,
            vendor: vendor as Program,
          };
        })
        .filter((p: AffiliateProgram | null): p is AffiliateProgram => p !== null);

      console.log('Transformed programs:', transformedPrograms);
      setPrograms(transformedPrograms);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateTrackingLink = (affiliateId: string, vendorId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/go/${affiliateId}/${vendorId}`;
  };

  const copyToClipboard = async (link: string, programId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(programId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatCommission = (program: Program) => {
    if (program.commission_type === 'percentage') {
      return `${program.commission_value}%`;
    } else {
      return `$${parseFloat(program.commission_value).toLocaleString()}`;
    }
  };

  const handleLeaveProgram = async (affiliateProgramId: string, programName: string) => {
    try {
      setLeavingProgramId(affiliateProgramId);
      
      const { error } = await supabase
        .from('affiliate_programs')
        .delete()
        .eq('id', affiliateProgramId);

      if (error) {
        console.error('Error leaving program:', error);
        alert('Failed to leave program. Please try again.');
        setLeavingProgramId(null);
        return;
      }

      // Remove from local state
      setPrograms(programs.filter(p => p.id !== affiliateProgramId));
      setShowConfirmLeave(null);
      alert(`You have successfully left the ${programName} program.`);
    } catch (err) {
      console.error('Error:', err);
      alert('Failed to leave program. Please try again.');
    } finally {
      setLeavingProgramId(null);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Active Programs</h2>
        </div>
        <div className="bg-surface-elevated backdrop-blur-xl border border-border rounded-lg p-6">
          <p className="text-text-secondary text-center">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-text-primary" />
          <h2 className="text-lg font-semibold text-text-primary">Active Programs</h2>
        </div>
        <div className="bg-surface-elevated backdrop-blur-xl border border-border rounded-lg p-6 text-center">
          <p className="text-text-secondary mb-2">No active programs yet</p>
          <p className="text-sm text-text-tertiary">Join a program to start earning commissions</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="w-5 h-5 text-text-primary" />
        <h2 className="text-lg font-semibold text-text-primary">Active Programs</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {programs.map((affiliateProgram) => {
          const program = affiliateProgram.vendor;
          const trackingLink = currentUserId 
            ? generateTrackingLink(currentUserId, program.id)
            : '';

          return (
            <div
              key={affiliateProgram.id}
              className="bg-surface-elevated backdrop-blur-xl border border-border rounded-lg p-6"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {program.program_name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">Your Commission:</span>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCommission(program)}
                  </span>
                </div>
              </div>

              {/* Tracking Link */}
              <div className="mt-4 pt-4 border-t border-border">
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  Your Unique Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-bg-secondary border border-border text-text-primary text-sm rounded-md focus:ring-2 focus:ring-accent focus:border-accent outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(trackingLink, affiliateProgram.id)}
                    className={cn(
                      "px-4 py-2 rounded-md border transition",
                      copiedLinkId === affiliateProgram.id
                        ? "bg-green-900/30 border-green-800 text-green-400"
                        : "bg-bg-secondary border-border text-text-primary hover:bg-bg-tertiary"
                    )}
                    title="Copy to clipboard"
                  >
                    {copiedLinkId === affiliateProgram.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Share this link to earn commissions on referrals
                </p>
              </div>

              {/* Leave Program Button */}
              <div className="mt-4 pt-4 border-t border-border">
                {showConfirmLeave === affiliateProgram.id ? (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">Leave Program?</h4>
                        <p className="text-xs text-text-secondary">
                          Are you sure you want to leave this program? You'll stop earning commissions and your tracking link will no longer work.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLeaveProgram(affiliateProgram.id, program.program_name)}
                        disabled={leavingProgramId === affiliateProgram.id}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {leavingProgramId === affiliateProgram.id ? 'Leaving...' : 'Yes, Leave Program'}
                      </button>
                      <button
                        onClick={() => setShowConfirmLeave(null)}
                        disabled={leavingProgramId === affiliateProgram.id}
                        className="flex-1 px-4 py-2 bg-bg-tertiary hover:bg-bg-secondary border border-border text-text-primary text-sm rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmLeave(affiliateProgram.id)}
                    disabled={leavingProgramId === affiliateProgram.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-bg-secondary hover:bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary text-sm rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Program
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

