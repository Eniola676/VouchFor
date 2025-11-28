import { useParams, Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { OfferSetupFormData, useOfferData } from '../../contexts/OfferDataContext';
import { GridBackground } from '../../components/ui/grid-background';

interface PartnerRecruitmentPageProps {
  offerData?: OfferSetupFormData;
  vendorData?: {
    companyName: string;
    logo?: string | null;
  };
}

export default function PartnerRecruitmentPage(props?: PartnerRecruitmentPageProps) {
  const { offerData: propOfferData, vendorData: propVendorData } = props || {};
  const { vendorSlug } = useParams<{ vendorSlug: string }>();
  
  // Get offerData from context (will work since we're wrapped in OfferDataProvider)
  // Use prop offerData first if provided (for preview mode), otherwise use context
  const contextData = useOfferData();
  const offerData = propOfferData || contextData.offerData;
  
  // Use provided vendor data or derive from offerData or fallback to defaults
  const vendorData = propVendorData || {
    companyName: offerData?.programName || 'Lumon Digital Agency',
    logo: null,
  };

  // Format commission display
  const formatCommission = () => {
    if (!offerData || !offerData.commissionValue) {
      return '15%';
    }
    if (offerData.commissionType === 'percentage') {
      return `${offerData.commissionValue}%`;
    } else {
      return `$${parseFloat(offerData.commissionValue).toLocaleString()}`;
    }
  };

  // Format payout schedule
  const formatPayoutSchedule = () => {
    const payoutSchedule = offerData?.payoutSchedule || 'upon_request';
    const scheduleMap: Record<string, string> = {
      'monthly_1st': 'Monthly (1st of the month)',
      'net_15': 'Net-15 (15 days after month end)',
      'net_30': 'Net-30 (30 days after month end)',
      'upon_request': 'Upon Request (Manual approval)',
    };
    const method = offerData?.payoutMethod === 'bank_transfer' ? 'via Bank Transfer' : 'via Manual Arrangement';
    return `${scheduleMap[payoutSchedule] || payoutSchedule} ${method}`;
  };

  // Format cookie duration
  const formatCookieDuration = () => {
    if (!offerData || !offerData.cookieDuration) {
      return '60 Days';
    }
    return `${offerData.cookieDuration} Days`;
  };

  // Calculate average payout based on actual service price and commission
  const formatAveragePayout = () => {
    if (!offerData || !offerData.commissionValue) {
      return '—';
    }
    
    if (offerData.commissionType === 'percentage') {
      // For percentage: calculate based on service price
      const servicePrice = parseFloat(offerData.servicePrice || '0');
      const percentage = parseFloat(offerData.commissionValue);
      
      if (servicePrice <= 0) {
        return '—';
      }
      
      const payout = (servicePrice * percentage) / 100;
      return `$${Math.round(payout).toLocaleString()}`;
    } else {
      // For fixed amount: use the commission value directly
      const fixedAmount = parseFloat(offerData.commissionValue);
      return `$${Math.round(fixedAmount).toLocaleString()}`;
    }
  };

  const headline = offerData?.programName 
    ? `Become a Growth Partner for ${vendorData.companyName}`
    : 'Become a Growth Partner for Acme Digital Agency';
  
  const subheadline = 'Earn high-ticket commissions by referring clients to our premium services.';

  return (
    <div className="min-h-screen bg-black text-white relative">
      <GridBackground />
      <div className="relative z-10">
        {/* Header Section - Branding & Trust */}
        <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            {/* Placeholder Logo */}
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-400 text-xl font-semibold">
                {vendorData.companyName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {vendorData.companyName}
              </h1>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            {headline}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl">
            {subheadline}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Offer Card Hero Section */}
        <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-8 md:p-12 mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">
            The Partner Offer
          </h3>
          
          {/* Primary Commission Highlight */}
          <div className="mb-8">
            <div className="text-5xl md:text-6xl font-bold text-white mb-2">
              {formatCommission()} Commission
            </div>
            <p className="text-xl text-gray-400">
              on every closed deal
            </p>
          </div>

          {/* Key Details List */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Average Payout: </span>
                <span className="text-gray-300">{formatAveragePayout()} per referral</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Cookie Duration: </span>
                <span className="text-gray-300">{formatCookieDuration()}</span>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Check className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-white font-medium">Payout Schedule: </span>
                <span className="text-gray-300">{formatPayoutSchedule()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold text-white mb-8 text-center">
            How It Works
          </h3>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Apply & Get Your Link
              </h4>
              <p className="text-gray-400 text-sm">
                Sign up and receive your unique referral tracking link to share with your network.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Share with your Network
              </h4>
              <p className="text-gray-400 text-sm">
                Promote our services through your channels, website, or personal connections.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">
                Earn when they Become Clients
              </h4>
              <p className="text-gray-400 text-sm">
                Get paid automatically when your referrals convert into paying customers.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link
            to={`/signup/affiliate?vendor=${vendorSlug || 'lumon-digital'}`}
            className="inline-block"
          >
            <span className="relative inline-flex items-center justify-center font-semibold text-lg px-8 py-4 rounded-md transition-all duration-200 bg-white text-black hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black active:scale-[0.98] w-full md:w-auto">
              Apply Now to Join Program
            </span>
          </Link>
        </div>
      </main>
      </div>
    </div>
  );
}

