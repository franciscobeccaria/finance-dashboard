// Unified interfaces for Entity "Gasto" - Handles 3 types: Installments, Fixed Expenses, Automatic Debits

// Base interface shared by all expense types
interface BaseGasto {
  id: string;
  description: string;           // "iPhone 14 Pro", "Alquiler", "Netflix"
  payment_method_id: string;     // Link to payment method
  created_at: string;
  updated_at: string;
  is_active: boolean;           // Can pause/activate any expense type
}

// Installment (Cuota) - Existing functionality adapted
export interface Installment extends BaseGasto {
  type: 'installment';
  // Purchase details
  total_amount: number;         // 120000 (total purchase)
  total_installments: number;   // 12 cuotas
  installment_amount: number;   // 10000 per installment
  start_date: string;          // "2024-01-15"
  
  // Progress tracking
  paid_installments: number;    // 3 cuotas paid
  
  // Computed fields (calculated dynamically)
  remaining_installments: number;  // 9 remaining
  next_due_date: string;          // "2024-04-15"
  completion_date: string;        // "2024-12-15"
  progress_percentage: number;    // 25%
  status: 'active' | 'completed' | 'cancelled';
}

// Variable Expense (Unificación de Gasto Fijo + Débito Automático)
// Refleja la realidad Argentina: gastos que varían mes a mes por inflación
export interface VariableExpense extends BaseGasto {
  type: 'variable_expense';
  
  // Configuración base
  estimated_amount: number;     // Estimación para el próximo mes
  billing_day?: number;        // Día típico de vencimiento (1-31)
  category: string;            // "Servicios Básicos", "Seguros", "Suscripciones", etc.
  service_url?: string;        // Link para gestionar el servicio
  
  // Historial de pagos (últimos 6 meses)
  payment_history: PaymentRecord[];
  
  // Computed fields
  last_month_amount: number;        // Último monto pagado
  amount_variation: number;         // Variación vs mes anterior
  trend_percentage: number;         // Tendencia últimos 3 meses
  accuracy_rate: number;           // Precisión de estimaciones (0-100%)
  next_billing_date?: string;      // Próxima fecha estimada
  status: 'active' | 'paused';
}

// Registro individual de pago mensual
export interface PaymentRecord {
  month: string;                    // 'YYYY-MM' (ej: '2024-08')
  amount_budgeted: number;         // Lo que presupuestamos para ese mes
  amount_paid?: number;            // Lo que realmente pagamos (null si pendiente)
  payment_date?: string;           // Cuándo se pagó (ISO string)
  variation_percentage?: number;   // (amount_paid - amount_budgeted) / amount_budgeted * 100
  notes?: string;                  // Observaciones del mes
  payment_status: PaymentStatus;   // Estado del pago
}

// Estados de pago para análisis visual
export type PaymentStatus = 
  | 'pending'        // ⚪ Pendiente de pago
  | 'paid_accurate'  // 🟢 Pagado dentro del rango (±5%)
  | 'paid_moderate'  // 🟡 Fuera del rango (±5-15%)
  | 'paid_high'      // 🔴 Muy fuera del rango (>15%)
  | 'overdue';       // ⚫ Vencido sin pagar

// REMOVED: FixedExpense y AutomaticDebit han sido migrados a VariableExpense
// Estos tipos ya no existen en el sistema

// Unified Gasto type - Solo Installment y VariableExpense
export type Gasto = Installment | VariableExpense;

// Type guards for discriminated union
export const isInstallment = (gasto: Gasto): gasto is Installment => 
  gasto.type === 'installment';

export const isVariableExpense = (gasto: Gasto): gasto is VariableExpense => 
  gasto.type === 'variable_expense';

// Utility types for forms and UI
export type GastoType = Gasto['type'];
export type GastoStatus = Gasto['status'];

// Form interfaces for creating each type
export interface CreateInstallmentForm {
  description: string;
  total_amount: number;
  total_installments: number;
  start_date: string;
  payment_method_id: string;
}

// Form para crear VariableExpense (sistema actual)
export interface CreateVariableExpenseForm {
  description: string;
  estimated_amount: number;
  billing_day?: number;
  payment_method_id: string;
  category: string;
  service_url?: string;
  // El historial se inicializa automáticamente
}

// Update form types
export interface UpdateGastoForm {
  id: string;
  description?: string;
  payment_method_id?: string;
  is_active?: boolean;
}

export interface UpdateInstallmentForm extends UpdateGastoForm {
  // Can't change core installment details once created
}

export interface UpdateVariableExpenseForm extends UpdateGastoForm {
  estimated_amount?: number;
  billing_day?: number;
  category?: string;
  service_url?: string;
}

// Filters for the unified table
export interface GastoFilters {
  types?: GastoType[];         // Filter by expense type
  status?: GastoStatus[];      // Filter by status
  payment_method_id?: string;  // Filter by payment method
  category?: string;           // Filter by category
  date_range?: {
    start: string;
    end: string;
  };
  search_term?: string;        // Search in description
  amount_range?: {
    min: number;
    max: number;
  };
}

// Summary data for dashboard
export interface GastoSummary {
  // Counts by type
  total_installments: number;
  total_variable_expenses: number;
  
  // Monthly amounts
  monthly_installments: number;      // Sum of current month's installment payments
  monthly_variable_expenses: number; // Sum of all variable expenses
  total_monthly_expenses: number;    // Sum of all monthly expenses
  
  // Status counts
  active_expenses: number;
  paused_expenses: number;
  
  // Upcoming events
  installments_completing_this_month: Installment[];
  variables_billing_this_month: VariableExpense[];
  overdue_installments: Installment[];
}

