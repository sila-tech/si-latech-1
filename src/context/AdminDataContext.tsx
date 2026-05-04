
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

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
  const firestore = useFirestore();

  const loansQuery = useMemoFirebase(
    () => collection(firestore, 'loans'),
    [firestore]
  );
  const investorsQuery = useMemoFirebase(
    () => collection(firestore, 'investors'),
    [firestore]
  );

  const { data: loans, isLoading: loansLoading } = useCollection<AdminLoan>(loansQuery);
  const { data: investors, isLoading: investorsLoading } = useCollection<AdminInvestor>(investorsQuery);

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
