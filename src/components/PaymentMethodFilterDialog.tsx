import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentMethodCard } from "@/components/PaymentMethodCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Settings, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { getPaymentMethodColor } from "@/lib/paymentMethodColors";
import { fetchPaymentMethods, deletePaymentMethod, PaymentMethod } from "@/services/api";
import { toast } from "sonner";

// Extended session type
type ExtendedSession = {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

interface Transaction {
  id: string;
  date: Date;
  store: string;
  amount: number;
  budget: string;
  budgetId: string;
  time?: string;
  paymentMethod?: string;
  description?: string;
}

interface PaymentMethodFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  availableBudgets: Budget[];
  paymentMethods: PaymentMethod[];
  onOpenCreatePaymentMethod?: () => void;
  onPaymentMethodsChange?: (paymentMethods: PaymentMethod[]) => void;
}

interface Budget {
  id: string;
  name: string;
  total: number;
  spent: number;
  isSpecial?: boolean;
}

interface PaymentMethodSummary {
  name: string;
  amount: number;
  transactionCount: number;
  percentage: number;
}

// Helper function to check if a transaction belongs to "Movimientos" category
const isMovimientosTransaction = (transaction: Transaction, availableBudgets: Budget[]): boolean => {
  if (!transaction.budgetId) return false;
  
  // Check by hardcoded ID
  if (transaction.budgetId === "movimientos") {
    return true;
  }
  
  // Check by budget name (case insensitive)
  const budget = availableBudgets.find(b => b.id === transaction.budgetId);
  return budget ? budget.name.toLowerCase() === "movimientos" : false;
};

