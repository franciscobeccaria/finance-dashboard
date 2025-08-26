// Nuevo store para el sistema de instancias mensuales
// Maneja gastos como objetos únicos por mes (sistema de "celdas")

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  MonthlyExpenseInstance, 
  BaseInstallmentV2, 
  BaseVariableExpenseV2,
  BaseExpenseV2,
  PaymentStatus,
  CreateInstallmentForm,
  CreateVariableExpenseForm
} from '@/types/gastos';
import {
  generateInstallmentInstances,
  generateVariableExpenseInstances,
  generateBudgetInstances,
  markInstanceAsPaid,
  markInstanceAsUnpaid,
  updateInstanceNotes,
  getInstancesForMonth,
  getInstancesForExpense,
  getCompletionPercentageForInstallment,
  migrateInstallmentToInstances
} from '@/lib/monthlyInstanceUtils';
import { format, addMonths } from 'date-fns';

interface MonthlyInstanceStore {
  // State
  baseExpenses: BaseExpenseV2[];           // Gastos base sin contador
  monthlyInstances: MonthlyExpenseInstance[]; // Instancias mensuales generadas
  isLoading: boolean;
  error: string | null;
  
  // Actions - Base Expenses Management
  addInstallment: (form: CreateInstallmentForm) => Promise<BaseInstallmentV2>;
  addVariableExpense: (form: CreateVariableExpenseForm) => Promise<BaseVariableExpenseV2>;
  deleteBaseExpense: (id: string) => Promise<void>;
  toggleExpenseActive: (id: string) => Promise<void>;
  
  // Actions - Monthly Instances Management
  payInstance: (instanceId: string, amount: number, paymentDate?: Date) => Promise<void>;
  unpayInstance: (instanceId: string) => Promise<void>;
  updateInstanceNotes: (instanceId: string, notes: string) => Promise<void>;
  generateInstancesForPeriod: (startMonth: string, endMonth: string) => void;
  generateBudgetInstancesForPeriod: (startMonth: string, endMonth: string, budgets: any[]) => void;
  
  // Queries
  getInstancesForMonth: (month: string) => MonthlyExpenseInstance[];
  getInstancesForExpense: (parentExpenseId: string) => MonthlyExpenseInstance[];
  getBaseExpenseById: (id: string) => BaseExpenseV2 | undefined;
  getInstanceById: (instanceId: string) => MonthlyExpenseInstance | undefined;
  getCompletionPercentage: (parentExpenseId: string) => number;
  
  // Migration & Utilities
  migrateFromLegacyStore: (legacyGastos: any[]) => Promise<void>;
  refreshInstances: () => void;
  clearError: () => void;
  resetData: () => void;
}

