import React, { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Calendar, 
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Play,
  Pause,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

import { 
  Gasto, 
  Installment, 
  VariableExpense,
  PaymentStatus,
  PaymentRecord,
  Budget,
  UnifiedMonthlyExpense,
  isInstallment,
  isVariableExpense,
  isBudgetExpense,
  isGastoExpense
} from "@/types/gastos";
import { useGastoStore } from "@/stores/gastoStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";
import { getPaymentMethodColor } from "@/lib/paymentMethodColors";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface GastosTableProps {
  gastos: UnifiedMonthlyExpense[];
}

// Sortable row component
function SortableTableRow({ 
  expense, 
  isProcessing, 
  children 
}: { 
  expense: UnifiedMonthlyExpense; 
  isProcessing: boolean; 
  children: React.ReactNode; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: expense.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className={`${isProcessing ? 'opacity-50' : ''} ${isDragging ? 'z-50' : ''}`}
    >
      {/* Drag handle cell */}
      <TableCell className="w-8 p-1">
        <button 
          {...listeners}
          className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
          title="Arrastrar para reordenar"
        >
          <div className="flex flex-col gap-0.5">
            <div className="h-0.5 w-3 bg-gray-400 rounded" />
            <div className="h-0.5 w-3 bg-gray-400 rounded" />
            <div className="h-0.5 w-3 bg-gray-400 rounded" />
          </div>
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

// Component for type badge
function TypeBadge({ type }: { type: UnifiedMonthlyExpense['type'] }) {
  const variants = {
    installment: {
      text: "Cuota",
      className: "bg-blue-100 text-blue-700 border-blue-200"
    },
    variable_expense: {
      text: "Gasto Fijo",
      className: "bg-orange-100 text-orange-700 border-orange-200"
    },
    budget: {
      text: "Presupuesto",
      className: "bg-yellow-100 text-yellow-700 border-yellow-200"
    }
  };
  
  const variant = variants[type];
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variant.className}`}>
      {variant.text}
    </div>
  );
}

// Component for payment status indicator with emojis
function PaymentStatusIndicator({ status }: { status: PaymentStatus }) {
  const statusConfig = {
    pending: { emoji: '⚪', text: 'Pendiente', className: 'text-gray-600' },
    paid_accurate: { emoji: '🟢', text: 'Pagado (preciso)', className: 'text-green-600' },
    paid_moderate: { emoji: '🟡', text: 'Pagado (moderado)', className: 'text-yellow-600' },
    paid_high: { emoji: '🔴', text: 'Pagado (alto desvío)', className: 'text-red-600' },
    overdue: { emoji: '⚫', text: 'Vencido', className: 'text-gray-900' }
  };

  const config = statusConfig[status];
  return (
    <div className={`flex items-center gap-1 ${config.className}`} title={config.text}>
      <span className="text-sm">{config.emoji}</span>
      <span className="text-xs font-medium">{config.text}</span>
    </div>
  );
}

// Component for status badge
function StatusBadge({ expense }: { expense: UnifiedMonthlyExpense }) {
  const getStatusVariant = () => {
    // For budgets, show different status
    if (isBudgetExpense(expense)) {
      const budget = expense.original_data;
      const utilization = budget.spent / budget.total * 100;
      
      if (utilization >= 100) {
        return {
          icon: AlertCircle,
          className: "bg-red-100 text-red-700 border-red-200",
          text: "Excedido"
        };
      } else if (utilization >= 80) {
        return {
          icon: TrendingUp,
          className: "bg-amber-100 text-amber-700 border-amber-200",
          text: "Alto uso"
        };
      } else {
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-700 border-green-200",
          text: "Disponible"
        };
      }
    }
    
    // For gastos, use existing logic
    if (!expense.is_active) {
      return {
        icon: Pause,
        className: "bg-gray-100 text-gray-700 border-gray-200",
        text: "Pausado"
      };
    }
    
    const gasto = expense.original_data as Gasto;
    
    // Handle VariableExpense status
    if (isVariableExpense(gasto)) {
      switch (gasto.status) {
        case 'active':
          return {
            icon: TrendingUp,
            className: "bg-orange-100 text-orange-700 border-orange-200",
            text: "Variable Activo"
          };
        case 'paused':
          return {
            icon: Pause,
            className: "bg-gray-100 text-gray-700 border-gray-200",
            text: "Pausado"
          };
        default:
          return {
            icon: Clock,
            className: "bg-gray-100 text-gray-700 border-gray-200",
            text: gasto.status
          };
      }
    }
    
    // Handle other gasto types
    switch (gasto.status) {
      case 'active':
        return {
          icon: Clock,
          className: "bg-blue-100 text-blue-700 border-blue-200",
          text: "Activo"
        };
      case 'completed':
        return {
          icon: CheckCircle,
          className: "bg-green-100 text-green-700 border-green-200", 
          text: "Completado"
        };
      case 'cancelled':
        return {
          icon: X,
          className: "bg-red-100 text-red-700 border-red-200",
          text: "Cancelado"
        };
      case 'paused':
        return {
          icon: Pause,
          className: "bg-yellow-100 text-yellow-700 border-yellow-200",
          text: "Pausado"
        };
      default:
        return {
          icon: Clock,
          className: "bg-gray-100 text-gray-700 border-gray-200",
          text: gasto.status
        };
    }
  };
  
  const variant = getStatusVariant();
  const Icon = variant.icon;
  
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${variant.className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {variant.text}
    </div>
  );
}

// Component for amount display (adapts to type)
function AmountDisplay({ expense }: { expense: UnifiedMonthlyExpense }) {
  // Handle budgets
  if (isBudgetExpense(expense)) {
    const budget = expense.original_data as Budget;
    const utilization = (budget.spent / budget.total) * 100;
    
    return (
      <div className="text-right">
        <div className="font-medium">{formatCurrency(budget.total)}</div>
        <div className="text-xs text-gray-500">
          {formatCurrency(budget.spent)} usado ({utilization.toFixed(0)}%)
        </div>
      </div>
    );
  }

  // Handle gastos
  const gasto = expense.original_data as Gasto;
  
  // Handle VariableExpense
  if (isVariableExpense(gasto)) {
    const hasVariation = Math.abs(gasto.amount_variation) > 0;
    const variationPercentage = gasto.trend_percentage;
    
    return (
      <div className="text-right">
        <div className="font-medium">{formatCurrency(gasto.estimated_amount)}</div>
        <div className="text-xs flex items-center justify-end">
          {hasVariation ? (
            <>
              {gasto.amount_variation > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                  <span className="text-red-600">+{formatCurrency(Math.abs(gasto.amount_variation))}</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600">-{formatCurrency(Math.abs(gasto.amount_variation))}</span>
                </>
              )}
              <span className="text-gray-500 ml-1">({variationPercentage > 0 ? '+' : ''}{variationPercentage.toFixed(1)}%)</span>
            </>
          ) : (
            <span className="text-gray-500">sin cambios</span>
          )}
        </div>
      </div>
    );
  }
  
  if (isInstallment(gasto)) {
    const isOverdue = gasto.status === 'active' && 
      gasto.next_due_date && 
      new Date(gasto.next_due_date) < new Date();
    
    return (
      <div className="text-right">
        <div className="font-medium">{formatCurrency(gasto.installment_amount)}</div>
        <div className="text-xs text-gray-500">
          {gasto.remaining_installments > 0 ? (
            <>
              {gasto.remaining_installments} restante{gasto.remaining_installments !== 1 ? 's' : ''}
              {isOverdue && <span className="text-red-600 ml-1">(vencida)</span>}
            </>
          ) : (
            'Completada'
          )}
        </div>
      </div>
    );
  }
  
  // REMOVED: isFixedExpense - migrated to VariableExpense
  
  // REMOVED: isAutomaticDebit - migrated to VariableExpense
  
  return <div className="text-right">—</div>;
}

// Component for progress/status display (adapts to type)
function ProgressDisplay({ expense }: { expense: UnifiedMonthlyExpense }) {
  // Handle budgets
  if (isBudgetExpense(expense)) {
    const budget = expense.original_data as Budget;
    const utilization = (budget.spent / budget.total) * 100;
    const progressColor = utilization >= 100 
      ? 'bg-red-500' 
      : utilization >= 80 
      ? 'bg-amber-500' 
      : 'bg-green-500';
    
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Presupuesto</span>
          <span className="text-xs text-gray-500">{utilization.toFixed(0)}%</span>
        </div>
        <Progress 
          value={Math.min(utilization, 100)} 
          className={`h-2 ${progressColor}`}
        />
      </div>
    );
  }

  // Handle gastos
  const gasto = expense.original_data as Gasto;
  
  // Handle VariableExpense - show accuracy rate and trend
  if (isVariableExpense(gasto)) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthRecord = gasto.payment_history.find(p => p.month === currentMonth);
    
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">Precisión: {gasto.accuracy_rate.toFixed(0)}%</span>
          {currentMonthRecord && (
            <PaymentStatusIndicator status={currentMonthRecord.payment_status} />
          )}
        </div>
        {gasto.billing_day && (
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Calendar className="h-3 w-3 mr-1" />
            Día {gasto.billing_day}
          </div>
        )}
      </div>
    );
  }
  
  if (isInstallment(gasto)) {
    const isOverdue = gasto.status === 'active' && 
      gasto.next_due_date && 
      new Date(gasto.next_due_date) < new Date();
    
    const progressColor = gasto.status === 'completed' 
      ? 'bg-green-500' 
      : isOverdue 
      ? 'bg-red-500' 
      : 'bg-blue-500';
    
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            {gasto.paid_installments}/{gasto.total_installments}
          </span>
          <span className="text-xs text-gray-500">
            {gasto.progress_percentage}%
          </span>
        </div>
        <Progress 
          value={gasto.progress_percentage} 
          className={`h-2 ${progressColor}`}
        />
      </div>
    );
  }
  
  // REMOVED: isFixedExpense - migrated to VariableExpense
  
  // REMOVED: isAutomaticDebit - migrated to VariableExpense
  
  return <span className="text-gray-400">—</span>;
}

// Component for next payment/due date
function NextPaymentDisplay({ expense }: { expense: UnifiedMonthlyExpense }) {
  // Budgets don't have payment dates
  if (isBudgetExpense(expense)) {
    return <span className="text-gray-400">—</span>;
  }

  const gasto = expense.original_data as Gasto;
  
  // Handle VariableExpense
  if (isVariableExpense(gasto) && gasto.status === 'active' && gasto.next_billing_date) {
    const billingDate = new Date(gasto.next_billing_date);
    const isThisMonth = billingDate.getMonth() === new Date().getMonth() && 
                       billingDate.getFullYear() === new Date().getFullYear();
    
    return (
      <div className="flex items-center">
        <Calendar className={`h-3 w-3 mr-1 ${isThisMonth ? 'text-orange-500' : 'text-gray-400'}`} />
        <span className={`text-xs ${isThisMonth ? 'text-orange-600' : 'text-gray-600'}`}>
          {format(billingDate, 'dd MMM', { locale: es })}
          {isThisMonth && ' (este mes)'}
        </span>
      </div>
    );
  }
  
  if (isInstallment(gasto)) {
    if (!gasto.next_due_date || gasto.status !== 'active') {
      return <span className="text-gray-400">—</span>;
    }
    
    const dueDate = new Date(gasto.next_due_date);
    const isOverdue = dueDate < new Date();
    const isThisMonth = dueDate.getMonth() === new Date().getMonth() && 
                       dueDate.getFullYear() === new Date().getFullYear();
    
    return (
      <div className="flex items-center">
        <Calendar className={`h-3 w-3 mr-1 ${isOverdue ? 'text-red-500' : isThisMonth ? 'text-amber-500' : 'text-gray-400'}`} />
        <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : isThisMonth ? 'text-amber-600' : 'text-gray-600'}`}>
          {format(dueDate, 'dd MMM', { locale: es })}
          {isOverdue && ' (vencida)'}
          {isThisMonth && !isOverdue && ' (este mes)'}
        </span>
      </div>
    );
  }
  
  // REMOVED: isAutomaticDebit - migrated to VariableExpense
  
  return <span className="text-gray-400">—</span>;
}

