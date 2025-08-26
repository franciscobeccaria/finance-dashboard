import { Gasto, Budget, UnifiedMonthlyExpense, isInstallment, isVariableExpense } from '@/types/gastos';
import { startOfMonth, endOfMonth, isWithinInterval, addMonths, format } from 'date-fns';

// Transform a Gasto into UnifiedMonthlyExpense
export function gastoToUnifiedExpense(gasto: Gasto): UnifiedMonthlyExpense {
  const baseExpense: UnifiedMonthlyExpense = {
    id: gasto.id,
    description: gasto.description,
    type: gasto.type,
    payment_method_id: gasto.payment_method_id,
    is_active: gasto.is_active,
    source: 'gasto',
    monthly_amount: 0,
    original_data: gasto,
  };

  if (isInstallment(gasto)) {
    return {
      ...baseExpense,
      monthly_amount: gasto.installment_amount || 0,
      progress: gasto.progress_percentage || 0,
      next_due_date: gasto.next_due_date,
    };
  }

  if (isVariableExpense(gasto)) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentRecord = gasto.payment_history.find(p => p.month === currentMonth);
    
    return {
      ...baseExpense,
      monthly_amount: gasto.estimated_amount || 0,
      billing_day: gasto.billing_day,
      category: gasto.category,
      last_month_amount: gasto.last_month_amount,
      amount_variation: gasto.amount_variation,
      trend_percentage: gasto.trend_percentage,
      accuracy_rate: gasto.accuracy_rate,
      payment_status: currentRecord?.payment_status || 'pending',
    };
  }

  return baseExpense;
}

// Transform a Budget into UnifiedMonthlyExpense
export function budgetToUnifiedExpense(budget: Budget): UnifiedMonthlyExpense {
  return {
    id: budget.id,
    description: budget.name,
    type: 'budget',
    monthly_amount: budget.total || 0,
    is_active: true, // Budgets are always active
    source: 'budget',
    spent: budget.spent || 0,
    original_data: budget,
  };
}

// Calculate monthly amount for a given date (for installments that may not be active in that month)
export function getMonthlyAmountForDate(gasto: Gasto, date: Date): number {
  if (!gasto.is_active) return 0;

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  if (isInstallment(gasto)) {
    // Check if this installment is active in the given month
    const startDate = new Date(gasto.start_date);
    const completionDate = new Date(gasto.completion_date);
    
    // If the month is within the installment period
    if (isWithinInterval(monthStart, { start: startDate, end: completionDate }) ||
        isWithinInterval(monthEnd, { start: startDate, end: completionDate })) {
      return gasto.installment_amount || 0;
    }
    return 0;
  }

  if (isVariableExpense(gasto)) {
    // Variable expenses are monthly if active
    return gasto.estimated_amount || 0;
  }

  return 0;
}

// Get all unified expenses combining gastos and budgets
export function getAllUnifiedExpenses(gastos: Gasto[], budgets: Budget[]): UnifiedMonthlyExpense[] {
  const gastoExpenses = gastos.map(gastoToUnifiedExpense);
  const budgetExpenses = budgets
    .filter(budget => !budget.isSpecial) // Exclude special budgets like "Movimientos"
    .map(budgetToUnifiedExpense);
  
  const allExpenses = [...gastoExpenses, ...budgetExpenses];
  
  // Sort by type: installments, variable_expenses, budgets
  const typeOrder = { 'installment': 1, 'variable_expense': 2, 'budget': 3 };
  
  return allExpenses.sort((a, b) => {
    const orderA = typeOrder[a.type] || 999;
    const orderB = typeOrder[b.type] || 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // Secondary sort by description
    return a.description.localeCompare(b.description);
  });
}

// Get total monthly amount for a specific date
export function getTotalMonthlyAmount(gastos: Gasto[], budgets: Budget[], date: Date): number {
  const safeGastos = gastos || [];
  const safeBudgets = budgets || [];
  
  const gastoTotal = safeGastos.reduce((total, gasto) => {
    const amount = getMonthlyAmountForDate(gasto, date);
    return total + (isNaN(amount) ? 0 : amount);
  }, 0);

  const budgetTotal = safeBudgets
    .filter(budget => !budget.isSpecial)
    .reduce((total, budget) => {
      const amount = budget.total || 0;
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);

  return gastoTotal + budgetTotal;
}

// Enhanced summary (sistema actualizado - solo Installments y VariableExpenses)
export interface UnifiedExpenseSummary {
  // Counts by type
  total_installments: number;
  total_variable_expenses: number;
  total_budgets: number;
  
  // Monthly amounts
  monthly_installments: number;
  monthly_variable_expenses: number;
  monthly_budgets: number;
  total_monthly_expenses: number;
  
  // Status counts
  active_expenses: number;
  paused_expenses: number;
  
  // Budget specific
  total_budget_spent: number;
  budget_utilization_percentage: number;
}

export function getUnifiedSummary(gastos: Gasto[], budgets: Budget[], selectedDate: Date): UnifiedExpenseSummary {
  // Safety checks to prevent NaN
  const safeGastos = gastos || [];
  const safeBudgets = budgets || [];
  
  const activeGastos = safeGastos.filter(g => g.is_active);
  const pausedGastos = safeGastos.filter(g => !g.is_active);
  const regularBudgets = safeBudgets.filter(b => !b.isSpecial);
  
  const installments = activeGastos.filter(isInstallment);
  const variableExpenses = activeGastos.filter(isVariableExpense);
  
  const monthly_installments = installments.reduce((sum, g) => {
    const amount = getMonthlyAmountForDate(g, selectedDate);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const monthly_variable_expenses = variableExpenses.reduce((sum, g) => {
    const amount = getMonthlyAmountForDate(g, selectedDate);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
// REMOVED: monthly_fixed_expenses y monthly_automatic_debits - migrated to variable_expenses
  
  const monthly_budgets = regularBudgets.reduce((sum, b) => {
    const amount = b.total || 0;
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const total_budget_spent = regularBudgets.reduce((sum, b) => {
    const spent = b.spent || 0;
    return sum + (isNaN(spent) ? 0 : spent);
  }, 0);
  
  const budget_utilization_percentage = monthly_budgets > 0 ? (total_budget_spent / monthly_budgets) * 100 : 0;

  return {
    total_installments: installments.length,
    total_variable_expenses: variableExpenses.length,
    total_budgets: regularBudgets.length,
    
    monthly_installments,
    monthly_variable_expenses,
    monthly_budgets,
    total_monthly_expenses: monthly_installments + monthly_variable_expenses + monthly_budgets,
    
    active_expenses: activeGastos.length,
    paused_expenses: pausedGastos.length,
    
    total_budget_spent,
    budget_utilization_percentage,
  };
}