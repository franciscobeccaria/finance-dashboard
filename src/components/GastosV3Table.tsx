import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Check, 
  X, 
  Trash2, 
  Calendar, 
  DollarSign,
  FileText,
  GripVertical
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { 
  MonthlyExpenseInstance,
  PaymentStatus,
  isInstallmentInstance,
  isVariableExpenseInstance
} from "@/types/gastos";
import {
  isBudgetInstance
} from "@/lib/monthlyInstanceUtils";
import { useMonthlyInstanceStore } from "@/stores/monthlyInstanceStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";

interface GastosV3TableProps {
  instances: MonthlyExpenseInstance[];
  selectedMonth: string; // 'YYYY-MM'
}

// Sortable row component
function SortableTableRow({ 
  instance, 
  isProcessing, 
  children 
}: { 
  instance: MonthlyExpenseInstance; 
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
  } = useSortable({ id: instance.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow 
      ref={setNodeRef} 
      style={style} 
      className={`${isProcessing ? 'opacity-50' : ''} ${isDragging ? 'bg-blue-50' : ''}`}
    >
      {/* Drag handle cell */}
      <TableCell className="w-8 p-1">
        <button 
          {...attributes}
          {...listeners}
          className="p-1 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
          title="Arrastrar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

// Component for payment status indicator
function PaymentStatusIndicator({ status }: { status: PaymentStatus }) {
  const statusConfig = {
    pending: { emoji: '⚪', text: 'Pendiente', className: 'text-gray-600' },
    paid_accurate: { emoji: '🟢', text: 'Pagado', className: 'text-green-600' },
    paid_moderate: { emoji: '🟡', text: 'Pagado', className: 'text-yellow-600' },
    paid_high: { emoji: '🔴', text: 'Pagado', className: 'text-red-600' },
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

// Payment method display component
function PaymentMethodDisplay({ paymentMethodId }: { paymentMethodId?: string }) {
  const { calculatedPaymentMethods } = usePaymentMethodStore();
  
  if (!paymentMethodId) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  
  const paymentMethod = calculatedPaymentMethods.find(pm => pm.name === paymentMethodId);
  
  if (!paymentMethod) {
    return <span className="text-gray-400 text-xs">No encontrado</span>;
  }
  
  return (
    <span className={`text-xs font-medium ${paymentMethod.color || 'text-gray-600'}`}>
      {paymentMethod.name}
    </span>
  );
}

// Enhanced description with installment info (correction #4 - eliminar columna Tipo)
function EnhancedDescription({ instance }: { instance: MonthlyExpenseInstance }) {
  let displayText = instance.display_name;
  
  // Remove redundant month/year info (correction #5)
  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: es });
  displayText = displayText.replace(new RegExp(currentMonth, 'gi'), '').trim();
  displayText = displayText.replace(/^[-,\s]+|[-,\s]+$/g, ''); // Clean up leading/trailing separators
  
  // Add installment info to description (correction #4)
  if (isInstallmentInstance(instance) && instance.sequence_number && instance.parent_expense_data.total_installments) {
    displayText += ` - Cuota ${instance.sequence_number}/${instance.parent_expense_data.total_installments}`;
  }
  
  return <span className="font-medium text-sm">{displayText}</span>;
}

// Payment dialog for variable expenses (with custom amount)
function PaymentDialog({ 
  instance, 
  onPay, 
  isLoading 
}: { 
  instance: MonthlyExpenseInstance;
  onPay: (amount: number, notes?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(instance.amount_budgeted.toString());
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }
    
    try {
      await onPay(parsedAmount, notes.trim() || undefined);
      setOpen(false);
      setNotes('');
    } catch (error) {
      console.error('Error al procesar pago:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          title={`Pagar ${instance.display_name}`}
          disabled={isLoading}
        >
          <DollarSign className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              <EnhancedDescription instance={instance} />
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Monto
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder={formatCurrency(instance.amount_budgeted)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Observaciones
              </Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Observaciones (opcional)"
              />
            </div>
            <div className="text-sm text-gray-600 border-l-4 border-blue-200 pl-3">
              <p><strong>Presupuestado:</strong> {formatCurrency(instance.amount_budgeted)}</p>
              {instance.due_date && (
                <p><strong>Vencimiento:</strong> {format(new Date(instance.due_date), 'dd/MM/yyyy')}</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Procesando...' : 'Registrar Pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GastosV3Table({ instances, selectedMonth }: GastosV3TableProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [orderedInstances, setOrderedInstances] = useState<MonthlyExpenseInstance[]>([]);
  
  const { 
    payInstance,
    unpayInstance,
    updateInstanceNotes,
    deleteBaseExpense,
    isLoading 
  } = useMonthlyInstanceStore();

  // Filter instances for selected month and update ordered instances
  React.useEffect(() => {
    const monthInstances = instances.filter(instance => instance.month === selectedMonth);
    setOrderedInstances(monthInstances);
  }, [instances, selectedMonth]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setOrderedInstances((items) => {
      const activeIndex = items.findIndex((item) => item.id === active.id);
      const overIndex = items.findIndex((item) => item.id === over.id);
      
      // Only allow reordering within the same type
      const activeItem = items[activeIndex];
      const overItem = items[overIndex];
      
      if (activeItem.parent_expense_type !== overItem.parent_expense_type) {
        return items; // Don't allow cross-type dragging
      }

      return arrayMove(items, activeIndex, overIndex);
    });
  };

  // Group instances by type using ordered instances
  const groupedInstances = orderedInstances.reduce((groups, instance) => {
    const type = instance.parent_expense_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(instance);
    return groups;
  }, {} as Record<string, MonthlyExpenseInstance[]>);

  // Define section order and titles (same as v1 pattern)
  const sectionConfig = {
    installment: { title: 'CUOTAS', order: 1 },
    variable_expense: { title: 'GASTOS FIJOS', order: 2 },
    budget: { title: 'PRESUPUESTOS', order: 3 }
  };

  // Get ordered sections
  const orderedSections = Object.entries(groupedInstances)
    .filter(([type]) => sectionConfig[type as keyof typeof sectionConfig])
    .sort(([typeA], [typeB]) => {
      const orderA = sectionConfig[typeA as keyof typeof sectionConfig]?.order || 999;
      const orderB = sectionConfig[typeB as keyof typeof sectionConfig]?.order || 999;
      return orderA - orderB;
    });

  // Handle pay instance
  const handlePayInstance = async (instance: MonthlyExpenseInstance, amount?: number, notes?: string) => {
    if (instance.amount_paid !== null) return; // Already paid
    
    try {
      setSelectedInstanceId(instance.id);
      await payInstance(instance.id, amount || instance.amount_budgeted);
      
      // Update notes if provided
      if (notes) {
        await updateInstanceNotes(instance.id, notes);
      }
    } catch (error) {
      console.error('Error paying instance:', error);
    } finally {
      setSelectedInstanceId(null);
    }
  };

  // Handle unpay instance
  const handleUnpayInstance = async (instance: MonthlyExpenseInstance) => {
    if (instance.amount_paid === null) return; // Not paid
    
    try {
      setSelectedInstanceId(instance.id);
      await unpayInstance(instance.id);
    } catch (error) {
      console.error('Error unpaying instance:', error);
    } finally {
      setSelectedInstanceId(null);
    }
  };

  // Handle delete parent expense
  const handleDeleteExpense = async (instance: MonthlyExpenseInstance) => {
    if (!confirm(`¿Estás seguro que quieres eliminar "${instance.parent_expense_data.description}" y todas sus instancias mensuales?`)) {
      return;
    }
    
    try {
      setSelectedInstanceId(instance.id);
      await deleteBaseExpense(instance.parent_expense_id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    } finally {
      setSelectedInstanceId(null);
    }
  };

  if (orderedInstances.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay gastos programados para {format(new Date(`${selectedMonth}-01`), 'MMMM yyyy', { locale: es })}
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
              <TableHead className="w-[120px]">Medio de Pago</TableHead>
              <TableHead className="w-[300px]">Descripción</TableHead>
              <TableHead className="w-[100px] text-right">Presupuestado</TableHead>
              <TableHead className="w-[100px] text-right">Pagado</TableHead>
              <TableHead className="w-[140px]">Estado</TableHead>
              <TableHead className="w-[100px]">Vencimiento</TableHead>
              <TableHead className="w-[150px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderedSections.map(([type, sectionInstances]) => {
              const config = sectionConfig[type as keyof typeof sectionConfig];
              return (
                <React.Fragment key={type}>
                  {/* Section Header - Simple como v1 */}
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-100 font-semibold text-gray-700 text-sm py-2">
                      {config.title}
                    </TableCell>
                  </TableRow>
                  {/* Section Instances */}
                  <SortableContext items={sectionInstances.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {sectionInstances.map((instance) => {
                      const isProcessing = selectedInstanceId === instance.id && isLoading;
                      const isPaid = instance.amount_paid !== null;
                      const isInstallment = isInstallmentInstance(instance);
                      const isVariableExpense = isVariableExpenseInstance(instance);
                      const isBudget = isBudgetInstance(instance);
                      
                      return (
                        <SortableTableRow key={instance.id} instance={instance} isProcessing={isProcessing}>
                          
                          {/* Payment Method */}
                          <TableCell>
                            <PaymentMethodDisplay paymentMethodId={instance.payment_method_id} />
                          </TableCell>
                          
                          {/* Enhanced Description (sin columna Tipo) */}
                          <TableCell>
                            <div>
                              <EnhancedDescription instance={instance} />
                              <div className="text-xs text-gray-500 mt-1">
                                {isInstallment && (
                                  <span>
                                    {formatCurrency(instance.parent_expense_data.total_amount)} en {instance.parent_expense_data.total_installments} cuotas
                                  </span>
                                )}
                                {isVariableExpense && (
                                  <span>Gasto fijo mensual</span>
                                )}
                                {isBudget && (
                                  <span>Presupuesto mensual</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Budgeted Amount */}
                          <TableCell className="text-right">
                            <div className="font-medium">{formatCurrency(instance.amount_budgeted)}</div>
                          </TableCell>
                          
                          {/* Paid Amount */}
                          <TableCell className="text-right">
                            {isPaid ? (
                              <div className="font-medium text-green-600">
                                {formatCurrency(instance.amount_paid!)}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          
                          {/* Payment Status */}
                          <TableCell>
                            <PaymentStatusIndicator status={instance.payment_status} />
                          </TableCell>
                          
                          {/* Due Date */}
                          <TableCell>
                            {instance.due_date ? (
                              <div className="flex items-center text-xs text-gray-600">
                                <Calendar className="h-3 w-3 mr-1" />
                                {format(new Date(instance.due_date), 'dd/MM', { locale: es })}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          
                          {/* Actions */}
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isBudget ? (
                                // Budgets are read-only
                                <span className="text-xs text-gray-500 px-2">Solo lectura</span>
                              ) : (
                                <>
                                  {!isPaid ? (
                                    // Different payment UX for installments vs variable expenses
                                    isInstallment ? (
                                      // Simple checkbox for installments (correction #12)
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handlePayInstance(instance, instance.amount_budgeted)}
                                        disabled={isProcessing}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        title="Marcar como pagada"
                                      >
                                        <Check className="h-3 w-3" />
                                      </Button>
                                    ) : (
                                      // Dialog with amount input for variable expenses (correction #12)
                                      <PaymentDialog
                                        instance={instance}
                                        onPay={(amount, notes) => handlePayInstance(instance, amount, notes)}
                                        isLoading={isProcessing}
                                      />
                                    )
                                  ) : (
                                    // Show UNDO button for paid instances
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUnpayInstance(instance)}
                                      disabled={isProcessing}
                                      className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      title="Deshacer pago"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  )}
                                  
                                  {/* Notes tooltip (correction #11) */}
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={true}
                                          className="h-8 w-8 p-0 text-gray-400"
                                        >
                                          <FileText className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{instance.notes || 'Sin observaciones'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  
                                  {/* Delete expense button */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteExpense(instance)}
                                    disabled={isProcessing}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Eliminar gasto completo"
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
            <span className="font-medium">Total gastos del mes:</span> {orderedInstances.length}
            <div className="text-xs text-gray-500">
              {groupedInstances.installment?.length || 0} cuotas, {' '}
              {groupedInstances.variable_expense?.length || 0} gastos fijos, {' '}
              {groupedInstances.budget?.length || 0} presupuestos
            </div>
          </div>
          
          <div>
            <span className="font-medium">Total presupuestado:</span> {' '}
            {formatCurrency(
              orderedInstances.reduce((sum, instance) => sum + instance.amount_budgeted, 0)
            )}
          </div>
          
          <div>
            <span className="font-medium">Total pagado:</span> {' '}
            {formatCurrency(
              orderedInstances.reduce((sum, instance) => sum + (instance.amount_paid || 0), 0)
            )}
            <div className="text-xs text-gray-500">
              {orderedInstances.filter(i => i.amount_paid !== null).length} de {orderedInstances.length} pagadas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}