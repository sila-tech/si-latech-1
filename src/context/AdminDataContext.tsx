
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCollection } from '@/firebase';

export interface AdminLoan {
  id: string;
  loanNumber: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  accountNumber?: string;
  displayName?: string;
  status: string;
  disbursementDate?: any;
  firstPaymentDate?: any;
  preferredPaymentDay?: string;
  paymentFrequency: 'daily' | 'weekly' | 'monthly';
  numberOfInstalments: number;
  instalmentAmount: number;
  totalRepayableAmount: number;
  totalPaid: number;
  principalAmount: number;
  idNumber?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  followUpNotes?: any[];
  payments?: { amount: number; date: any; staffId?: string }[];
  createdAt?: any;
}

export interface AdminInvestor {
  id: string;
  name: string;
  initialInvestment: number;
  currentBalance: number;
  interestRate?: number;
  createdAt: any;
  interestEntries?: any[];
  withdrawals?: any[];
  deposits?: any[];
}

interface AdminDataContextValue {
  loans: AdminLoan[] | null;
  loansLoading: boolean;
  investors: AdminInvestor[] | null;
  investorsLoading: boolean;
}

const AdminDataContext = createContext<AdminDataContextValue>({
  loans: null,
  loansLoading: true,
  investors: null,
  investorsLoading: true,
});

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const { data: loans, loading: loansLoading } = useCollection<AdminLoan>('loans');
  const { data: investors, loading: investorsLoading } = useCollection<AdminInvestor>('investors');

  return (
    <AdminDataContext.Provider value={{ 
        loans, loansLoading, 
        investors, investorsLoading
    }}>
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  return useContext(AdminDataContext);
}
