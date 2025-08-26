import { VariableExpense, PaymentRecord, PaymentStatus, FixedExpense, AutomaticDebit } from '@/types/gastos';
import { addMonths, format, startOfMonth, subMonths } from 'date-fns';

// Generar historial de pagos para los últimos 6 meses
export function generatePaymentHistory(
  currentAmount: number, 
  startingAmount: number = currentAmount * 0.8,
  monthsBack: number = 6
): PaymentRecord[] {
  const history: PaymentRecord[] = [];
  const now = new Date();
  
  for (let i = monthsBack; i >= 1; i--) {
    const month = format(subMonths(now, i), 'yyyy-MM');
    const baseAmount = startingAmount * (1 + (0.03 * (monthsBack - i))); // Simula inflación 3% mensual
    
    // Agregar variabilidad realista (+/- 0-20%)
    const variability = (Math.random() - 0.5) * 0.4; // -20% a +20%
    const budgetedAmount = Math.round(baseAmount);
    const paidAmount = Math.round(baseAmount * (1 + variability));
    
    // Calcular variación y estado
    const variationPercentage = ((paidAmount - budgetedAmount) / budgetedAmount) * 100;
    const payment_status = getPaymentStatus(variationPercentage);
    
    history.push({
      month,
      amount_budgeted: budgetedAmount,
      amount_paid: paidAmount,
      payment_date: format(addMonths(startOfMonth(subMonths(now, i)), 1), 'yyyy-MM-dd'),
      variation_percentage: Math.round(variationPercentage * 100) / 100,
      payment_status,
      notes: variationPercentage > 15 ? 'Aumento significativo' : variationPercentage < -15 ? 'Rebaja inesperada' : undefined,
    });
  }
  
  return history.sort((a, b) => b.month.localeCompare(a.month)); // Más reciente primero
}

// Determinar estado de pago basado en variación porcentual
export function getPaymentStatus(variationPercentage: number): PaymentStatus {
  const absVariation = Math.abs(variationPercentage);
  
  if (absVariation <= 5) return 'paid_accurate';  // ±5%
  if (absVariation <= 15) return 'paid_moderate'; // ±5-15%
  return 'paid_high'; // >15%
}

// Calcular campos computados para VariableExpense
export function calculateVariableExpenseFields(
  baseData: Omit<VariableExpense, 'last_month_amount' | 'amount_variation' | 'trend_percentage' | 'accuracy_rate' | 'next_billing_date'>,
  paymentHistory: PaymentRecord[]
): VariableExpense {
  // Último monto pagado (mes más reciente con pago)
  const lastPaidRecord = paymentHistory.find(record => record.amount_paid !== undefined);
  const lastMonthAmount = lastPaidRecord?.amount_paid || baseData.estimated_amount;
  
  // Variación vs mes anterior
  const currentMonthRecord = paymentHistory[0];
  const previousMonthRecord = paymentHistory[1];
  const amountVariation = currentMonthRecord && previousMonthRecord 
    ? (currentMonthRecord.amount_paid || currentMonthRecord.amount_budgeted) - (previousMonthRecord.amount_paid || previousMonthRecord.amount_budgeted)
    : 0;
  
  // Tendencia últimos 3 meses (promedio de crecimiento)
  const recentRecords = paymentHistory.slice(0, 3);
  const trendPercentage = recentRecords.length >= 2 
    ? calculateTrendPercentage(recentRecords)
    : 0;
  
  // Precisión de estimaciones (qué tan bien estimamos vs realidad)
  const paidRecords = paymentHistory.filter(record => record.amount_paid !== undefined);
  const accuracyRate = paidRecords.length > 0 
    ? calculateAccuracyRate(paidRecords)
    : 0;
  
  // Próxima fecha de vencimiento
  const next_billing_date = baseData.billing_day 
    ? calculateNextBillingDate(baseData.billing_day)
    : undefined;
  
  return {
    ...baseData,
    last_month_amount: lastMonthAmount,
    amount_variation: amountVariation,
    trend_percentage: Math.round(trendPercentage * 100) / 100,
    accuracy_rate: Math.round(accuracyRate * 100) / 100,
    next_billing_date: next_billing_date,
  };
}

// Calcular tendencia porcentual de crecimiento
function calculateTrendPercentage(records: PaymentRecord[]): number {
  if (records.length < 2) return 0;
  
  let totalGrowth = 0;
  let validComparisons = 0;
  
  for (let i = 0; i < records.length - 1; i++) {
    const current = records[i].amount_paid || records[i].amount_budgeted;
    const previous = records[i + 1].amount_paid || records[i + 1].amount_budgeted;
    
    if (current && previous && previous > 0) {
      totalGrowth += (current - previous) / previous;
      validComparisons++;
    }
  }
  
  return validComparisons > 0 ? (totalGrowth / validComparisons) * 100 : 0;
}

