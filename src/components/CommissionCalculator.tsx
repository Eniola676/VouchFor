import { useState, FormEvent } from 'react';
import Button from './ui/Button';
import { useOfferData } from '../contexts/OfferDataContext';

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

interface CommissionCalculatorProps {
  onCalculate?: (results: CalculationResults) => void;
}

function CommissionCalculator({ onCalculate }: CommissionCalculatorProps) {
  const [servicePrice, setServicePrice] = useState<string>('');
  const [hardCosts, setHardCosts] = useState<string>('');
  const [desiredProfit, setDesiredProfit] = useState<string>('');
  const [results, setResults] = useState<CalculationResults | null>(null);
  const { updateOfferData } = useOfferData();

  const calculate = () => {
    const price = parseFloat(servicePrice) || 0;
    const costs = parseFloat(hardCosts) || 0;
    const desired = parseFloat(desiredProfit) || 0;

    // Basic validations
    if (price <= 0) {
      alert('Please enter a valid service price');
      return;
    }
    if (costs < 0) {
      alert('Costs cannot be negative');
      return;
    }

    const grossMargin = price - costs;
    const grossMarginPercentage = (grossMargin / price) * 100;

    // Maximum commission allowed to maintain desired profit
    let commissionMaxPercentage = ((price - costs - desired) / price) * 100;
    commissionMaxPercentage = Math.max(0, commissionMaxPercentage);

    // Minimum commission: optional business rule, must not exceed max
    let commissionMinPercentage = Math.min(5, commissionMaxPercentage);

    // Dollar amounts
    const commissionMinAmount = (price * commissionMinPercentage) / 100;
    const commissionMaxAmount = (price * commissionMaxPercentage) / 100;

    // Helper message
    let helperMessage = '';
    let error: string | null = null;

    if (commissionMaxPercentage === 0) {
      helperMessage = 'You cannot afford to pay a commission and still meet your desired profit.';
    } else if (grossMarginPercentage > 70) {
      helperMessage = 'You have high margins! Be aggressive to attract top partners.';
    } else if (grossMarginPercentage >= 40) {
      helperMessage = 'This is a standard, competitive range for service businesses.';
    } else {
      helperMessage = 'Your margins are tight. Offer a lower percentage to stay profitable.';
    }

    const successResults: CalculationResults = {
      grossMargin,
      grossMarginPercentage,
      commissionMinPercentage,
      commissionMaxPercentage,
      commissionMinAmount,
      commissionMaxAmount,
      helperMessage,
      error,
    };

    setResults(successResults);
    updateOfferData({ servicePrice });
    onCalculate?.(successResults);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    calculate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-black/80 backdrop-blur-xl rounded-lg border border-gray-800 p-8">
      <h2 className="text-2xl font-semibold text-white mb-6">
        Smart Commission Calculator
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Price */}
        <div>
          <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-300 mb-2">
            How much do you charge for this service? ($)
          </label>
          <input
            type="number"
            id="servicePrice"
            value={servicePrice}
            onChange={(e) => setServicePrice(e.target.value)}
            placeholder="Enter service price ($)"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-gray-500">
            The total amount the client pays you.
          </p>
        </div>

        {/* Hard Costs */}
        <div>
          <label htmlFor="hardCosts" className="block text-sm font-medium text-gray-300 mb-2">
            What are your direct costs to deliver it? ($)
          </label>
          <input
            type="number"
            id="hardCosts"
            value={hardCosts}
            onChange={(e) => setHardCosts(e.target.value)}
            placeholder="Enter direct costs ($)"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-gray-500">
            Money that leaves your pocket per sale (e.g., subcontractors, materials). Not rent or salary.
          </p>
        </div>

        {/* Desired Profit */}
        <div>
          <label htmlFor="desiredProfit" className="block text-sm font-medium text-gray-300 mb-2">
            How much minimum profit do you want to keep? ($)
          </label>
          <input
            type="number"
            id="desiredProfit"
            value={desiredProfit}
            onChange={(e) => setDesiredProfit(e.target.value)}
            placeholder="Enter desired profit ($)"
            className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 rounded-md focus:ring-2 focus:ring-primary-600 focus:border-primary-600 outline-none transition"
            required
            min="0"
            step="0.01"
          />
          <p className="mt-1 text-xs text-gray-500">
            After costs, how much must you take home? The rest is your marketing budget.
          </p>
        </div>

        <Button type="submit" variant="primary" size="md" fullWidth>
          Calculate
        </Button>
      </form>

      {results && (
        <div className="mt-8 pt-6 border-t border-gray-800">
          {results.error ? (
            <div className="bg-red-900/20 border border-red-800 rounded-md p-4">
              <p className="text-red-400 text-sm">{results.error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-900/50 rounded-md p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-1">
                  Maximum you can afford to pay a partner:
                </h3>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(results.commissionMinAmount)} - {formatCurrency(results.commissionMaxAmount)}
                </p>
              </div>

              <div className="bg-gray-900/50 rounded-md p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  Recommended Commission Percentage Range
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xl font-semibold text-white">
                    {results.commissionMinPercentage % 1 === 0 
                      ? results.commissionMinPercentage 
                      : results.commissionMinPercentage.toFixed(1)}%
                  </span>
                  <span className="text-gray-500">to</span>
                  <span className="text-xl font-semibold text-white">
                    {results.commissionMaxPercentage % 1 === 0 
                      ? results.commissionMaxPercentage 
                      : results.commissionMaxPercentage.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2 italic">{results.helperMessage}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommissionCalculator;