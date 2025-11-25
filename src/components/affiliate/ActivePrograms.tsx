import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Copy, Check, ExternalLink } from 'lucide-react';
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

  useEffect(() => {
    fetchUserAndPrograms();
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

      // Fetch affiliate programs with vendor details
      const { data, error } = await supabase
        .from('affiliate_programs')
        .select(`
          id,
          vendor_id,
          status,
          vendor:vendor_id (
            id,
            vendor_slug,
            program_name,
            commission_type,
            commission_value,
            destination_url
          )
        `)
        .eq('affiliate_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching programs:', error);
        setLoading(false);
        return;
      }

      // Transform the data to match our interface
      const transformedPrograms = (data || []).map((item: any) => ({
        id: item.id,
        vendor_id: item.vendor_id,
        status: item.status,
        vendor: item.vendor,
      }));

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

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-white" />
          <h2 className="text-lg font-semibold text-white">Active Programs</h2>
        </div>
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400 text-center">Loading programs...</p>
        </div>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ExternalLink className="w-5 h-5 text-white" />
          <h2 className="text-lg font-semibold text-white">Active Programs</h2>
        </div>
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-400 mb-2">No active programs yet</p>
          <p className="text-sm text-gray-500">Join a program to start earning commissions</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="w-5 h-5 text-white" />
        <h2 className="text-lg font-semibold text-white">Active Programs</h2>
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
              className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6"
            >
              {/* Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {program.program_name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Your Commission:</span>
                  <span className="text-sm font-semibold text-white">
                    {formatCommission(program)}
                  </span>
                </div>
              </div>

              {/* Tracking Link */}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Your Tracking Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-700 text-white text-sm rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(trackingLink, affiliateProgram.id)}
                    className={cn(
                      "px-4 py-2 rounded-md border transition",
                      copiedLinkId === affiliateProgram.id
                        ? "bg-green-900/30 border-green-800 text-green-400"
                        : "bg-gray-900/50 border-gray-700 text-white hover:bg-gray-800"
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
                <p className="text-xs text-gray-500 mt-2">
                  Share this link to track referrals and earn commissions
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