export function PaymentMethodFilterDialog({
  open,
  onOpenChange,
  transactions,
  availableBudgets,
  paymentMethods,
  onOpenCreatePaymentMethod,
  onPaymentMethodsChange,
}: PaymentMethodFilterDialogProps) {
  const { data: session } = useSession();
  const [includeMovimientos, setIncludeMovimientos] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Payment methods now come as props, no need to load them

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    const extendedSession = session as typeof session & ExtendedSession;
    if (!extendedSession?.accessToken) return;

    // Store original state for rollback if needed
    const originalPaymentMethods = paymentMethods;
    const deletedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);

    setDeletingId(paymentMethodId);
    
    // OPTIMISTIC UPDATE: Update UI immediately
    const updatedMethods = paymentMethods.filter(pm => pm.id !== paymentMethodId);
    if (onPaymentMethodsChange) {
      onPaymentMethodsChange(updatedMethods);
    }
    
    // If we were viewing this payment method, clear selection
    if (selectedPaymentMethod && deletedPaymentMethod?.name === selectedPaymentMethod) {
      setSelectedPaymentMethod(null);
    }
    
    try {
      // Send delete request to backend
      await deletePaymentMethod(extendedSession.accessToken, paymentMethodId);
      
      toast.success("Medio de pago eliminado correctamente");
    } catch (error) {
      console.error('Error deleting payment method:', error);
      
      // ROLLBACK: Restore original state if backend request failed
      if (onPaymentMethodsChange) {
        onPaymentMethodsChange(originalPaymentMethods);
      }
      
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al eliminar el medio de pago");
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  // Filter transactions based on include movimientos setting
  const filteredTransactions = useMemo(() => {
    if (includeMovimientos) {
      return transactions;
    }
    return transactions.filter(t => !isMovimientosTransaction(t, availableBudgets));
  }, [transactions, includeMovimientos, availableBudgets]);
  
  // Filter transactions for table display based on selected payment method
  const displayTransactions = useMemo(() => {
    if (!selectedPaymentMethod) {
      return filteredTransactions;
    }
    return filteredTransactions.filter(t => {
      const paymentMethod = t.paymentMethod || "Sin especificar";
      return paymentMethod === selectedPaymentMethod;
    });
  }, [filteredTransactions, selectedPaymentMethod]);
  
  // Helper function to get category display colors
  const getCategoryDisplayColor = (budgetId: string | null, budgetName: string, isSpecial?: boolean) => {
    if (!budgetId) {
      return "text-red-600 font-medium"; // Sin categoría - llamativo (rojo)
    }
    if (isSpecial && budgetName.toLowerCase() === "movimientos") {
      return "text-gray-600 italic"; // Movimientos - sutil pero distinguible
    }
    return ""; // Categorías normales sin color especial
  };
  
  // Calculate payment method analytics
  const paymentMethodSummaries = useMemo<PaymentMethodSummary[]>(() => {
    const paymentMethodMap = new Map<string, { amount: number; count: number }>();
    let totalAmount = 0;
    
    // Group transactions by payment method
    filteredTransactions.forEach(transaction => {
      const paymentMethod = transaction.paymentMethod || "Sin especificar";
      const amount = transaction.amount;
      
      totalAmount += amount;
      
      if (paymentMethodMap.has(paymentMethod)) {
        const existing = paymentMethodMap.get(paymentMethod)!;
        paymentMethodMap.set(paymentMethod, {
          amount: existing.amount + amount,
          count: existing.count + 1
        });
      } else {
        paymentMethodMap.set(paymentMethod, {
          amount: amount,
          count: 1
        });
      }
    });
    
    // Convert to array and calculate percentages
    const allSummaries: PaymentMethodSummary[] = Array.from(paymentMethodMap.entries()).map(([name, data]) => ({
      name,
      amount: data.amount,
      transactionCount: data.count,
      percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0
    }));
    
    // Filter out payment methods that no longer exist (except automatic ones like "Santander", "Naranja X", etc.)
    const availablePaymentMethodNames = paymentMethods.map(pm => pm.name);
    const filteredSummaries = allSummaries.filter(summary => {
      // Always show automatic payment methods (non-Manual sources)
      if (summary.name !== "Manual" && summary.name !== "Sin especificar") {
        // Check if it's a custom payment method that was deleted
        if (summary.name !== "Santander" && summary.name !== "Naranja X" && summary.name !== "Belo") {
          return availablePaymentMethodNames.includes(summary.name);
        }
        return true; // Keep automatic payment methods
      }
      return true; // Keep "Manual" and "Sin especificar"
    });
    
    // Sort by amount (descending)
    return filteredSummaries.sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, paymentMethods]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-w-[95vw] max-h-[85vh] overflow-y-auto w-full">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Medios de Pago</DialogTitle>
              <DialogDescription>
                Análisis de gastos por medio de pago
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        {/* Switch para incluir/excluir movimientos */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Switch
              id="include-movimientos"
              checked={includeMovimientos}
              onCheckedChange={setIncludeMovimientos}
            />
            <label 
              htmlFor="include-movimientos" 
              className="text-sm font-medium text-gray-700 cursor-pointer"
            >
              Incluir Movimientos
            </label>
          </div>
          <span className="text-xs text-gray-500">
            {includeMovimientos ? 'Mostrando todas las transacciones' : 'Excluyendo movimientos'}
          </span>
        </div>
        
        {/* Sección de Cards de Análisis */}
        {paymentMethodSummaries.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Medio de Pago</h3>
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${
              paymentMethodSummaries.length === 1 
                ? "lg:grid-cols-1" 
                : paymentMethodSummaries.length === 2 
                ? "lg:grid-cols-2" 
                : paymentMethodSummaries.length === 3 
                ? "lg:grid-cols-3" 
                : "lg:grid-cols-4"
              } gap-4 mb-6`}
            >
              {paymentMethodSummaries.map((summary) => {
                // Find the payment method to get its ID for deletion
                const paymentMethod = paymentMethods.find(pm => pm.name === summary.name);
                
                return (
                  <div key={summary.name} className="relative group">
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedPaymentMethod(
                          selectedPaymentMethod === summary.name ? null : summary.name
                        );
                      }}
                    >
                      <PaymentMethodCard
                        name={summary.name}
                        amount={summary.amount}
                        transactionCount={summary.transactionCount}
                        percentage={summary.percentage}
                        isSelected={selectedPaymentMethod === summary.name}
                      />
                    </div>
                    
                    {/* Delete button - only for custom payment methods, not automatic ones */}
                    {paymentMethod && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePaymentMethod(paymentMethod.id);
                        }}
                        disabled={deletingId === paymentMethod.id}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-red-50 text-red-600 hover:text-red-800 h-8 w-8 p-0"
                      >
                        {deletingId === paymentMethod.id ? (
                          <div className="h-4 w-4 border-2 border-t-transparent border-red-600 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No hay transacciones para mostrar
          </div>
        )}
        
        {/* Sección de Lista de Transacciones */}
        {paymentMethodSummaries.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedPaymentMethod 
                  ? `Transacciones - ${selectedPaymentMethod}` 
                  : 'Todas las Transacciones'
                }
              </h3>
              {selectedPaymentMethod && (
                <button
                  onClick={() => setSelectedPaymentMethod(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto border rounded-lg">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Fecha</TableHead>
                    <TableHead>Comercio</TableHead>
                    <TableHead className="w-20">Monto</TableHead>
                    <TableHead className="w-28">Medio de Pago</TableHead>
                    <TableHead>Categoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransactions.length > 0 ? (
                    displayTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(transaction.date, "dd/MM/yyyy")} {transaction.time || "12:00"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{transaction.store}</span>
                            {transaction.description && (
                              <span className="text-xs text-gray-500 italic">
                                {transaction.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.amount < 0 ? "text-red-600 font-medium" : ""}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.paymentMethod ? (
                            <span className={`text-sm font-medium ${getPaymentMethodColor(transaction.paymentMethod, paymentMethods) || ''}`}>
                              {transaction.paymentMethod}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              No especificado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={getCategoryDisplayColor(
                            transaction.budgetId, 
                            transaction.budget,
                            availableBudgets.find(b => b.id === transaction.budgetId)?.isSpecial
                          )}>
                            {transaction.budgetId ? transaction.budget : "Sin categoría"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No hay transacciones para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}