// Helper functions
const createBaseInstallment = (form: CreateInstallmentForm): BaseInstallmentV2 => ({
  id: `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  description: form.description,
  payment_method_id: form.payment_method_id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  type: 'installment',
  total_amount: form.total_amount,
  total_installments: form.total_installments,
  installment_amount: Math.round(form.total_amount / form.total_installments),
  start_date: form.start_date,
  status: 'active'
});

const createBaseVariableExpense = (form: CreateVariableExpenseForm): BaseVariableExpenseV2 => ({
  id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  description: form.description,
  payment_method_id: form.payment_method_id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  is_active: true,
  type: 'variable_expense',
  estimated_amount: form.estimated_amount,
  billing_day: form.billing_day,
  category: form.category,
  service_url: form.service_url,
  status: 'active'
});

export const useMonthlyInstanceStore = create<MonthlyInstanceStore>()(
  persist(
    (set, get) => ({
      // Initial State
      baseExpenses: [],
      monthlyInstances: [],
      isLoading: false,
      error: null,

      // Base Expenses Management
      addInstallment: async (form: CreateInstallmentForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const baseInstallment = createBaseInstallment(form);
          
          set((state) => ({
            baseExpenses: [...state.baseExpenses, baseInstallment],
            isLoading: false
          }));
          
          // Auto-generate instances for the next 12 months
          const currentMonth = format(new Date(), 'yyyy-MM');
          const endDate = addMonths(new Date(), 12);
          const endMonth = format(endDate, 'yyyy-MM');
          
          get().generateInstancesForPeriod(currentMonth, endMonth);
          
          return baseInstallment;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear cuota';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      addVariableExpense: async (form: CreateVariableExpenseForm) => {
        set({ isLoading: true, error: null });
        
        try {
          const baseVariableExpense = createBaseVariableExpense(form);
          
          set((state) => ({
            baseExpenses: [...state.baseExpenses, baseVariableExpense],
            isLoading: false
          }));
          
          // Auto-generate instances for the next 12 months
          const currentMonth = format(new Date(), 'yyyy-MM');
          const endDate = addMonths(new Date(), 12);
          const endMonth = format(endDate, 'yyyy-MM');
          
          get().generateInstancesForPeriod(currentMonth, endMonth);
          
          return baseVariableExpense;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al crear gasto variable';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      deleteBaseExpense: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          set((state) => ({
            baseExpenses: state.baseExpenses.filter(expense => expense.id !== id),
            monthlyInstances: state.monthlyInstances.filter(instance => instance.parent_expense_id !== id),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al eliminar gasto';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      toggleExpenseActive: async (id: string) => {
        set({ isLoading: true, error: null });
        
        try {
          set((state) => ({
            baseExpenses: state.baseExpenses.map(expense => 
              expense.id === id 
                ? { ...expense, is_active: !expense.is_active, updated_at: new Date().toISOString() }
                : expense
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // Monthly Instances Management
      payInstance: async (instanceId: string, amount: number, paymentDate: Date = new Date()) => {
        set({ isLoading: true, error: null });
        
        try {
          set((state) => ({
            monthlyInstances: state.monthlyInstances.map(instance => 
              instance.id === instanceId
                ? markInstanceAsPaid(instance, amount, paymentDate)
                : instance
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al marcar como pagado';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      unpayInstance: async (instanceId: string) => {
        set({ isLoading: true, error: null });
        
        try {
          set((state) => ({
            monthlyInstances: state.monthlyInstances.map(instance => 
              instance.id === instanceId
                ? markInstanceAsUnpaid(instance)
                : instance
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al desmarcar pago';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      updateInstanceNotes: async (instanceId: string, notes: string) => {
        set({ isLoading: true, error: null });
        
        try {
          set((state) => ({
            monthlyInstances: state.monthlyInstances.map(instance => 
              instance.id === instanceId
                ? updateInstanceNotes(instance, notes)
                : instance
            ),
            isLoading: false
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al actualizar notas';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      generateInstancesForPeriod: (startMonth: string, endMonth: string) => {
        const { baseExpenses } = get();
        const newInstances: MonthlyExpenseInstance[] = [];
        
        baseExpenses.forEach(expense => {
          if (!expense.is_active) return;
          
          if (expense.type === 'installment') {
            const instances = generateInstallmentInstances(expense, startMonth, endMonth);
            newInstances.push(...instances);
          } else if (expense.type === 'variable_expense') {
            const instances = generateVariableExpenseInstances(expense, startMonth, endMonth);
            newInstances.push(...instances);
          }
        });
        
        // Merge with existing instances (avoid duplicates)
        set((state) => {
          const existingIds = new Set(state.monthlyInstances.map(i => i.id));
          const uniqueNewInstances = newInstances.filter(i => !existingIds.has(i.id));
          
          return {
            monthlyInstances: [...state.monthlyInstances, ...uniqueNewInstances]
          };
        });
      },

      generateBudgetInstancesForPeriod: (startMonth: string, endMonth: string, budgets: any[]) => {
        const newInstances: MonthlyExpenseInstance[] = [];
        
        budgets.forEach(budget => {
          const instances = generateBudgetInstances(budget, startMonth, endMonth);
          newInstances.push(...instances);
        });
        
        // Merge with existing instances (avoid duplicates)
        set((state) => {
          const existingIds = new Set(state.monthlyInstances.map(i => i.id));
          const uniqueNewInstances = newInstances.filter(i => !existingIds.has(i.id));
          
          return {
            monthlyInstances: [...state.monthlyInstances, ...uniqueNewInstances]
          };
        });
      },

      // Queries
      getInstancesForMonth: (month: string) => {
        const { monthlyInstances } = get();
        return getInstancesForMonth(monthlyInstances, month);
      },

      getInstancesForExpense: (parentExpenseId: string) => {
        const { monthlyInstances } = get();
        return getInstancesForExpense(monthlyInstances, parentExpenseId);
      },

      getBaseExpenseById: (id: string) => {
        const { baseExpenses } = get();
        return baseExpenses.find(expense => expense.id === id);
      },

      getInstanceById: (instanceId: string) => {
        const { monthlyInstances } = get();
        return monthlyInstances.find(instance => instance.id === instanceId);
      },

      getCompletionPercentage: (parentExpenseId: string) => {
        const { monthlyInstances } = get();
        return getCompletionPercentageForInstallment(monthlyInstances, parentExpenseId);
      },

      // Migration & Utilities
      migrateFromLegacyStore: async (legacyGastos: any[]) => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🔄 MIGRATION DEBUG: Starting migration with', legacyGastos.length, 'legacy gastos');
          console.log('🔄 MIGRATION DEBUG: Legacy gastos types:', legacyGastos.map(g => ({ id: g.id, type: g.type, description: g.description })));
          
          const migratedInstances: MonthlyExpenseInstance[] = [];
          const migratedBaseExpenses: BaseExpenseV2[] = [];
          
          legacyGastos.forEach(legacyGasto => {
            if (legacyGasto.type === 'installment') {
              // Migrate installment
              const instances = migrateInstallmentToInstances(legacyGasto);
              migratedInstances.push(...instances);
              
              // Create clean base expense
              const baseExpense: BaseInstallmentV2 = {
                id: legacyGasto.id,
                description: legacyGasto.description,
                payment_method_id: legacyGasto.payment_method_id,
                created_at: legacyGasto.created_at,
                updated_at: legacyGasto.updated_at,
                is_active: legacyGasto.is_active,
                type: 'installment',
                total_amount: legacyGasto.total_amount,
                total_installments: legacyGasto.total_installments,
                installment_amount: legacyGasto.installment_amount,
                start_date: legacyGasto.start_date,
                status: legacyGasto.status
              };
              migratedBaseExpenses.push(baseExpense);
              
            } else if (legacyGasto.type === 'variable_expense') {
              // Migrate VariableExpense
              console.log('🔄 MIGRATION DEBUG: Processing variable expense:', legacyGasto.id, legacyGasto.description);
              console.log('🔄 MIGRATION DEBUG: Payment history:', legacyGasto.payment_history);
              
              const baseExpense: BaseVariableExpenseV2 = {
                id: legacyGasto.id,
                description: legacyGasto.description,
                payment_method_id: legacyGasto.payment_method_id,
                created_at: legacyGasto.created_at,
                updated_at: legacyGasto.updated_at,
                is_active: legacyGasto.is_active,
                type: 'variable_expense',
                estimated_amount: legacyGasto.estimated_amount,
                billing_day: legacyGasto.billing_day,
                category: legacyGasto.category,
                service_url: legacyGasto.service_url,
                status: legacyGasto.status === 'paused' ? 'paused' : 'active'
              };
              migratedBaseExpenses.push(baseExpense);
              
              // Generate instances for variable expense (last 3 months + next 6 months)
              const currentDate = new Date();
              const startMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1), 'yyyy-MM');
              const endMonth = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 1), 'yyyy-MM');
              
              const instances = generateVariableExpenseInstances(baseExpense, startMonth, endMonth);
              console.log('🔄 MIGRATION DEBUG: Generated', instances.length, 'instances for variable expense:', legacyGasto.description);
              
              // Apply payment history to instances
              if (legacyGasto.payment_history && Array.isArray(legacyGasto.payment_history)) {
                instances.forEach(instance => {
                  const paymentRecord = legacyGasto.payment_history.find((p: any) => p.month === instance.month);
                  if (paymentRecord && paymentRecord.amount_paid) {
                    instance.amount_paid = paymentRecord.amount_paid;
                    instance.payment_status = paymentRecord.payment_status || 'paid_accurate';
                    instance.payment_date = paymentRecord.payment_date || instance.due_date;
                    instance.notes = paymentRecord.notes;
                  }
                });
              }
              
              migratedInstances.push(...instances);
            }
          });
          
          console.log('🔄 MIGRATION DEBUG: Migration complete!');
          console.log('🔄 MIGRATION DEBUG: Base expenses created:', migratedBaseExpenses.length);
          console.log('🔄 MIGRATION DEBUG: Monthly instances created:', migratedInstances.length);
          console.log('🔄 MIGRATION DEBUG: Instance types:', migratedInstances.map(i => ({ id: i.id, type: i.parent_expense_type, month: i.month, description: i.description })));

          set({
            baseExpenses: migratedBaseExpenses,
            monthlyInstances: migratedInstances,
            isLoading: false
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error en migración';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      refreshInstances: () => {
        // Re-generate instances for current period
        const currentMonth = format(new Date(), 'yyyy-MM');
        const endDate = addMonths(new Date(), 12);
        const endMonth = format(endDate, 'yyyy-MM');
        
        get().generateInstancesForPeriod(currentMonth, endMonth);
      },

      clearError: () => set({ error: null }),

      resetData: () => set({ 
        baseExpenses: [], 
        monthlyInstances: [], 
        isLoading: false, 
        error: null 
      })
    }),
    {
      name: 'monthly-instance-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
);