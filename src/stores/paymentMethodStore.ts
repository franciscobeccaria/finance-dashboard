import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PaymentMethod, BackendTransaction } from '@/services/api';

interface PaymentMethodSummary {
  name: string;
  amount: number;
  transactionCount: number;
  percentage: number;
  color?: string;
}

interface PaymentMethodStore {
  paymentMethods: PaymentMethod[];
  transactions: BackendTransaction[];
  calculatedPaymentMethods: PaymentMethodSummary[];
  isLoading: boolean;
  error: string | null;
  setPaymentMethods: (paymentMethods: PaymentMethod[]) => void;
  setTransactions: (transactions: BackendTransaction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getPaymentMethodById: (id: string) => PaymentMethod | undefined;
  getCalculatedPaymentMethods: () => PaymentMethodSummary[];
  resetData: () => void;
}

export const usePaymentMethodStore = create<PaymentMethodStore>()(persist(
  (set, get) => ({
    paymentMethods: [],
    transactions: [],
    calculatedPaymentMethods: [],
    isLoading: false,
    error: null,
    
    setPaymentMethods: (paymentMethods) => {
      set({ paymentMethods, error: null });
      // Trigger calculation
      const calculated = get().getCalculatedPaymentMethods();
      set({ calculatedPaymentMethods: calculated });
    },
    
    setTransactions: (transactions) => {
      set({ transactions });
      // Trigger calculation
      const calculated = get().getCalculatedPaymentMethods();
      set({ calculatedPaymentMethods: calculated });
    },
    
    setLoading: (isLoading) => {
      set({ isLoading });
    },
    
    setError: (error) => {
      set({ error, isLoading: false });
    },
    
    getPaymentMethodById: (id) => {
      const state = get();
      return state.paymentMethods.find(method => method.id === id);
    },
    
    getCalculatedPaymentMethods: () => {
      const state = get();
      const { paymentMethods, transactions } = state;
      
      // Use the same logic as PaymentMethodFilterDialog from home
      const paymentMethodMap = new Map<string, { amount: number; count: number }>();
      let totalAmount = 0;
      
      // Group transactions by payment method (exactly like home)
      transactions.forEach(transaction => {
        const paymentMethod = transaction.paymentMethod?.name || "Sin especificar";
        const amount = Math.abs(parseFloat(transaction.amount));
        
        totalAmount += amount;
        
        if (paymentMethodMap.has(paymentMethod)) {
          const existing = paymentMethodMap.get(paymentMethod)!;
          paymentMethodMap.set(paymentMethod, {
            amount: existing.amount + amount,
            count: existing.count + 1
          });
        } else {
          paymentMethodMap.set(paymentMethod, {
            amount: amount,
            count: 1
          });
        }
      });
      
      // Convert to array and calculate percentages (exactly like home)
      const allSummaries: PaymentMethodSummary[] = Array.from(paymentMethodMap.entries()).map(([name, data]) => ({
        name,
        amount: data.amount,
        transactionCount: data.count,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0
      }));
      
      // Filter out payment methods that no longer exist (except automatic ones like "Santander", "Naranja X", etc.)
      // This is the key logic from home
      const availablePaymentMethodNames = paymentMethods.map(pm => pm.name);
      const filteredSummaries = allSummaries.filter(summary => {
        // Always show automatic payment methods (non-Manual sources)
        if (summary.name !== "Manual" && summary.name !== "Sin especificar") {
          // Check if it's a custom payment method that was deleted
          if (summary.name !== "Santander" && summary.name !== "Naranja X" && summary.name !== "Belo") {
            return availablePaymentMethodNames.includes(summary.name);
          }
          return true; // Keep automatic payment methods
        }
        return true; // Keep "Manual" and "Sin especificar"
      });
      
      // Add colors for display (after filtering)
      const summariesWithColors: PaymentMethodSummary[] = filteredSummaries.map(summary => {
        // Find color from API payment methods
        let color = paymentMethods.find(pm => pm.name === summary.name)?.color;
        
        // Fallback colors for automatic payment methods (same as home)
        if (!color) {
          const automaticColorMap: Record<string, string> = {
            'Santander': 'text-red-600',
            'Naranja X': 'text-orange-500', 
            'Belo': 'text-violet-600',
          };
          color = automaticColorMap[summary.name];
        }
        
        return {
          ...summary,
          color
        };
      });
      
      // Sort by amount (descending) - same as home
      return summariesWithColors.sort((a, b) => b.amount - a.amount);
    },
    
    resetData: () => {
      set({ 
        paymentMethods: [], 
        transactions: [],
        calculatedPaymentMethods: [],
        isLoading: false, 
        error: null 
      });
    },
  }),
  {
    name: 'payment-method-store',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  }
));