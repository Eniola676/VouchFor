import { useState } from 'react';
import CommissionCalculator from '../components/CommissionCalculator';
import OfferSetupForm from '../components/OfferSetupForm';
import { VouchForSidebar } from '../components/VouchForSidebar';
import { GridBackground } from '../components/ui/grid-background';
import { cn } from '../lib/utils';

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

export default function Dashboard() {
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const showForm = calculationResults && !calculationResults.error;

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row bg-black w-full flex-1 min-h-screen",
      "overflow-hidden relative"
    )}>
      <GridBackground />
      <div className="relative z-10">
        <VouchForSidebar />
      </div>
      
      <div className="flex flex-1 relative z-10">
        <div className="p-2 md:p-10 rounded-tl-2xl border-l border-gray-800 bg-black flex flex-col gap-2 flex-1 w-full h-full">
            <div className="mb-4">
              <h1 className="text-2xl font-semibold text-white mb-2">Vendor Dashboard</h1>
              <p className="text-sm text-gray-400">Manage your referral program and commissions</p>
            </div>
            
            {/* Two-column layout when results are available, single column otherwise */}
            <div className={cn(
              "grid gap-6",
              showForm ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
            )}>
              <CommissionCalculator onCalculate={setCalculationResults} />
              {showForm && (
                <OfferSetupForm />
              )}
            </div>
        </div>
      </div>
    </div>
  );
}

