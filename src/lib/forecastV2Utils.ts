import { format, addMonths, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { BaseExpense, MonthlyExpenseInstance } from "@/types/gastos";
import { Budget } from "@/types/budget";

// Parent expense row interface for proper grouping
export interface ParentExpenseRow {
  parent_expense_id: string;
  display_name: string;
  type: 'installment' | 'variable_expense' | 'budget';
  monthly_data: Record<string, {
    amount: number;
    sequence_number?: number;
    payment_method_id?: string;
    notes?: string;
  }>;
  total_amount: number;
}

// Forecast interfaces for V2
export interface MonthlyForecastV2 {
  month: string; // 'YYYY-MM'
  displayMonth: string; // 'Enero 2024'
  totals: {
    cuotas: number;
    gastos_fijos: number;
    presupuestos: number;
    total_mensual: number;
  };
  parent_expense_rows: {
    cuotas: ParentExpenseRow[];
    gastos_fijos: ParentExpenseRow[];
    presupuestos: ParentExpenseRow[];
  };
}

export interface ForecastPeriodV2 {
  start_date: string;
  end_date: string;
  total_months: number;
  months: string[];
  display_months: string[];
  parent_expense_rows: {
    cuotas: ParentExpenseRow[];
    gastos_fijos: ParentExpenseRow[];
    presupuestos: ParentExpenseRow[];
  };
  monthly_totals: Record<string, {
    cuotas: number;
    gastos_fijos: number;
    presupuestos: number;
    total_mensual: number;
  }>;
  summary: {
    total_expenses_count: number;
    highest_month: {
      month: string;
      amount: number;
    };
    lowest_month: {
      month: string;
      amount: number;
    };
  };
}

// Generate forecast from monthly instances (V2 approach)
export function generateForecastFromInstances(
  baseExpenses: BaseExpense[],
  budgets: Budget[],
  monthlyInstances: MonthlyExpenseInstance[],
  startDate: Date,
  totalMonths: number = 24
): ForecastPeriodV2 {
  // Generate month keys and display names
  const months: string[] = [];
  const displayMonths: string[] = [];
  
  for (let i = 0; i < totalMonths; i++) {
    const currentDate = addMonths(startOfMonth(startDate), i);
    const monthKey = format(currentDate, 'yyyy-MM');
    const displayMonth = format(currentDate, 'MMMM yyyy', { locale: es });
    months.push(monthKey);
    displayMonths.push(displayMonth);
  }
  
  // Group instances by parent_expense_id
  const instancesByParent = new Map<string, MonthlyExpenseInstance[]>();
  monthlyInstances.forEach(instance => {
    const parentId = instance.parent_expense_id;
    if (!instancesByParent.has(parentId)) {
      instancesByParent.set(parentId, []);
    }
    instancesByParent.get(parentId)!.push(instance);
  });
  
  // Create parent expense rows by type
  const cuotasRows: ParentExpenseRow[] = [];
  const gastosFijosRows: ParentExpenseRow[] = [];
  const presupuestosRows: ParentExpenseRow[] = [];
  
  // Process base expenses
  baseExpenses.forEach(baseExpense => {
    const instances = instancesByParent.get(baseExpense.id) || [];
    
    // Build monthly data
    const monthlyData: Record<string, any> = {};
    let totalAmount = 0;
    
    instances.forEach(instance => {
      monthlyData[instance.month] = {
        amount: instance.amount_budgeted,
        sequence_number: instance.sequence_number,
        payment_method_id: instance.payment_method_id,
        notes: instance.sequence_number ? `Cuota ${instance.sequence_number}` : undefined
      };
      totalAmount += instance.amount_budgeted;
    });
    
    const parentRow: ParentExpenseRow = {
      parent_expense_id: baseExpense.id,
      display_name: baseExpense.description,
      type: baseExpense.type,
      monthly_data: monthlyData,
      total_amount: totalAmount
    };
    
    // Add to appropriate category
    if (baseExpense.type === 'installment') {
      cuotasRows.push(parentRow);
    } else if (baseExpense.type === 'variable_expense') {
      gastosFijosRows.push(parentRow);
    }
  });
  
  // Process budgets
  budgets.forEach(budget => {
    const instances = instancesByParent.get(budget.id) || [];
    
    // Build monthly data for budgets (usually same amount every month)
    const monthlyData: Record<string, any> = {};
    let totalAmount = 0;
    
    instances.forEach(instance => {
      monthlyData[instance.month] = {
        amount: instance.amount_budgeted,
        payment_method_id: instance.payment_method_id
      };
      totalAmount += instance.amount_budgeted;
    });
    
    const parentRow: ParentExpenseRow = {
      parent_expense_id: budget.id,
      display_name: budget.name,
      type: 'budget',
      monthly_data: monthlyData,
      total_amount: totalAmount
    };
    
    presupuestosRows.push(parentRow);
  });
  
  // Calculate monthly totals
  const monthlyTotals: Record<string, any> = {};
  months.forEach(month => {
    const cuotasTotal = cuotasRows.reduce((sum, row) => sum + (row.monthly_data[month]?.amount || 0), 0);
    const gastosFijosTotal = gastosFijosRows.reduce((sum, row) => sum + (row.monthly_data[month]?.amount || 0), 0);
    const presupuestosTotal = presupuestosRows.reduce((sum, row) => sum + (row.monthly_data[month]?.amount || 0), 0);
    
    monthlyTotals[month] = {
      cuotas: cuotasTotal,
      gastos_fijos: gastosFijosTotal,
      presupuestos: presupuestosTotal,
      total_mensual: cuotasTotal + gastosFijosTotal + presupuestosTotal
    };
  });
  
  // Calculate summary
  const totalAmounts = months.map(month => monthlyTotals[month].total_mensual);
  const maxAmount = Math.max(...totalAmounts);
  const minAmount = Math.min(...totalAmounts);
  const maxIndex = totalAmounts.indexOf(maxAmount);
  const minIndex = totalAmounts.indexOf(minAmount);
  
  return {
    start_date: format(startDate, 'yyyy-MM-dd'),
    end_date: format(addMonths(startDate, totalMonths - 1), 'yyyy-MM-dd'),
    total_months: totalMonths,
    months,
    display_months: displayMonths,
    parent_expense_rows: {
      cuotas: cuotasRows,
      gastos_fijos: gastosFijosRows,
      presupuestos: presupuestosRows
    },
    monthly_totals: monthlyTotals,
    summary: {
      total_expenses_count: baseExpenses.length + budgets.length,
      highest_month: {
        month: displayMonths[maxIndex] || '',
        amount: maxAmount
      },
      lowest_month: {
        month: displayMonths[minIndex] || '',
        amount: minAmount
      }
    }
  };
}

// Get yearly projections from forecast period
export function getYearlyProjectionsV2(forecastPeriod: ForecastPeriodV2) {
  const yearlyData: Record<string, {
    total_amount: number;
    months_included: number;
    average_monthly: number;
  }> = {};
  
  forecastPeriod.months.forEach(month => {
    const year = month.split('-')[0];
    const monthlyTotal = forecastPeriod.monthly_totals[month];
    
    if (!yearlyData[year]) {
      yearlyData[year] = {
        total_amount: 0,
        months_included: 0,
        average_monthly: 0
      };
    }
    
    yearlyData[year].total_amount += monthlyTotal.total_mensual;
    yearlyData[year].months_included += 1;
  });
  
  // Calculate averages
  Object.keys(yearlyData).forEach(year => {
    const data = yearlyData[year];
    data.average_monthly = Math.round(data.total_amount / data.months_included);
  });
  
  return yearlyData;
}