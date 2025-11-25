import { createContext, useContext, useState, ReactNode } from 'react';

export interface OfferSetupFormData {
  destinationUrl: string;
  programName: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: string;
  cookieDuration: string;
  coolingOffPeriod: string;
  payoutSchedule: string;
  payoutMethod: 'bank_transfer' | 'other';
  minimumPayoutThreshold: string;
  transactionFees: 'vendor' | 'affiliate';
  servicePrice?: string; // Service price from calculator
}

interface OfferDataContextType {
  offerData: OfferSetupFormData;
  updateOfferData: (data: Partial<OfferSetupFormData>) => void;
  resetOfferData: () => void;
}

const defaultOfferData: OfferSetupFormData = {
  destinationUrl: '',
  programName: '',
  commissionType: 'percentage',
  commissionValue: '',
  cookieDuration: '60',
  coolingOffPeriod: '30',
  payoutSchedule: '',
  payoutMethod: 'bank_transfer',
  minimumPayoutThreshold: '10000',
  transactionFees: 'vendor',
  servicePrice: '',
};

const OfferDataContext = createContext<OfferDataContextType | undefined>(undefined);

export function OfferDataProvider({ children }: { children: ReactNode }) {
  const [offerData, setOfferData] = useState<OfferSetupFormData>(defaultOfferData);

  const updateOfferData = (data: Partial<OfferSetupFormData>) => {
    setOfferData((prev) => ({ ...prev, ...data }));
  };

  const resetOfferData = () => {
    setOfferData(defaultOfferData);
  };

  return (
    <OfferDataContext.Provider value={{ offerData, updateOfferData, resetOfferData }}>
      {children}
    </OfferDataContext.Provider>
  );
}

export function useOfferData() {
  const context = useContext(OfferDataContext);
  if (!context) {
    throw new Error('useOfferData must be used within an OfferDataProvider');
  }
  return context;
}

