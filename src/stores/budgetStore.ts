import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Budget } from '@/types/gastos';

interface BudgetStore {
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  getBudgetById: (id: string) => Budget | undefined;
  getTotalBudgetAmount: () => number;
  getTotalSpentAmount: () => number;
  resetData: () => void;
}

export const useBudgetStore = create<BudgetStore>()(persist(
  (set, get) => ({
      budgets: [],
      
      setBudgets: (budgets) => {
        set({ budgets });
      },
      
      getBudgetById: (id) => {
        const state = get();
        return state.budgets.find(budget => budget.id === id);
      },
      
      getTotalBudgetAmount: () => {
        const state = get();
        return state.budgets.reduce((total, budget) => total + budget.total, 0);
      },
      
      getTotalSpentAmount: () => {
        const state = get();
        return state.budgets.reduce((total, budget) => total + budget.spent, 0);
      },
      
      resetData: () => {
        set({ budgets: [] });
      },
  }),
  {
    name: 'budget-store',
    storage: createJSONStorage(() => localStorage),
    version: 1,
  }
));