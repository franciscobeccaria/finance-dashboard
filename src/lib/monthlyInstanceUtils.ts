// Utilidades para el sistema de instancias mensuales
// Cada gasto + mes = celda única con estado independiente

import { addMonths, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  MonthlyExpenseInstance, 
  BaseInstallmentV2, 
  BaseVariableExpenseV2,
  PaymentStatus,
  Budget
} from '@/types/gastos';

// ============================================================================
// GENERADORES DE IDENTIFICADORES ÚNICOS
// ============================================================================

export function generateInstanceId(parentId: string, month: string): string {
  return `${parentId}_${month}`;
}

export function generateInstanceDisplayName(
  description: string, 
  month: string, 
  sequenceNumber?: number
): string {
  const date = parseISO(`${month}-01`);
  const monthName = format(date, 'MMMM yyyy', { locale: es });
  
  if (sequenceNumber) {
    return `Cuota ${sequenceNumber} de ${description} - ${monthName}`;
  } else {
    return `${description} - ${monthName}`;
  }
}

// ============================================================================
// GENERADORES DE INSTANCIAS MENSUALES
// ============================================================================

export function generateInstallmentInstances(
  installment: BaseInstallmentV2,
  startMonth: string,
  endMonth: string
): MonthlyExpenseInstance[] {
  const instances: MonthlyExpenseInstance[] = [];
  const startDate = parseISO(`${installment.start_date}`);
  
  // Generar instancias para cada cuota
  for (let i = 0; i < installment.total_installments; i++) {
    const currentMonth = addMonths(startDate, i);
    const monthString = format(currentMonth, 'yyyy-MM');
    
    // Solo generar instancias dentro del rango solicitado
    if (monthString >= startMonth && monthString <= endMonth) {
      const instance: MonthlyExpenseInstance = {
        id: generateInstanceId(installment.id, monthString),
        parent_expense_id: installment.id,
        month: monthString,
        year: currentMonth.getFullYear(),
        month_number: currentMonth.getMonth() + 1,
        display_name: generateInstanceDisplayName(
          installment.description, 
          monthString, 
          i + 1
        ),
        
        // Montos
        amount_budgeted: installment.installment_amount,
        amount_paid: null, // Inicialmente no pagado
        payment_status: 'pending' as PaymentStatus,
        
        // Fechas
        due_date: currentMonth.toISOString(),
        payment_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Metadatos
        sequence_number: i + 1,
        payment_method_id: installment.payment_method_id,
        
        // Referencias
        parent_expense_type: 'installment',
        parent_expense_data: installment
      };
      
      instances.push(instance);
    }
  }
  
  return instances;
}

export function generateVariableExpenseInstances(
  variableExpense: BaseVariableExpenseV2,
  startMonth: string,
  endMonth: string
): MonthlyExpenseInstance[] {
  const instances: MonthlyExpenseInstance[] = [];
  const start = parseISO(`${startMonth}-01`);
  const end = parseISO(`${endMonth}-01`);
  
  let currentDate = start;
  
  while (currentDate <= end) {
    const monthString = format(currentDate, 'yyyy-MM');
    
    // Calcular fecha de vencimiento basada en billing_day
    let dueDate = currentDate;
    if (variableExpense.billing_day) {
      dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), variableExpense.billing_day);
    }
    
    const instance: MonthlyExpenseInstance = {
      id: generateInstanceId(variableExpense.id, monthString),
      parent_expense_id: variableExpense.id,
      month: monthString,
      year: currentDate.getFullYear(),
      month_number: currentDate.getMonth() + 1,
      display_name: generateInstanceDisplayName(
        variableExpense.description, 
        monthString
      ),
      
      // Montos
      amount_budgeted: variableExpense.estimated_amount,
      amount_paid: null,
      payment_status: 'pending' as PaymentStatus,
      
      // Fechas
      due_date: dueDate.toISOString(),
      payment_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Metadatos
      category: variableExpense.category,
      payment_method_id: variableExpense.payment_method_id,
      
      // Referencias
      parent_expense_type: 'variable_expense',
      parent_expense_data: variableExpense
    };
    
    instances.push(instance);
    currentDate = addMonths(currentDate, 1);
  }
  
  return instances;
}

export function generateBudgetInstances(
  budget: Budget,
  startMonth: string,
  endMonth: string
): MonthlyExpenseInstance[] {
  const instances: MonthlyExpenseInstance[] = [];
  const start = parseISO(`${startMonth}-01`);
  const end = parseISO(`${endMonth}-01`);
  
  let currentDate = start;
  
  while (currentDate <= end) {
    const monthString = format(currentDate, 'yyyy-MM');
    
    const instance: MonthlyExpenseInstance = {
      id: generateInstanceId(budget.id, monthString),
      parent_expense_id: budget.id,
      month: monthString,
      year: currentDate.getFullYear(),
      month_number: currentDate.getMonth() + 1,
      display_name: generateInstanceDisplayName(
        budget.name, 
        monthString
      ),
      
      // Montos
      amount_budgeted: budget.total,
      amount_paid: budget.spent || null, // El monto gastado es el "pagado"
      payment_status: getBudgetPaymentStatus(budget),
      
      // Fechas
      due_date: null, // Los presupuestos no tienen fecha de vencimiento
      payment_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Metadatos
      category: 'Presupuesto',
      payment_method_id: undefined,
      
      // Referencias
      parent_expense_type: 'budget',
      parent_expense_data: budget
    };
    
    instances.push(instance);
    currentDate = addMonths(currentDate, 1);
  }
  
  return instances;
}

