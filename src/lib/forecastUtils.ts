import { 
  Gasto, 
  Budget, 
  Installment, 
  VariableExpense,
  isInstallment,
  isVariableExpense 
} from '@/types/gastos';
import { addMonths, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

// Interface for monthly forecast data
export interface MonthlyForecast {
  month: string; // YYYY-MM format
  displayMonth: string; // "Ene 2025" format
  date: Date;
  gastos: ForecastExpense[];
  budgets: Budget[];
  totals: {
    cuotas: number;
    gastos_variables: number;
    presupuestos: number;
    total_mensual: number;
  };
}

// Interface for individual expense forecast
export interface ForecastExpense {
  id: string;
  description: string;
  type: 'installment' | 'variable_expense';
  category?: string;
  projected_amount: number;
  is_active_in_month: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  original_data: Gasto;
  projection_notes?: string; // Notes about the projection (e.g., "Termina en este mes", "Inflación aplicada")
}

// Interface for complete forecast period
export interface ForecastPeriod {
  start_date: Date;
  end_date: Date;
  total_months: number;
  monthly_forecasts: MonthlyForecast[];
  summary: {
    total_expenses_count: number;
    total_projected_amount: number;
    highest_month: { month: string; amount: number };
    lowest_month: { month: string; amount: number };
  };
}

// Generate month labels in Spanish
const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

function formatDisplayMonth(date: Date): string {
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
}

// Calculate projected amount for installment in specific month
function projectInstallmentForMonth(installment: Installment, targetDate: Date): ForecastExpense {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const startDate = new Date(installment.start_date);
  const completionDate = new Date(installment.completion_date);
  
  // Check if installment is active in this month
  const isActiveInMonth = isWithinInterval(monthStart, {
    start: startDate,
    end: completionDate
  }) || isWithinInterval(monthEnd, {
    start: startDate,
    end: completionDate
  }) || (monthStart >= startDate && monthEnd <= completionDate);
  
  // Calculate if this installment will be completed in this month
  const monthsFromStart = Math.floor((monthStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const willComplete = monthsFromStart >= installment.total_installments - 1;
  
  let projectionNotes = '';
  if (willComplete && isActiveInMonth) {
    projectionNotes = 'Última cuota';
  } else if (!isActiveInMonth) {
    projectionNotes = 'Finalizada';
  }
  
  return {
    id: installment.id,
    description: installment.description,
    type: 'installment',
    projected_amount: isActiveInMonth ? installment.installment_amount : 0,
    is_active_in_month: isActiveInMonth,
    status: isActiveInMonth ? installment.status : 'completed',
    original_data: installment,
    projection_notes: projectionNotes
  };
}

// Calculate projected amount for variable expense in specific month
function projectVariableExpenseForMonth(variableExpense: VariableExpense, targetDate: Date): ForecastExpense {
  if (!variableExpense.is_active) {
    return {
      id: variableExpense.id,
      description: variableExpense.description,
      type: 'variable_expense',
      category: variableExpense.category,
      projected_amount: 0,
      is_active_in_month: false,
      status: 'paused',
      original_data: variableExpense,
      projection_notes: 'Pausado'
    };
  }
  
  // Calculate months from current date
  const currentDate = new Date();
  const monthsFromNow = Math.floor((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  // Apply inflation/trend projection for future months
  let projectedAmount = variableExpense.estimated_amount;
  let projectionNotes = '';
  
  if (monthsFromNow > 0) {
    // Apply monthly trend percentage for future projections
    const monthlyTrend = variableExpense.trend_percentage / 100 / 12; // Convert annual to monthly
    const trendMultiplier = Math.pow(1 + monthlyTrend, monthsFromNow);
    projectedAmount = Math.round(projectedAmount * trendMultiplier);
    
    if (variableExpense.trend_percentage > 0) {
      projectionNotes = `+${variableExpense.trend_percentage.toFixed(1)}% anual aplicado`;
    } else if (variableExpense.trend_percentage < 0) {
      projectionNotes = `${variableExpense.trend_percentage.toFixed(1)}% anual aplicado`;
    }
  }
  
  return {
    id: variableExpense.id,
    description: variableExpense.description,
    type: 'variable_expense',
    category: variableExpense.category,
    projected_amount: projectedAmount,
    is_active_in_month: true,
    status: variableExpense.status,
    original_data: variableExpense,
    projection_notes: projectionNotes
  };
}

// Generate forecasts for a range of months
export function generateMonthlyForecasts(
  gastos: Gasto[], 
  budgets: Budget[], 
  startDate: Date = new Date(), 
  monthsAhead: number = 24
): MonthlyForecast[] {
  const forecasts: MonthlyForecast[] = [];
  
  // Filter active gastos
  const activeInstallments = gastos.filter(g => isInstallment(g) && g.is_active) as Installment[];
  const activeVariableExpenses = gastos.filter(g => isVariableExpense(g) && g.is_active) as VariableExpense[];
  const regularBudgets = budgets.filter(b => !b.isSpecial);
  
  for (let i = 0; i < monthsAhead; i++) {
    const targetDate = addMonths(startOfMonth(startDate), i);
    const monthKey = format(targetDate, 'yyyy-MM');
    
    // Project installments for this month
    const installmentForecasts = activeInstallments.map(inst => 
      projectInstallmentForMonth(inst, targetDate)
    );
    
    // Project variable expenses for this month
    const variableExpenseForecasts = activeVariableExpenses.map(ve => 
      projectVariableExpenseForMonth(ve, targetDate)
    );
    
    // Combine all expense forecasts
    const allExpenseForecasts = [...installmentForecasts, ...variableExpenseForecasts];
    
    // Calculate totals
    const cuotasTotal = installmentForecasts.reduce((sum, f) => sum + f.projected_amount, 0);
    const variablesTotal = variableExpenseForecasts.reduce((sum, f) => sum + f.projected_amount, 0);
    const presupuestosTotal = regularBudgets.reduce((sum, b) => sum + b.total, 0);
    const totalMensual = cuotasTotal + variablesTotal + presupuestosTotal;
    
    const monthlyForecast: MonthlyForecast = {
      month: monthKey,
      displayMonth: formatDisplayMonth(targetDate),
      date: targetDate,
      gastos: allExpenseForecasts,
      budgets: regularBudgets,
      totals: {
        cuotas: cuotasTotal,
        gastos_variables: variablesTotal,
        presupuestos: presupuestosTotal,
        total_mensual: totalMensual
      }
    };
    
    forecasts.push(monthlyForecast);
  }
  
  return forecasts;
}

// Generate complete forecast period with summary
export function generateForecastPeriod(
  gastos: Gasto[], 
  budgets: Budget[], 
  startDate: Date = new Date(), 
  monthsAhead: number = 24
): ForecastPeriod {
  const monthlyForecasts = generateMonthlyForecasts(gastos, budgets, startDate, monthsAhead);
  const endDate = addMonths(startDate, monthsAhead - 1);
  
  // Calculate summary statistics
  const totalProjectedAmount = monthlyForecasts.reduce((sum, f) => sum + f.totals.total_mensual, 0);
  const uniqueExpenses = new Set(monthlyForecasts.flatMap(f => f.gastos.map(g => g.id))).size;
  
  // Find highest and lowest months
  const monthlyTotals = monthlyForecasts.map(f => ({ 
    month: f.displayMonth, 
    amount: f.totals.total_mensual 
  }));
  
  const highestMonth = monthlyTotals.reduce((max, current) => 
    current.amount > max.amount ? current : max
  );
  
  const lowestMonth = monthlyTotals.reduce((min, current) => 
    current.amount < min.amount ? current : min
  );
  
  return {
    start_date: startDate,
    end_date: endDate,
    total_months: monthsAhead,
    monthly_forecasts: monthlyForecasts,
    summary: {
      total_expenses_count: uniqueExpenses,
      total_projected_amount: totalProjectedAmount,
      highest_month: highestMonth,
      lowest_month: lowestMonth
    }
  };
}

// Get forecast for specific expense across all months
export function getExpenseForecastTimeline(
  expenseId: string, 
  forecasts: MonthlyForecast[]
): ForecastExpense[] {
  return forecasts
    .map(f => f.gastos.find(g => g.id === expenseId))
    .filter(Boolean) as ForecastExpense[];
}

// Calculate year-over-year projections
export function getYearlyProjections(forecasts: MonthlyForecast[]): {
  [year: string]: {
    total_amount: number;
    months_included: number;
    average_monthly: number;
  };
} {
  const yearlyData: { [year: string]: { total: number; months: number } } = {};
  
  forecasts.forEach(forecast => {
    const year = forecast.date.getFullYear().toString();
    if (!yearlyData[year]) {
      yearlyData[year] = { total: 0, months: 0 };
    }
    yearlyData[year].total += forecast.totals.total_mensual;
    yearlyData[year].months += 1;
  });
  
  const result: { [year: string]: { total_amount: number; months_included: number; average_monthly: number } } = {};
  
  Object.keys(yearlyData).forEach(year => {
    const data = yearlyData[year];
    result[year] = {
      total_amount: data.total,
      months_included: data.months,
      average_monthly: Math.round(data.total / data.months)
    };
  });
  
  return result;
}