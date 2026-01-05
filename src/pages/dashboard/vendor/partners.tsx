import { useState, useEffect } from 'react';
import { VendorSidebar } from '@/components/VendorSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Loader2, Users } from 'lucide-react';

interface Partner {
  affiliate_id: string;
  partner_name: string;
  program_id: string;
  program_name: string;
  revenue_generated: number;
  commission_to_pay: number;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get vendor's programs
      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('id, program_name')
        .eq('user_id', user.id);

      if (vendorsError) {
        throw vendorsError;
      }

      if (!vendors || vendors.length === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      const vendorIds = vendors.map((v) => v.id);
      const vendorMap = new Map(vendors.map((v) => [v.id, v.program_name]));

      // Get affiliates who joined vendor's programs
      const { data: affiliatePrograms, error: programsError } = await supabase
        .from('affiliate_programs')
        .select('affiliate_id, vendor_id')
        .in('vendor_id', vendorIds)
        .eq('status', 'active');

      if (programsError) {
        throw programsError;
      }

      if (!affiliatePrograms || affiliatePrograms.length === 0) {
        setPartners([]);
        setLoading(false);
        return;
      }

      // Get unique affiliate IDs
      const affiliateIds = [...new Set(affiliatePrograms.map((ap) => ap.affiliate_id))];

      // Get partner names using the database function that checks both profiles and auth.users
      const { data: userNames, error: namesError } = await supabase
        .rpc('get_user_names', { user_ids: affiliateIds });

      let profileMap: Map<string, string>;

      if (namesError) {
        console.warn('Error fetching user names from function, falling back to profiles:', namesError);
        
        // Fallback: Get partner names from profiles only
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', affiliateIds);

        if (profilesError) {
          throw profilesError;
        }

        profileMap = new Map(
          (profiles || []).map((p) => [
            p.id,
            p.full_name && p.full_name.trim() ? p.full_name : 'Unknown Partner'
          ])
        );
      } else {
        // Use the function results
        profileMap = new Map(
          (userNames || []).map((u: { user_id: string; full_name: string | null }) => [
            u.user_id,
            u.full_name && u.full_name.trim() ? u.full_name : 'Unknown Partner'
          ])
        );
      }

      // Ensure all affiliate IDs have a name
      affiliateIds.forEach((id) => {
        if (!profileMap.has(id)) {
          profileMap.set(id, 'Unknown Partner');
        }
      });

      // Get all referrals for these affiliates and vendors
      const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select('affiliate_id, vendor_id, status, commission_amount')
        .in('affiliate_id', affiliateIds)
        .in('vendor_id', vendorIds);

      if (referralsError) {
        throw referralsError;
      }

      // Calculate stats per partner-program combination
      const partnerMap = new Map<string, Partner>();

      affiliatePrograms.forEach((ap) => {
        const key = `${ap.affiliate_id}-${ap.vendor_id}`;
        const partnerName = profileMap.get(ap.affiliate_id) || 'Unknown Partner';
        const programName = vendorMap.get(ap.vendor_id) || 'Unknown Program';

        if (!partnerMap.has(key)) {
          partnerMap.set(key, {
            affiliate_id: ap.affiliate_id,
            partner_name: partnerName,
            program_id: ap.vendor_id,
            program_name: programName,
            revenue_generated: 0,
            commission_to_pay: 0,
          });
        }
      });

      // Calculate revenue and commission for each partner-program
      (referrals || []).forEach((ref) => {
        const key = `${ref.affiliate_id}-${ref.vendor_id}`;
        const partner = partnerMap.get(key);

        if (partner) {
          const amount = typeof ref.commission_amount === 'string'
            ? parseFloat(ref.commission_amount)
            : Number(ref.commission_amount) || 0;

          // Revenue generated = sum of all commissions (paid + pending)
          if (ref.status === 'paid_commission' || ref.status === 'pending_commission') {
            partner.revenue_generated += amount;
          }

          // Commission to pay = sum of pending commissions
          if (ref.status === 'pending_commission') {
            partner.commission_to_pay += amount;
          }
        }
      });

      setPartners(Array.from(partnerMap.values()));
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch partners');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
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
            {/* Page Header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-white" />
                <h1 className="text-2xl font-semibold text-white">Partners</h1>
              </div>
              <p className="text-sm text-gray-400">View your affiliate partners and their performance</p>
            </div>

            {loading ? (
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-12 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-400" />
                  <p className="text-gray-400">Loading partners...</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-black/80 backdrop-blur-xl border border-red-800 rounded-lg p-6">
                <p className="text-red-400 text-center">
                  Error loading partners: {error}
                </p>
              </div>
            ) : partners.length === 0 ? (
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-12 text-center">
                <p className="text-gray-400 mb-2">No partners yet</p>
                <p className="text-sm text-gray-500">Partners will appear here once they join your programs</p>
              </div>
            ) : (
              <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg overflow-hidden">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50 border-b border-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Partner Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Program Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Revenue Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Commission to Pay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {partners.map((partner, index) => (
                        <tr key={`${partner.affiliate_id}-${partner.program_id}-${index}`} className="hover:bg-gray-900/30 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                            {partner.partner_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {partner.program_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                            ${partner.revenue_generated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-400 font-semibold">
                            ${partner.commission_to_pay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