// Helper function to determine budget payment status based on utilization
function getBudgetPaymentStatus(budget: Budget): PaymentStatus {
  const utilization = budget.spent / budget.total;
  
  if (utilization === 0) return 'pending';
  if (utilization <= 0.8) return 'paid_accurate'; // Under 80%
  if (utilization <= 1.0) return 'paid_moderate'; // 80-100%
  return 'paid_high'; // Over 100%
}

// ============================================================================
// FUNCIONES DE GESTIÓN DE INSTANCIAS
// ============================================================================

export function markInstanceAsPaid(
  instance: MonthlyExpenseInstance,
  amount: number,
  paymentDate: Date = new Date()
): MonthlyExpenseInstance {
  const variation = Math.abs((amount - instance.amount_budgeted) / instance.amount_budgeted);
  
  let paymentStatus: PaymentStatus;
  if (variation <= 0.05) {
    paymentStatus = 'paid_accurate'; // ±5%
  } else if (variation <= 0.15) {
    paymentStatus = 'paid_moderate'; // ±5-15%
  } else {
    paymentStatus = 'paid_high'; // >15%
  }
  
  return {
    ...instance,
    amount_paid: amount,
    payment_status: paymentStatus,
    payment_date: paymentDate.toISOString(),
    updated_at: new Date().toISOString()
  };
}

export function markInstanceAsUnpaid(instance: MonthlyExpenseInstance): MonthlyExpenseInstance {
  return {
    ...instance,
    amount_paid: null,
    payment_status: 'pending',
    payment_date: null,
    updated_at: new Date().toISOString()
  };
}

export function updateInstanceNotes(
  instance: MonthlyExpenseInstance, 
  notes: string
): MonthlyExpenseInstance {
  return {
    ...instance,
    notes,
    updated_at: new Date().toISOString()
  };
}

// ============================================================================
// FUNCIONES DE CONSULTA
// ============================================================================

// Type guards for MonthlyExpenseInstance
export const isInstallmentInstance = (instance: MonthlyExpenseInstance): boolean => 
  instance.parent_expense_type === 'installment';

export const isVariableExpenseInstance = (instance: MonthlyExpenseInstance): boolean => 
  instance.parent_expense_type === 'variable_expense';

export const isBudgetInstance = (instance: MonthlyExpenseInstance): boolean => 
  instance.parent_expense_type === 'budget';

export function getInstancesForMonth(
  instances: MonthlyExpenseInstance[],
  month: string
): MonthlyExpenseInstance[] {
  return instances.filter(instance => instance.month === month);
}

export function getInstancesForExpense(
  instances: MonthlyExpenseInstance[],
  parentExpenseId: string
): MonthlyExpenseInstance[] {
  return instances.filter(instance => instance.parent_expense_id === parentExpenseId);
}

export function getPaidInstancesForExpense(
  instances: MonthlyExpenseInstance[],
  parentExpenseId: string
): MonthlyExpenseInstance[] {
  return instances.filter(
    instance => 
      instance.parent_expense_id === parentExpenseId && 
      instance.amount_paid !== null
  );
}

export function getTotalPaidForExpense(
  instances: MonthlyExpenseInstance[],
  parentExpenseId: string
): number {
  return getInstancesForExpense(instances, parentExpenseId)
    .reduce((sum, instance) => sum + (instance.amount_paid || 0), 0);
}

export function getCompletionPercentageForInstallment(
  instances: MonthlyExpenseInstance[],
  parentExpenseId: string
): number {
  const allInstances = getInstancesForExpense(instances, parentExpenseId);
  const paidInstances = getPaidInstancesForExpense(instances, parentExpenseId);
  
  if (allInstances.length === 0) return 0;
  return Math.round((paidInstances.length / allInstances.length) * 100);
}

// ============================================================================
// MIGRACIÓN DE DATOS LEGACY
// ============================================================================

export function migrateInstallmentToInstances(
  legacyInstallment: any // Tipo legacy con paid_installments
): MonthlyExpenseInstance[] {
  // Crear BaseInstallmentV2 limpio
  const baseInstallment: BaseInstallmentV2 = {
    id: legacyInstallment.id,
    description: legacyInstallment.description,
    payment_method_id: legacyInstallment.payment_method_id,
    created_at: legacyInstallment.created_at,
    updated_at: legacyInstallment.updated_at,
    is_active: legacyInstallment.is_active,
    type: 'installment',
    total_amount: legacyInstallment.total_amount,
    total_installments: legacyInstallment.total_installments,
    installment_amount: legacyInstallment.installment_amount,
    start_date: legacyInstallment.start_date,
    status: legacyInstallment.status
  };
  
  // Generar todas las instancias
  const startMonth = format(parseISO(legacyInstallment.start_date), 'yyyy-MM');
  const endDate = addMonths(parseISO(legacyInstallment.start_date), legacyInstallment.total_installments);
  const endMonth = format(endDate, 'yyyy-MM');
  
  const instances = generateInstallmentInstances(baseInstallment, startMonth, endMonth);
  
  // Marcar las instancias ya pagadas según paid_installments
  return instances.map((instance, index) => {
    if (index < legacyInstallment.paid_installments) {
      return markInstanceAsPaid(instance, instance.amount_budgeted);
    }
    return instance;
  });
}