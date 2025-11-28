import { DollarSign, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FundsOverviewProps {
  totalAvailable: number;
  totalCommissions: number;
  processingFee: number;
  projectedEarnings: number;
}

export default function FundsOverview({
  totalAvailable,
  totalCommissions,
  processingFee,
  projectedEarnings,
}: FundsOverviewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* Total Available Funds Card */}
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Total available funds</h3>
        <div className="mb-4">
          <p className="text-3xl font-bold text-white mb-6">
            ${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Total commissions:</span>
              <span className="text-white">${totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Processing fee:</span>
              <span className="text-red-400">-${Math.abs(processingFee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
            <div className="pt-2 border-t border-gray-800 flex justify-between text-white font-medium">
              <span>Total:</span>
              <span>${totalAvailable.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          *Exchange rates may fluctuate at time of withdrawal
        </p>
      </div>

      {/* Withdraw Funds To Card */}
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Withdraw funds to:</h3>
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-700/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Bank account (USD)</p>
                <p className="text-xs text-gray-400">**** **** **** 0650</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
          <button
            disabled={totalAvailable <= 0}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition",
              totalAvailable > 0
                ? "bg-white text-black hover:bg-gray-100"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            )}
          >
            Withdraw funds
          </button>
        </div>
      </div>

      {/* Projected Earnings Card */}
      <div className="bg-black/80 backdrop-blur-xl border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-400">Projected earnings for this month</h3>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <p className="text-3xl font-bold text-white mb-2">
          ${projectedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
        </p>
        <p className="text-xs text-gray-400">
          Total commissions that are pending approval and approved & pending for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        </p>
      </div>
    </div>
  );
}

