import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  Gasto,
  Installment,
  VariableExpense,
  PaymentRecord,
  PaymentStatus,
  CreateInstallmentForm,
  CreateVariableExpenseForm,
  UpdateGastoForm,
  GastoFilters,
  GastoSummary,
  isInstallment,
  isVariableExpense
} from '@/types/gastos';
import { format, addMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

// Helper function to generate gasto summary
const generateGastoSummary = (gastos: Gasto[]): GastoSummary => {
  const installments = gastos.filter(g => g.type === 'installment') as Installment[];
  const variableExpenses = gastos.filter(g => g.type === 'variable_expense') as VariableExpense[];
  
  const monthlyInstallments = installments
    .filter(i => i.status === 'active')
    .reduce((sum, i) => sum + i.installment_amount, 0);
  
  const monthlyVariableExpenses = variableExpenses
    .filter(v => v.status === 'active')
    .reduce((sum, v) => sum + v.estimated_amount, 0);
  
  return {
    total_gastos: gastos.length,
    active_gastos: gastos.filter(g => 
      (g.type === 'installment' && (g as Installment).status === 'active') ||
      (g.type === 'variable_expense' && (g as VariableExpense).status === 'active')
    ).length,
    total_installments: installments.length,
    active_installments: installments.filter(i => i.status === 'active').length,
    completed_installments: installments.filter(i => i.status === 'completed').length,
    paused_installments: installments.filter(i => i.status === 'paused').length,
    total_variable_expenses: variableExpenses.length,
    active_variable_expenses: variableExpenses.filter(v => v.status === 'active').length,
    monthly_installments: monthlyInstallments,
    monthly_variable_expenses: monthlyVariableExpenses,
    total_monthly_expenses: monthlyInstallments + monthlyVariableExpenses
  };
};

interface GastoStore {
  // State
  gastos: Gasto[];
  isLoading: boolean;
  error: string | null;
  filters: GastoFilters;
  
  // Actions - Generic
  loadGastos: () => void;
  deleteGasto: (id: string) => Promise<void>;
  toggleGastoActive: (id: string) => Promise<void>;
  
  // Actions - Installment specific  
  addInstallment: (form: CreateInstallmentForm) => Promise<Installment>;
  markInstallmentPayment: (id: string, paymentNumber: number, paid: boolean) => Promise<void>;
  
  // Actions - Variable Expense specific
  addVariableExpense: (form: CreateVariableExpenseForm) => Promise<VariableExpense>;
  updateVariableExpense: (id: string, updates: Partial<CreateVariableExpenseForm>) => Promise<VariableExpense>;
  recordVariablePayment: (id: string, month: string, actualAmount: number, paymentDate?: string, notes?: string) => Promise<void>;
  updateEstimatedAmount: (id: string, newAmount: number) => Promise<void>;
  
  // Filters & Search
  setFilters: (filters: Partial<GastoFilters>) => void;
  clearFilters: () => void;
  getFilteredGastos: () => Gasto[];
  getGastosByType: <T extends Gasto>(type: T['type']) => T[];
  
  // Computed data
  getSummary: () => GastoSummary;
  getMonthlyExpenses: (date?: Date) => number;
  getUpcomingPayments: (monthsAhead?: number) => Gasto[];
  
  // Utilities
  refreshData: () => void;
  clearError: () => void;
  getGastoById: (id: string) => Gasto | undefined;
  getAllGastos: () => Gasto[];
  resetData: () => void;
}

// Helper function to calculate installment computed fields
const calculateInstallmentFields = (installment: Omit<Installment, 'remaining_installments' | 'next_due_date' | 'completion_date' | 'progress_percentage'>): Installment => {
  const remaining = installment.total_installments - installment.paid_installments;
  const progressPercentage = Math.round((installment.paid_installments / installment.total_installments) * 100);
  
  const startDate = new Date(installment.start_date);
  const nextDueDate = addMonths(startDate, installment.paid_installments);
  const completionDate = addMonths(startDate, installment.total_installments - 1);
  
  return {
    ...installment,
    remaining_installments: remaining,
    next_due_date: installment.status === 'completed' || installment.status === 'cancelled' ? '' : format(nextDueDate, 'yyyy-MM-dd'),
    completion_date: format(completionDate, 'yyyy-MM-dd'),
    progress_percentage: progressPercentage,
    status: installment.paid_installments >= installment.total_installments ? 'completed' : installment.status,
  };
};

// REMOVED: calculateFixedExpenseFields - migrated to VariableExpense

// REMOVED: calculateAutomaticDebitFields - migrated to VariableExpense

// Helper function to calculate payment status based on deviation
const calculatePaymentStatus = (budgetedAmount: number, paidAmount: number): PaymentStatus => {
  const deviation = Math.abs((paidAmount - budgetedAmount) / budgetedAmount);
  
  if (deviation <= 0.05) return 'paid_accurate';   // ±5%
  if (deviation <= 0.15) return 'paid_moderate';   // ±15%
  return 'paid_high';                             // >15%
};

// Helper function to calculate variable expense computed fields
const calculateVariableExpenseFields = (expense: Omit<VariableExpense, 'last_month_amount' | 'amount_variation' | 'trend_percentage' | 'accuracy_rate' | 'next_billing_date'>): VariableExpense => {
  const { payment_history } = expense;
  
  // Find last paid record
  const paidRecords = payment_history.filter(p => p.amount_paid !== undefined).sort((a, b) => b.month.localeCompare(a.month));
  const lastPaidRecord = paidRecords[0];
  const last_month_amount = lastPaidRecord?.amount_paid || 0;
  
  // Calculate variation vs previous month
  const previousRecord = paidRecords[1];
  const amount_variation = previousRecord 
    ? last_month_amount - previousRecord.amount_paid! 
    : 0;
  
  // Calculate trend percentage (last 3 months average growth)
  const last3Months = paidRecords.slice(0, 3);
  let trend_percentage = 0;
  if (last3Months.length >= 2) {
    const oldest = last3Months[last3Months.length - 1].amount_paid!;
    const newest = last3Months[0].amount_paid!;
    trend_percentage = ((newest - oldest) / oldest) * 100;
  }
  
  // Calculate accuracy rate (how close estimates were)
  const recordsWithBoth = payment_history.filter(p => p.amount_paid !== undefined && p.amount_budgeted > 0);
  let accuracy_rate = 100; // Default to 100% if no history
  if (recordsWithBoth.length > 0) {
    const accuracySum = recordsWithBoth.reduce((sum, record) => {
      const deviation = Math.abs(record.amount_paid! - record.amount_budgeted) / record.amount_budgeted;
      return sum + Math.max(0, 100 - (deviation * 100)); // Convert to accuracy percentage
    }, 0);
    accuracy_rate = accuracySum / recordsWithBoth.length;
  }
  
  // Calculate next billing date if billing_day is provided
  let next_billing_date: string | undefined;
  if (expense.billing_day) {
    const now = new Date();
    const nextBilling = new Date(now.getFullYear(), now.getMonth(), expense.billing_day);
    if (nextBilling <= now) {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    }
    next_billing_date = format(nextBilling, 'yyyy-MM-dd');
  }
  
  return {
    ...expense,
    last_month_amount,
    amount_variation,
    trend_percentage,
    accuracy_rate,
    next_billing_date,
  };
};

export const useGastoStore = create<GastoStore>()(persist(
  (set, get) => ({
      // Initial state - empty arrays for real data
      gastos: [],
      isLoading: false,
      error: null,
      filters: {},

      // Load all gastos (with mock data for development)
      loadGastos: () => {
        // No action needed - data is persisted in localStorage
        // This method is kept for compatibility but doesn't load mock data
        set({ isLoading: false, error: null });
      },

      // Delete any type of gasto
      deleteGasto: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const { gastos } = get();
          const updatedGastos = gastos.filter(g => g.id !== id);
          
          set({
            gastos: updatedGastos,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error deleting gasto',
            isLoading: false 
          });
          throw error;
        }
      },

      // Toggle active status for any gasto
      toggleGastoActive: async (id: string) => {
        try {
          const { gastos } = get();
          const updatedGastos = gastos.map(g => {
            if (g.id === id) {
              const updatedGasto = { 
                ...g, 
                is_active: !g.is_active,
                updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx')
              };
              
              // Update status based on type and active state
              if (isInstallment(updatedGasto)) {
                updatedGasto.status = updatedGasto.is_active ? 
                  (updatedGasto.paid_installments >= updatedGasto.total_installments ? 'completed' : 'active') :
                  'cancelled';
              } else {
                updatedGasto.status = updatedGasto.is_active ? 'active' : 'paused';
              }
              
              return updatedGasto;
            }
            return g;
          });
          
          set({ gastos: updatedGastos });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error toggling gasto status'
          });
          throw error;
        }
      },

      // Add new installment
      addInstallment: async (form: CreateInstallmentForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const now = new Date();
          const newId = `installment-${Date.now()}`;
          
          const newInstallment: Omit<Installment, 'remaining_installments' | 'next_due_date' | 'completion_date' | 'progress_percentage'> = {
            id: newId,
            type: 'installment',
            description: form.description,
            total_amount: form.total_amount,
            total_installments: form.total_installments,
            installment_amount: Math.round(form.total_amount / form.total_installments),
            start_date: form.start_date,
            paid_installments: 0,
            payment_method_id: form.payment_method_id,
            status: 'active',
            is_active: true,
            created_at: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
            updated_at: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          };
          
          const fullInstallment = calculateInstallmentFields(newInstallment);
          
          set(state => ({
            gastos: [...state.gastos, fullInstallment],
            isLoading: false
          }));
          
          return fullInstallment;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error adding installment',
            isLoading: false 
          });
          throw error;
        }
      },

      // Mark installment payment as paid/unpaid
      markInstallmentPayment: async (id: string, paymentNumber: number, paid: boolean) => {
        try {
          const { gastos } = get();
          const updatedGastos = gastos.map(g => {
            if (g.id === id && isInstallment(g)) {
              let newPaidCount: number;
              
              if (paid) {
                // Mark as paid - update to the highest consecutive payment
                newPaidCount = Math.max(g.paid_installments, paymentNumber);
              } else {
                // Mark as unpaid - reduce to highest consecutive paid before this payment
                newPaidCount = paymentNumber - 1;
              }
              
              const updatedInstallment = calculateInstallmentFields({
                ...g,
                paid_installments: newPaidCount,
                updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
              });
              
              return updatedInstallment;
            }
            return g;
          });
          
          set({ gastos: updatedGastos });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error updating installment payment'
          });
          throw error;
        }
      },

      // REMOVED: addFixedExpense, updateFixedExpense, addAutomaticDebit, updateAutomaticDebit, updateDebitAmount
      // All legacy functions migrated to VariableExpense system

      // Add new variable expense
      addVariableExpense: async (form: CreateVariableExpenseForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const now = new Date();
          const newId = `variable-expense-${Date.now()}`;
          
          // Initialize with empty payment history (first 6 months as pending)
          const payment_history: PaymentRecord[] = [];
          for (let i = 0; i < 6; i++) {
            const month = format(addMonths(now, -i), 'yyyy-MM');
            payment_history.push({
              month,
              amount_budgeted: form.estimated_amount,
              payment_status: 'pending'
            });
          }
          
          const newExpense: Omit<VariableExpense, 'last_month_amount' | 'amount_variation' | 'trend_percentage' | 'accuracy_rate' | 'next_billing_date'> = {
            id: newId,
            type: 'variable_expense',
            description: form.description,
            estimated_amount: form.estimated_amount,
            billing_day: form.billing_day,
            category: form.category,
            service_url: form.service_url,
            payment_history,
            payment_method_id: form.payment_method_id,
            status: 'active',
            is_active: true,
            created_at: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
            updated_at: format(now, 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
          };
          
          const fullExpense = calculateVariableExpenseFields(newExpense);
          
          set(state => ({
            gastos: [...state.gastos, fullExpense],
            isLoading: false
          }));
          
          return fullExpense;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error adding variable expense',
            isLoading: false 
          });
          throw error;
        }
      },

      // Update variable expense
      updateVariableExpense: async (id: string, updates: Partial<CreateVariableExpenseForm>) => {
        try {
          const { gastos } = get();
          const updatedGastos = gastos.map(g => {
            if (g.id === id && isVariableExpense(g)) {
              const updatedExpense = calculateVariableExpenseFields({
                ...g,
                ...updates,
                updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
              });
              return updatedExpense;
            }
            return g;
          });
          
          set({ gastos: updatedGastos });
          
          const updatedExpense = updatedGastos.find(g => g.id === id && isVariableExpense(g)) as VariableExpense;
          return updatedExpense;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error updating variable expense'
          });
          throw error;
        }
      },

      // Record actual payment for variable expense
      recordVariablePayment: async (id: string, month: string, actualAmount: number, paymentDate?: string, notes?: string) => {
        try {
          const { gastos } = get();
          const updatedGastos = gastos.map(g => {
            if (g.id === id && isVariableExpense(g)) {
              const updatedHistory = g.payment_history.map(record => {
                if (record.month === month) {
                  const paymentStatus = calculatePaymentStatus(record.amount_budgeted, actualAmount);
                  const variationPercentage = ((actualAmount - record.amount_budgeted) / record.amount_budgeted) * 100;
                  
                  return {
                    ...record,
                    amount_paid: actualAmount,
                    payment_date: paymentDate || format(new Date(), 'yyyy-MM-dd'),
                    variation_percentage: variationPercentage,
                    notes,
                    payment_status: paymentStatus
                  };
                }
                return record;
              });
              
              const updatedExpense = calculateVariableExpenseFields({
                ...g,
                payment_history: updatedHistory,
                updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
              });
              
              return updatedExpense;
            }
            return g;
          });
          
          set({ gastos: updatedGastos });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error recording variable payment'
          });
          throw error;
        }
      },

      // Update estimated amount for variable expense
      updateEstimatedAmount: async (id: string, newAmount: number) => {
        try {
          const { gastos } = get();
          const updatedGastos = gastos.map(g => {
            if (g.id === id && isVariableExpense(g)) {
              const updatedExpense = calculateVariableExpenseFields({
                ...g,
                estimated_amount: newAmount,
                updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx'),
              });
              return updatedExpense;
            }
            return g;
          });
          
          set({ gastos: updatedGastos });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Error updating estimated amount'
          });
          throw error;
        }
      },

      // Set filters
      setFilters: (newFilters: Partial<GastoFilters>) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: {} });
      },

      // Get filtered gastos
      getFilteredGastos: () => {
        const { gastos, filters } = get();
        
        let filtered = [...gastos];
        
        // Filter by type
        if (filters.types && filters.types.length > 0) {
          filtered = filtered.filter(g => filters.types!.includes(g.type));
        }
        
        // Filter by status
        if (filters.status && filters.status.length > 0) {
          filtered = filtered.filter(g => filters.status!.includes(g.status));
        }
        
        // Filter by payment method
        if (filters.payment_method_id) {
          filtered = filtered.filter(g => g.payment_method_id === filters.payment_method_id);
        }
        
        // Filter by category
        if (filters.category) {
          filtered = filtered.filter(g => 
            (isVariableExpense(g) && g.category === filters.category)
          );
        }
        
        // Filter by search term
        if (filters.search_term) {
          const term = filters.search_term.toLowerCase();
          filtered = filtered.filter(g => 
            g.description.toLowerCase().includes(term)
          );
        }
        
        // Filter by amount range
        if (filters.amount_range) {
          filtered = filtered.filter(g => {
            let amount: number;
            if (isInstallment(g)) amount = g.installment_amount;
            else if (isVariableExpense(g)) amount = g.estimated_amount;
            else return false;
            
            return amount >= filters.amount_range!.min && amount <= filters.amount_range!.max;
          });
        }
        
        // Sort by next relevant date (installment due, billing date, etc.)
        filtered.sort((a, b) => {
          // Completed/cancelled items go to bottom
          if (a.status === 'completed' || a.status === 'cancelled') return 1;
          if (b.status === 'completed' || b.status === 'cancelled') return -1;
          
          // Get next relevant date for sorting
          let dateA: Date | null = null;
          let dateB: Date | null = null;
          
          if (isInstallment(a) && a.next_due_date) dateA = new Date(a.next_due_date);
          if (isVariableExpense(a) && a.next_billing_date) dateA = new Date(a.next_billing_date);
          // REMOVED: isAutomaticDebit - migrated to VariableExpense
          
          if (isInstallment(b) && b.next_due_date) dateB = new Date(b.next_due_date);
          if (isVariableExpense(b) && b.next_billing_date) dateB = new Date(b.next_billing_date);
          // REMOVED: isAutomaticDebit - migrated to VariableExpense
          
          // If both have dates, sort by date
          if (dateA && dateB) {
            return dateA.getTime() - dateB.getTime();
          }
          
          // Items with dates come first
          if (dateA && !dateB) return -1;
          if (!dateA && dateB) return 1;
          
          // Sort by creation date as fallback
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        return filtered;
      },

      // Get gastos by type with type safety
      getGastosByType: <T extends Gasto>(type: T['type']): T[] => {
        const { gastos } = get();
        return gastos.filter(g => g.type === type) as T[];
      },

      // Get summary data
      getSummary: () => {
        const { gastos } = get();
        return generateGastoSummary(gastos);
      },

      // Get monthly expenses for a specific date
      getMonthlyExpenses: (date?: Date) => {
        const { gastos } = get();
        const targetDate = date || new Date();
        
        let total = 0;
        
        gastos.forEach(gasto => {
          if (!gasto.is_active) return;
          
          if (isInstallment(gasto)) {
            // Check if installment is active in the target month
            if (gasto.status === 'active') {
              const startDate = new Date(gasto.start_date);
              const endDate = new Date(gasto.completion_date);
              
              if (targetDate >= startDate && targetDate <= endDate) {
                total += gasto.installment_amount;
              }
            }
          } else if (isVariableExpense(gasto)) {
            // Variable expenses are monthly if active
            if (gasto.status === 'active') {
              total += gasto.estimated_amount;
            }
          // REMOVED: isFixedExpense y isAutomaticDebit - migrated to VariableExpense
          }
        });
        
        return total;
      },

      // Get upcoming payments
      getUpcomingPayments: (monthsAhead: number = 3) => {
        const { gastos } = get();
        const now = new Date();
        const futureDate = addMonths(now, monthsAhead);
        
        return gastos.filter(gasto => {
          if (!gasto.is_active) return false;
          
          if (isInstallment(gasto)) {
            if (!gasto.next_due_date || gasto.status !== 'active') return false;
            const dueDate = new Date(gasto.next_due_date);
            return dueDate >= now && dueDate <= futureDate;
          }
          
          if (isVariableExpense(gasto)) {
            if (gasto.status !== 'active' || !gasto.next_billing_date) return false;
            const billingDate = new Date(gasto.next_billing_date);
            return billingDate >= now && billingDate <= futureDate;
          }
          
          // REMOVED: isAutomaticDebit - migrated to VariableExpense
          
          // Fixed expenses don't have specific due dates, exclude from upcoming
          return false;
        });
      },

      // Refresh data
      refreshData: () => {
        get().loadGastos();
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Get gasto by ID
      getGastoById: (id: string) => {
        const { gastos } = get();
        return gastos.find(g => g.id === id);
      },
      
      // Get all gastos
      getAllGastos: () => {
        const { gastos } = get();
        return gastos;
      },

      // Reset all data (for testing)
      resetData: () => {
        set({ 
          gastos: [],
          isLoading: false,
          error: null,
          filters: {} 
        });
      },
  }),
  {
    name: 'gasto-store',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  }
));