// Component for payment method display
function PaymentMethodDisplay({ paymentMethodId }: { paymentMethodId: string }) {
  const { calculatedPaymentMethods } = usePaymentMethodStore();
  
  // First try to find by name in calculated methods
  const paymentMethod = calculatedPaymentMethods.find(pm => pm.name === paymentMethodId);
  
  if (!paymentMethod) {
    return <span className="text-gray-400">—</span>;
  }
  
  return (
    <span className={`text-xs font-medium ${paymentMethod.color || 'text-gray-600'}`}>
      {paymentMethod.name}
    </span>
  );
}

export function GastosTable({ gastos }: GastosTableProps) {
  const [selectedGastoId, setSelectedGastoId] = useState<string | null>(null);
  const [orderedGastos, setOrderedGastos] = useState<UnifiedMonthlyExpense[]>(gastos);
  
  // Update ordered gastos when gastos prop changes
  React.useEffect(() => {
    setOrderedGastos(gastos);
  }, [gastos]);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const { 
    markInstallmentPayment,
    toggleGastoActive,
    deleteGasto,
    recordVariablePayment,
    isLoading 
  } = useGastoStore();
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrderedGastos((items) => {
      const activeIndex = items.findIndex((item) => item.id === active.id);
      const overIndex = items.findIndex((item) => item.id === over.id);
      
      // Only allow reordering within the same type
      const activeItem = items[activeIndex];
      const overItem = items[overIndex];
      
      if (activeItem.type !== overItem.type) {
        return items; // Don't allow cross-type dragging
      }

      return arrayMove(items, activeIndex, overIndex);
    });
  };

  // Group gastos by type using ordered gastos
  const groupedGastos = orderedGastos.reduce((groups, expense) => {
    const type = expense.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(expense);
    return groups;
  }, {} as Record<string, UnifiedMonthlyExpense[]>);

  // Define section order and titles
  const sectionConfig = {
    installment: { title: 'CUOTAS', order: 1 },
    variable_expense: { title: 'GASTOS FIJOS', order: 2 },
    budget: { title: 'PRESUPUESTOS', order: 3 }
  };

  // Get ordered sections
  const orderedSections = Object.entries(groupedGastos)
    .filter(([type]) => sectionConfig[type as keyof typeof sectionConfig])
    .sort(([typeA], [typeB]) => {
      const orderA = sectionConfig[typeA as keyof typeof sectionConfig]?.order || 999;
      const orderB = sectionConfig[typeB as keyof typeof sectionConfig]?.order || 999;
      return orderA - orderB;
    });

  // Handle mark installment payment as paid
  const handleMarkInstallmentAsPaid = async (installment: Installment) => {
    if (installment.status !== 'active' || installment.paid_installments >= installment.total_installments) {
      return;
    }
    
    try {
      setSelectedGastoId(installment.id);
      await markInstallmentPayment(installment.id, installment.paid_installments + 1, true);
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    } finally {
      setSelectedGastoId(null);
    }
  };

  // Handle undo installment payment
  const handleUndoInstallmentPayment = async (installment: Installment) => {
    if (installment.paid_installments === 0) {
      return;
    }
    
    try {
      setSelectedGastoId(installment.id);
      await markInstallmentPayment(installment.id, installment.paid_installments, false);
    } catch (error) {
      console.error('Error undoing payment:', error);
    } finally {
      setSelectedGastoId(null);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (gastoId: string) => {
    try {
      setSelectedGastoId(gastoId);
      await toggleGastoActive(gastoId);
    } catch (error) {
      console.error('Error toggling gasto status:', error);
    } finally {
      setSelectedGastoId(null);
    }
  };

  // Handle delete gasto
  const handleDelete = async (gastoId: string, description: string) => {
    if (!confirm(`¿Estás seguro que quieres eliminar "${description}"?`)) {
      return;
    }
    
    try {
      setSelectedGastoId(gastoId);
      await deleteGasto(gastoId);
    } catch (error) {
      console.error('Error deleting gasto:', error);
    } finally {
      setSelectedGastoId(null);
    }
  };

  // Handle record variable payment
  const handleRecordVariablePayment = async (variableExpense: VariableExpense) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentRecord = variableExpense.payment_history.find(p => p.month === currentMonth);
    
    if (!currentRecord) {
      alert('No se encontró el registro para el mes actual.');
      return;
    }
    
    const actualAmountStr = prompt(
      `Registrar pago real para "${variableExpense.description}" (${currentMonth})\n` +
      `Presupuestado: ${formatCurrency(currentRecord.amount_budgeted)}\n` +
      `Ingresa el monto real pagado:`,
      currentRecord.amount_paid?.toString() || currentRecord.amount_budgeted.toString()
    );
    
    if (actualAmountStr === null) return; // User cancelled
    
    const actualAmount = parseFloat(actualAmountStr.replace(/[^\d.-]/g, ''));
    if (isNaN(actualAmount) || actualAmount < 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }
    
    try {
      setSelectedGastoId(variableExpense.id);
      await recordVariablePayment(variableExpense.id, currentMonth, actualAmount);
    } catch (error) {
      console.error('Error recording variable payment:', error);
    } finally {
      setSelectedGastoId(null);
    }
  };

  if (gastos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No se encontraron gastos con los filtros aplicados
      </div>
    );
  }

  return (
    <div className="w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8"></TableHead>
            <TableHead className="w-[120px]">Método Pago</TableHead>
            <TableHead className="w-[260px]">Descripción</TableHead>
            <TableHead className="w-[140px]">Progreso/Estado</TableHead>
            <TableHead className="w-[110px]">Próximo Pago</TableHead>
            <TableHead className="w-[90px] text-right">Monto</TableHead>
            <TableHead className="w-[90px]">Estado</TableHead>
            <TableHead className="w-[100px]">Est. Pago</TableHead>
            <TableHead className="w-[120px]">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orderedSections.map(([type, expenses]) => {
            const config = sectionConfig[type as keyof typeof sectionConfig];
            return (
              <React.Fragment key={type}>
                {/* Section Header */}
                <TableRow>
                  <TableCell colSpan={9} className="bg-gray-100 font-semibold text-gray-700 text-sm py-2">
                    {config.title}
                  </TableCell>
                </TableRow>
                {/* Section Expenses */}
                <SortableContext items={expenses.map(e => e.id)} strategy={verticalListSortingStrategy}>
                  {expenses.map((expense) => {
            const isProcessing = selectedGastoId === expense.id && isLoading;
            
            // For budgets, no actions are available
            const isBudget = isBudgetExpense(expense);
            
            // Action availability based on type and status (only for gastos)
            let canMarkPaid = false;
            let canUndoPayment = false;
            let canRecordPayment = false;
            
            if (!isBudget) {
              const gasto = expense.original_data as Gasto;
              
              // Installment actions
              canMarkPaid = isInstallment(gasto) && 
                           gasto.status === 'active' && 
                           gasto.paid_installments < gasto.total_installments;
              
              canUndoPayment = isInstallment(gasto) && gasto.paid_installments > 0;
              
              // Variable expense actions
              canRecordPayment = isVariableExpense(gasto) && gasto.status === 'active';
            }
            
            return (
              <SortableTableRow key={expense.id} expense={expense} isProcessing={isProcessing}>
                
                {/* Payment Method */}
                <TableCell>
                  {expense.payment_method_id ? (
                    <PaymentMethodDisplay paymentMethodId={expense.payment_method_id} />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                
                {/* Description */}
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{expense.description}</div>
                    <div className="text-xs text-gray-500">
                      {!isBudget && (() => {
                        const gasto = expense.original_data as Gasto;
                        if (isInstallment(gasto)) {
                          return `${formatCurrency(gasto.total_amount)} en ${gasto.total_installments} cuotas`;
                        }
                        if (isVariableExpense(gasto)) {
                          return gasto.category + (gasto.last_month_amount ? ` • Último: ${formatCurrency(gasto.last_month_amount)}` : '');
                        }
                        // REMOVED: isFixedExpense y isAutomaticDebit - migrated to VariableExpense
                        return '';
                      })()}
                      {isBudget && 'Presupuesto mensual'}
                    </div>
                  </div>
                </TableCell>
                
                {/* Progress/Status */}
                <TableCell>
                  <ProgressDisplay expense={expense} />
                </TableCell>
                
                {/* Next Payment Date */}
                <TableCell>
                  <NextPaymentDisplay expense={expense} />
                </TableCell>
                
                {/* Amount */}
                <TableCell>
                  <AmountDisplay expense={expense} />
                </TableCell>
                
                {/* Status */}
                <TableCell>
                  <StatusBadge expense={expense} />
                </TableCell>
                
                {/* Payment Status (only for VariableExpense) */}
                <TableCell>
                  {!isBudget && (() => {
                    const gasto = expense.original_data as Gasto;
                    if (isVariableExpense(gasto)) {
                      const currentMonth = new Date().toISOString().slice(0, 7);
                      const currentMonthRecord = gasto.payment_history.find(p => p.month === currentMonth);
                      
                      if (currentMonthRecord) {
                        return <PaymentStatusIndicator status={currentMonthRecord.payment_status} />;
                      } else {
                        return <PaymentStatusIndicator status="pending" />;
                      }
                    }
                    return <span className="text-gray-400 text-xs">—</span>;
                  })()}
                  {isBudget && <span className="text-gray-400 text-xs">—</span>}
                </TableCell>
                
                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    {isBudget ? (
                      // Budgets have no actions - read-only
                      <span className="text-xs text-gray-500 px-2">Solo lectura</span>
                    ) : (
                      <>
                        {/* Installment-specific actions */}
                        {canMarkPaid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkInstallmentAsPaid(expense.original_data as Installment)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Marcar próxima cuota como pagada"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {canUndoPayment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUndoInstallmentPayment(expense.original_data as Installment)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            title="Deshacer último pago"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {/* Variable expense actions */}
                        {canRecordPayment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecordVariablePayment(expense.original_data as VariableExpense)}
                            disabled={isProcessing}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Registrar pago real del mes"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {/* Toggle active/pause */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(expense.id)}
                          disabled={isProcessing}
                          className={`h-8 w-8 p-0 ${expense.is_active 
                            ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'}`}
                          title={expense.is_active ? "Pausar" : "Activar"}
                        >
                          {expense.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                        
                        {/* Edit button (placeholder) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={true}
                          className="h-8 w-8 p-0 text-gray-400"
                          title="Editar (próximamente)"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id, expense.description)}
                          disabled={isProcessing}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </SortableTableRow>
            );
                  })}
                </SortableContext>
              </React.Fragment>
            );
          })}
        </TableBody>
        </Table>
      </DndContext>
      
      {/* Table footer with summary */}
      <div className="border-t bg-gray-50 px-4 py-3 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Total gastos:</span> {gastos.length}
            <div className="text-xs text-gray-500">
              {gastos.filter(g => g.type === 'installment').length} cuotas, {' '}
              {gastos.filter(g => g.type === 'variable_expense').length} fijos, {' '}
              {gastos.filter(g => g.type === 'budget').length} presupuestos
            </div>
          </div>
          
          <div>
            <span className="font-medium">Mensual total:</span> {' '}
            {formatCurrency(
              gastos.reduce((sum, expense) => {
                if (!expense.is_active) return sum;
                if (isBudgetExpense(expense)) return sum; // Budgets are separate
                
                const gasto = expense.original_data as Gasto;
                if (gasto.status === 'completed' || gasto.status === 'cancelled') return sum;
                
                if (isInstallment(gasto)) return sum + gasto.installment_amount;
                if (isVariableExpense(gasto)) return sum + gasto.estimated_amount;
                // REMOVED: isFixedExpense y isAutomaticDebit - migrated to VariableExpense
                return sum;
              }, 0)
            )}
            <div className="text-xs text-gray-500">gastos activos estimados</div>
          </div>
          
          <div>
            <span className="font-medium">Estados:</span>{' '}
            {gastos.filter(g => g.is_active).length} activo{gastos.filter(g => g.is_active).length !== 1 ? 's' : ''},{' '}
            {gastos.filter(g => !g.is_active).length} pausado{gastos.filter(g => !g.is_active).length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}