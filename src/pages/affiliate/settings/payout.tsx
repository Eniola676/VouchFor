import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AffiliateSidebar } from '@/components/AffiliateSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { GridBackground } from '@/components/ui/grid-background';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { CreditCard, ArrowLeft, Building2, User, Hash, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function AffiliatePayoutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    swiftBicCode: '',
    bankAddress: '',
  });

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch payout details from affiliate_payout_details table
      const { data: payoutData } = await supabase
        .from('affiliate_payout_details')
        .select('*')
        .eq('affiliate_id', user.id)
        .single();

      if (payoutData) {
        setFormData({
          bankName: payoutData.bank_name || '',
          accountHolderName: payoutData.account_holder_name || '',
          accountNumber: payoutData.account_number || '',
          swiftBicCode: payoutData.swift_bic_code || '',
          bankAddress: payoutData.bank_address || '',
        });
      }
    } catch (err) {
      console.error('Error fetching payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Upsert payout details
      const { error } = await supabase
        .from('affiliate_payout_details')
        .upsert({
          affiliate_id: user.id,
          bank_name: formData.bankName,
          account_holder_name: formData.accountHolderName,
          account_number: formData.accountNumber,
          swift_bic_code: formData.swiftBicCode,
          bank_address: formData.bankAddress || null,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        throw error;
      }

      alert('Payout details saved successfully!');
    } catch (err) {
      console.error('Error saving payout details:', err);
      alert('Failed to save payout details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
        <GridBackground />
        <div className="relative z-20">
          <DashboardHeader />
        </div>
        <div className="flex items-center justify-center flex-1">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full min-h-screen bg-black", "relative")}>
      <GridBackground />
      
      {/* Top Header Bar */}
      <div className="relative z-20">
        <DashboardHeader />
      </div>
      
      <div className="flex flex-1 relative z-10">
        {/* Sidebar */}
        <div className="relative z-10">
          <AffiliateSidebar />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-1 relative z-10">
          <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black/95 backdrop-blur-xl flex flex-col gap-6 flex-1 w-full h-full overflow-y-auto">
            {/* Header with Back Button */}
            <div className="mb-6">
              <Link
                to="/affiliate/settings"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back to Settings</span>
              </Link>
              <h1 className="text-2xl font-semibold text-white mb-2">Payout Information</h1>
              <p className="text-sm text-gray-400">Manage your banking details for receiving commissions</p>
            </div>

            {/* Split Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left Side - Title and Helper Text */}
              <div className="space-y-6">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Payout Information</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                    Please provide accurate bank details. The vendor uses this information to manually send your commissions.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Bank information is securely stored and encrypted</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Only vendors you're partnered with can view your payout details</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Hash className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">Double-check all account numbers before saving</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Form */}
              <div>
                <form onSubmit={handleSubmit} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 space-y-6">
                  {/* Bank Name */}
                  <div>
                    <label htmlFor="bankName" className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter bank name"
                        required
                      />
                    </div>
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-300 mb-2">
                      Account Holder Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        id="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter account holder name"
                        required
                      />
                    </div>
                  </div>

                  {/* Account Number / IBAN */}
                  <div>
                    <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300 mb-2">
                      Account Number / IBAN *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        id="accountNumber"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter account number or IBAN"
                        required
                      />
                    </div>
                  </div>

                  {/* SWIFT / BIC Code */}
                  <div>
                    <label htmlFor="swiftBicCode" className="block text-sm font-medium text-gray-300 mb-2">
                      SWIFT / BIC Code *
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        id="swiftBicCode"
                        value={formData.swiftBicCode}
                        onChange={(e) => setFormData({ ...formData, swiftBicCode: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
                        placeholder="Enter SWIFT or BIC code"
                        required
                      />
                    </div>
                  </div>

                  {/* Bank Address */}
                  <div>
                    <label htmlFor="bankAddress" className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Address (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        id="bankAddress"
                        value={formData.bankAddress}
                        onChange={(e) => setFormData({ ...formData, bankAddress: e.target.value })}
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition resize-none"
                        placeholder="Enter bank address"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={saving}
                      fullWidth
                    >
                      {saving ? 'Saving...' : 'Save Payout Details'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


