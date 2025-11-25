import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import FormTooltip from './ui/FormTooltip';
import Button from './ui/Button';
import { useOfferData } from '../contexts/OfferDataContext';
import { supabase } from '../lib/supabase';

interface OfferSetupFormProps {
  onSave?: () => void;
}

// Helper function to create a slug from program name
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export default function OfferSetupForm({ onSave }: OfferSetupFormProps) {
  const { offerData, updateOfferData } = useOfferData();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Generate vendor slug from program name or use default
      const vendorSlug = offerData.programName 
        ? createSlug(offerData.programName)
        : 'my-program';

      // Prepare data for Supabase
      const vendorData = {
        vendor_slug: vendorSlug,
        destination_url: offerData.destinationUrl,
        program_name: offerData.programName,
        commission_type: offerData.commissionType,
        commission_value: offerData.commissionValue,
        cookie_duration: parseInt(offerData.cookieDuration, 10),
        cooling_off_period: parseInt(offerData.coolingOffPeriod, 10),
        payout_schedule: offerData.payoutSchedule,
        payout_method: offerData.payoutMethod,
        minimum_payout_threshold: offerData.minimumPayoutThreshold,
        transaction_fees: offerData.transactionFees,
        service_price: offerData.servicePrice || null,
        is_active: true,
        published_at: new Date().toISOString(),
      };

      // Insert into Supabase
      const { data, error: supabaseError } = await supabase
        .from('vendors')
        .insert([vendorData])
        .select()
        .single();

      if (supabaseError) {
        console.error('Supabase error details:', supabaseError);
        
        // Handle unique constraint violation (slug already exists)
        if (supabaseError.code === '23505') {
          setError('A program with this name already exists. Please choose a different name.');
          setIsSaving(false);
          return;
        }
        
        // Handle RLS policy errors
        if (supabaseError.code === '42501' || supabaseError.message?.includes('permission denied')) {
          setError('Permission denied. Please check your Supabase RLS policies or run the SQL schema.');
          setIsSaving(false);
          return;
        }
        
        // Handle missing table
        if (supabaseError.code === '42P01' || supabaseError.message?.includes('does not exist')) {
          setError('Database table not found. Please run the SQL schema in Supabase SQL Editor.');
          setIsSaving(false);
          return;
        }
        
        // Show detailed error for debugging
        setError(`Failed to save: ${supabaseError.message || JSON.stringify(supabaseError)}`);
        setIsSaving(false);
        return;
      }

      console.log('Vendor saved successfully:', data);

      // Navigate to the recruitment page
      navigate(`/p/${vendorSlug}`);
      
      if (onSave) {
        onSave();
      }
    } catch (err) {
      console.error('Error saving vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to save program. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl rounded-lg border border-gray-800 p-8 h-fit">
      <h3 className="text-xl font-semibold text-white mb-4">
        Program Setup
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Destination URL */}
        <div>
          <label htmlFor="destinationUrl" className="flex items-center text-sm font-medium text-gray-300 mb-2">
            Destination URL
            <FormTooltip content="The exact link where you want traffic to go. This is where the actual sale happens (e.g., your Calendly booking page, Paystack payment link, or main website service page)." />
          </label>
          <input
            type="url"
            id="destinationUrl"
            value={offerData.destinationUrl}
            onChange={(e) => updateOfferData({ destinationUrl: e.target.value })}
            placeholder="https://your-website.com/booking-page"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Where should affiliates send traffic? This is the page where the customer actually converts (e.g., your Calendly link, Paystack page, or main website).
          </p>
        </div>

        {/* Program Public Name */}
        <div>
          <label htmlFor="programName" className="flex items-center text-sm font-medium text-gray-300 mb-2">
            Program Public Name
            <FormTooltip content="This is the name affiliates will see when they join. Make it clear, e.g., 'Acme Agency Premium Partner Program'." />
          </label>
          <input
            type="text"
            id="programName"
            value={offerData.programName}
            onChange={(e) => updateOfferData({ programName: e.target.value })}
            placeholder="My Agency Referral Program"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
          />
        </div>

        {/* Commission Type */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
            Commission Type
            <FormTooltip content="Choose how you calculate the reward. Percentage is best for varied pricing; Flat Fee is good for standard packages." />
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="commissionType"
                value="percentage"
                checked={offerData.commissionType === 'percentage'}
                onChange={(e) => updateOfferData({ commissionType: e.target.value as 'percentage' | 'fixed' })}
                className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-300">Percentage (%)</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="commissionType"
                value="fixed"
                checked={offerData.commissionType === 'fixed'}
                onChange={(e) => updateOfferData({ commissionType: e.target.value as 'percentage' | 'fixed' })}
                className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
              />
              <span className="ml-2 text-sm text-gray-300">Fixed Amount ($)</span>
            </label>
          </div>
        </div>

        {/* Commission Value */}
        <div>
          <label htmlFor="commissionValue" className="flex items-center text-sm font-medium text-gray-300 mb-2">
            Commission Value
            <FormTooltip content="The actual number. e.g., Enter '15' for 15%, or '50000' for $50,000. Based on your calculator results." />
          </label>
          <input
            type="number"
            id="commissionValue"
            value={offerData.commissionValue}
            onChange={(e) => updateOfferData({ commissionValue: e.target.value })}
            placeholder={offerData.commissionType === 'percentage' ? 'Enter percentage (e.g., 15)' : 'Enter amount (e.g., 50000)'}
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
            min="0"
            step="0.01"
          />
        </div>

        {/* Cookie Duration */}
        <div>
          <label htmlFor="cookieDuration" className="flex items-center text-sm font-medium text-gray-300 mb-2">
            Cookie Duration (Days)
            <FormTooltip content="How long does a referral last? If a customer clicks today but buys in 30 days, the affiliate still gets credit. Standard is 60-90 days." />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              id="cookieDuration"
              value={offerData.cookieDuration}
              onChange={(e) => updateOfferData({ cookieDuration: e.target.value })}
              className="w-32 px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
              required
              min="1"
            />
            <span className="text-sm text-gray-400">days</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            How long a referral gets credit after the first click.
          </p>
        </div>

        {/* Payout Policy & Schedule Section */}
        <div className="pt-4 border-t border-gray-800">
          <h4 className="text-lg font-semibold text-white mb-4">
            Payout Policy & Schedule
          </h4>

          {/* Refund / Cooling-off Period */}
          <div className="mb-6 p-4 bg-gray-900/30 border border-yellow-800/50 rounded-md">
            <label htmlFor="coolingOffPeriod" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              <Shield className="w-4 h-4 text-yellow-500 mr-1.5" />
              Refund / Cooling-off Period (Days)
              <FormTooltip content="CRITICAL FOR FRAUD PREVENTION. Commissions will be locked for this many days after a sale to ensure the customer doesn't demand a refund." />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                id="coolingOffPeriod"
                value={offerData.coolingOffPeriod}
                onChange={(e) => updateOfferData({ coolingOffPeriod: e.target.value })}
                className="w-32 px-4 py-2 bg-gray-900/50 border border-yellow-700/50 text-white rounded-md focus:ring-2 focus:ring-yellow-600 focus:border-yellow-600 outline-none transition"
                required
                min="0"
              />
              <span className="text-sm text-gray-400">days</span>
            </div>
            <p className="mt-1 text-xs text-yellow-400/80">
              How many days can a customer get a refund? Commissions will be LOCKED until this period passes to prevent fraud.
            </p>
          </div>

          {/* Payout Schedule */}
          <div className="mb-6">
            <label htmlFor="payoutSchedule" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              Payout Schedule
              <FormTooltip content="When do you process payments? 'Net-15' means 15 days after the month ends. Clarity here prevents angry follow-ups." />
            </label>
            <select
              id="payoutSchedule"
              value={offerData.payoutSchedule}
              onChange={(e) => updateOfferData({ payoutSchedule: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
              required
            >
              <option value="">Select payout schedule</option>
              <option value="monthly_1st">Monthly (1st of the month for previous month's sales)</option>
              <option value="net_15">Net-15 (15 days after end of the month)</option>
              <option value="net_30">Net-30 (30 days after end of the month)</option>
              <option value="upon_request">Upon Request (Manual approval)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Define the exact timeline for processing commissions.
            </p>
          </div>

          {/* Payout Method */}
          <div className="mb-6">
            <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
              Payout Method
              <FormTooltip content="How will you actually send the money? For this MVP, manual bank transfer is the standard method." />
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="payoutMethod"
                  value="bank_transfer"
                  checked={offerData.payoutMethod === 'bank_transfer'}
                  onChange={(e) => updateOfferData({ payoutMethod: e.target.value as 'bank_transfer' | 'other' })}
                  className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">Direct Bank Transfer (USD)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="payoutMethod"
                  value="other"
                  checked={offerData.payoutMethod === 'other'}
                  onChange={(e) => updateOfferData({ payoutMethod: e.target.value as 'bank_transfer' | 'other' })}
                  className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">Other (Manual Arrangement)</span>
              </label>
            </div>
          </div>

          {/* Minimum Payout Threshold */}
          <div className="mb-6">
            <label htmlFor="minimumPayoutThreshold" className="flex items-center text-sm font-medium text-gray-300 mb-2">
              Minimum Payout Threshold
              <FormTooltip content="Don't waste time sending tiny amounts. Affiliates must earn at least this much before you cut a check." />
            </label>
            <input
              type="number"
              id="minimumPayoutThreshold"
              value={offerData.minimumPayoutThreshold}
              onChange={(e) => updateOfferData({ minimumPayoutThreshold: e.target.value })}
              placeholder="10000"
              className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
              required
              min="0"
              step="1"
            />
            <p className="mt-1 text-xs text-gray-500">
              Affiliates must earn at least this much before you send a payment. Helps avoid tiny transfers.
            </p>
          </div>

          {/* Transaction Fees */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
              Transaction Fees
              <FormTooltip content="Bank transfers cost money. Decide upfront who eats that cost to avoid surprises later." />
            </label>
            <div className="flex flex-col gap-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transactionFees"
                  value="vendor"
                  checked={offerData.transactionFees === 'vendor'}
                  onChange={(e) => updateOfferData({ transactionFees: e.target.value as 'vendor' | 'affiliate' })}
                  className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">Vendor (You cover bank charges)</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="transactionFees"
                  value="affiliate"
                  checked={offerData.transactionFees === 'affiliate'}
                  onChange={(e) => updateOfferData({ transactionFees: e.target.value as 'vendor' | 'affiliate' })}
                  className="w-4 h-4 text-primary-600 bg-gray-900/50 border-gray-700 focus:ring-primary-600 focus:ring-2"
                />
                <span className="ml-2 text-sm text-gray-300">Affiliate (Deducted from their commission)</span>
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Be transparent about who pays the bank transfer fees.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Program Rules'}
        </Button>
      </form>
    </div>
  );
}