// Categories for Variable Expenses (sistema actual)
export const EXPENSE_CATEGORIES = {
  variable: [
    'Servicios Básicos',    // Luz, gas, agua (varían por consumo + inflación)
    'Comunicaciones',       // Internet, telecom, celular (varían por inflación + planes)
    'Seguros',             // Auto, hogar, vida (varían por inflación)  
    'Impuestos',           // ABL, IIBB (varían por valuación + inflación)
    'Suscripciones',       // Netflix, Spotify, software (varían por dólar + inflación)
    'Transporte',          // Combustible, peajes (varían constantemente)
    'Educación',           // Colegios, universidades (varían por inflación)
    'Salud',              // Medicina prepaga (varía por inflación)
    'Entretenimiento',     // Servicios variables de entretenimiento
    'Fitness',            // Gym, deportes (varían por inflación)
    'Vivienda',           // Alquiler, expensas (varían por inflación)
    'Otros',
  ]
} as const;

// Type exports for categories
export type VariableExpenseCategory = typeof EXPENSE_CATEGORIES.variable[number];

// Budget interface (read-only in gastos view)
export interface Budget {
  id: string;
  name: string;
  total: number;
  spent: number;
  isSpecial?: boolean;
}

// Unified Monthly Expense - combines Gastos with Budgets for complete view
export interface UnifiedMonthlyExpense {
  id: string;
  description: string;
  type: 'installment' | 'variable_expense' | 'budget';
  monthly_amount: number;
  payment_method_id?: string;
  category?: string;
  is_active: boolean;
  source: 'gasto' | 'budget';
  
  // Additional data for display
  progress?: number;              // For installments (percentage)
  billing_day?: number;           // For variable expenses
  spent?: number;                 // For budgets
  next_due_date?: string;         // For installments
  
  // Variable Expense specific data
  last_month_amount?: number;     // For variable expenses
  amount_variation?: number;      // For variable expenses
  trend_percentage?: number;      // For variable expenses
  accuracy_rate?: number;         // For variable expenses
  payment_status?: PaymentStatus; // For variable expenses
  
  // Original data reference
  original_data: Gasto | Budget;
}

// ============================================================================
// NEW MONTHLY INSTANCE SYSTEM - Sistema de "Celdas"
// ============================================================================

// Monthly Instance - Representa una instancia única de gasto en un mes específico
// Gasto + Mes = Celda única con estado independiente
export interface MonthlyExpenseInstance {
  id: string;                          // Identificador único de la instancia
  parent_expense_id: string;           // ID del gasto padre (Installment o VariableExpense)
  month: string;                       // 'YYYY-MM' (ej: '2025-08')
  year: number;                        // 2025
  month_number: number;                // 8 (agosto)
  display_name: string;                // "Cuota 3 de Bad Bunny en River - Agosto 2025"
  
  // Montos y estado
  amount_budgeted: number;             // Monto presupuestado para este mes
  amount_paid: number | null;          // Monto real pagado (null si no pagado)
  payment_status: PaymentStatus;       // Estado del pago
  
  // Fechas
  due_date: string | null;             // Fecha de vencimiento estimada
  payment_date: string | null;         // Fecha real de pago
  created_at: string;                  // Cuándo se creó esta instancia
  updated_at: string;                  // Última modificación
  
  // Metadatos
  sequence_number?: number;            // Para cuotas: número de cuota (1, 2, 3...)
  category?: string;                   // Para gastos variables: categoría
  notes?: string;                      // Notas específicas de este mes
  payment_method_id?: string;          // Puede diferir del gasto padre
  
  // Referencias
  parent_expense_type: 'installment' | 'variable_expense' | 'budget';
  parent_expense_data: any; // Referencia al gasto padre (Installment | VariableExpense | Budget)
}

// Nueva estructura base para gastos - ELIMINA paid_installments, remaining_installments
export interface BaseInstallmentV2 extends BaseGasto {
  type: 'installment';
  total_amount: number;
  total_installments: number;
  installment_amount: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
}

// Nueva estructura para Variable Expenses - más simple
export interface BaseVariableExpenseV2 extends BaseGasto {
  type: 'variable_expense';
  estimated_amount: number;
  billing_day?: number;
  category: string;
  service_url?: string;
  status: 'active' | 'paused';
}

// Nuevos tipos base
export type BaseExpenseV2 = BaseInstallmentV2 | BaseVariableExpenseV2;

// Funciones para generar instancias mensuales
export interface MonthlyInstanceGenerator {
  generateInstallmentInstances: (installment: BaseInstallmentV2, startMonth: string, endMonth: string) => MonthlyExpenseInstance[];
  generateVariableExpenseInstances: (variableExpense: BaseVariableExpenseV2, startMonth: string, endMonth: string) => MonthlyExpenseInstance[];
  generateInstanceId: (parentId: string, month: string) => string;
}

// Type guards for MonthlyExpenseInstance
export const isInstallmentInstance = (instance: MonthlyExpenseInstance): boolean => 
  instance.parent_expense_type === 'installment';

export const isVariableExpenseInstance = (instance: MonthlyExpenseInstance): boolean => 
  instance.parent_expense_type === 'variable_expense';

// ============================================================================
// LEGACY COMPATIBILITY (mantenemos los tipos existentes por ahora)
// ============================================================================

// Type guard for UnifiedMonthlyExpense
export const isBudgetExpense = (expense: UnifiedMonthlyExpense): expense is UnifiedMonthlyExpense & { source: 'budget' } => 
  expense.source === 'budget';

export const isGastoExpense = (expense: UnifiedMonthlyExpense): expense is UnifiedMonthlyExpense & { source: 'gasto' } => 
  expense.source === 'gasto';