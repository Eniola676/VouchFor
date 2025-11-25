import { useOfferData } from '../contexts/OfferDataContext';
import OfferSetupForm from '../components/OfferSetupForm';
import PartnerRecruitmentPage from './p/[vendorSlug]';
import { GridBackground } from '../components/ui/grid-background';
import { cn } from '../lib/utils';

export default function ProgramPreview() {
  const { offerData } = useOfferData();

  // Mock vendor data for preview
  const vendorData = {
    companyName: offerData.programName || 'Your Company',
    logo: null,
  };

  return (
    <div className="min-h-screen bg-black relative">
      <GridBackground />
      <div className={cn(
        "flex flex-col lg:flex-row h-screen overflow-hidden relative z-10"
      )}>
        {/* Left Side - Form */}
        <div className="lg:w-1/2 overflow-y-auto p-4 lg:p-8 border-r border-gray-800">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white mb-2">Program Setup</h1>
            <p className="text-sm text-gray-400">Fill out the form to see live preview</p>
          </div>
          <OfferSetupForm />
        </div>

        {/* Right Side - Preview */}
        <div className="lg:w-1/2 overflow-y-auto bg-black">
          <div className="sticky top-0 bg-black/80 backdrop-blur-sm border-b border-gray-800 p-4 z-10">
            <h2 className="text-lg font-semibold text-white">Live Preview</h2>
            <p className="text-xs text-gray-400">See how your program will look to partners</p>
          </div>
          <div className="scale-90 origin-top-left">
            <PartnerRecruitmentPage 
              offerData={offerData}
              vendorData={vendorData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