// Calcular precisión de estimaciones
function calculateAccuracyRate(paidRecords: PaymentRecord[]): number {
  if (paidRecords.length === 0) return 0;
  
  let totalAccuracy = 0;
  
  paidRecords.forEach(record => {
    if (record.amount_paid && record.amount_budgeted > 0) {
      const accuracy = 1 - Math.abs(record.amount_paid - record.amount_budgeted) / record.amount_budgeted;
      totalAccuracy += Math.max(0, accuracy); // No permitir precisión negativa
    }
  });
  
  return (totalAccuracy / paidRecords.length) * 100;
}

// Calcular próxima fecha de vencimiento
function calculateNextBillingDate(billingDay: number): string {
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const thisMonthBilling = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), billingDay);
  
  // Si ya pasó este mes, usar el próximo mes
  const nextBilling = thisMonthBilling < now 
    ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, billingDay)
    : thisMonthBilling;
  
  return format(nextBilling, 'yyyy-MM-dd');
}

// Migrar FixedExpense a VariableExpense
export function migrateFixedExpenseToVariable(fixedExpense: FixedExpense): VariableExpense {
  const paymentHistory = generatePaymentHistory(fixedExpense.monthly_amount);
  
  const baseData = {
    id: fixedExpense.id,
    type: 'variable_expense' as const,
    description: fixedExpense.description,
    payment_method_id: fixedExpense.payment_method_id,
    created_at: fixedExpense.created_at,
    updated_at: fixedExpense.updated_at,
    is_active: fixedExpense.is_active,
    estimated_amount: fixedExpense.monthly_amount,
    billing_day: 1, // Default día 1 para gastos fijos
    category: fixedExpense.category || 'Otros',
    payment_history: paymentHistory,
  };
  
  return calculateVariableExpenseFields(baseData, paymentHistory);
}

// Migrar AutomaticDebit a VariableExpense
export function migrateAutomaticDebitToVariable(automaticDebit: AutomaticDebit): VariableExpense {
  const paymentHistory = generatePaymentHistory(automaticDebit.expected_amount, automaticDebit.last_amount);
  
  const baseData = {
    id: automaticDebit.id,
    type: 'variable_expense' as const,
    description: automaticDebit.description,
    payment_method_id: automaticDebit.payment_method_id,
    created_at: automaticDebit.created_at,
    updated_at: automaticDebit.updated_at,
    is_active: automaticDebit.is_active,
    estimated_amount: automaticDebit.expected_amount,
    billing_day: automaticDebit.billing_day,
    category: automaticDebit.category || 'Otros',
    service_url: automaticDebit.service_url,
    payment_history: paymentHistory,
  };
  
  return calculateVariableExpenseFields(baseData, paymentHistory);
}

// Registrar un nuevo pago para el mes actual
export function recordPayment(
  variableExpense: VariableExpense,
  amountPaid: number,
  paymentDate: Date = new Date(),
  notes?: string
): VariableExpense {
  const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM');
  const updatedHistory = [...variableExpense.payment_history];
  
  // Buscar registro del mes actual
  const currentMonthIndex = updatedHistory.findIndex(record => record.month === currentMonth);
  
  if (currentMonthIndex >= 0) {
    // Actualizar registro existente
    const currentRecord = updatedHistory[currentMonthIndex];
    const variationPercentage = ((amountPaid - currentRecord.amount_budgeted) / currentRecord.amount_budgeted) * 100;
    
    updatedHistory[currentMonthIndex] = {
      ...currentRecord,
      amount_paid: amountPaid,
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      variation_percentage: Math.round(variationPercentage * 100) / 100,
      payment_status: getPaymentStatus(variationPercentage),
      notes,
    };
  } else {
    // Crear nuevo registro para el mes actual
    const variationPercentage = ((amountPaid - variableExpense.estimated_amount) / variableExpense.estimated_amount) * 100;
    
    updatedHistory.unshift({
      month: currentMonth,
      amount_budgeted: variableExpense.estimated_amount,
      amount_paid: amountPaid,
      payment_date: format(paymentDate, 'yyyy-MM-dd'),
      variation_percentage: Math.round(variationPercentage * 100) / 100,
      payment_status: getPaymentStatus(variationPercentage),
      notes,
    });
  }
  
  // Mantener solo últimos 12 meses
  const trimmedHistory = updatedHistory.slice(0, 12);
  
  // Recalcular campos computados
  const updatedExpense = {
    ...variableExpense,
    payment_history: trimmedHistory,
    updated_at: new Date().toISOString(),
  };
  
  return calculateVariableExpenseFields(updatedExpense, trimmedHistory);
}