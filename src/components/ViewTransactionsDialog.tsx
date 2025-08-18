import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { getPaymentMethodColor } from "@/lib/paymentMethodColors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Trash2 } from "lucide-react";

interface Transaction {
  id: string;
  date: Date;
  store: string;
  amount: number;
  budget: string; // El nombre del presupuesto (para retrocompatibilidad)
  budgetId: string; // Nuevo: el ID del presupuesto
  time?: string;
  paymentMethod?: string; // Nuevo: medio de pago (tarjeta, banco, etc)
  description?: string; // Nuevo: descripción personalizada de la transacción
  isManual?: boolean; // Nuevo: indica si es transacción manual (eliminable)
}

interface Budget {
  id: string;
  name: string;
  total: number;
  spent: number;
  isSpecial?: boolean;
}

interface ViewTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onCategorize?: (transactionId: string, budgetId: string, budgetName: string, description?: string) => void;
  onDelete?: (transactionId: string) => void;
  availableBudgets: Budget[];
}

export function ViewTransactionsDialog({
  open,
  onOpenChange,
  transactions,
  onCategorize = () => {},
  onDelete = () => {},
  availableBudgets = []
}: ViewTransactionsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>("all");
  // Estado para manejar las descripciones temporales mientras se editan
  const [tempDescriptions, setTempDescriptions] = useState<Record<string, string>>({});

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
  
  // Get unique payment methods from transactions
  const uniquePaymentMethods = useMemo(() => {
    const methods = new Set<string>();
    transactions.forEach(t => {
      if (t.paymentMethod) {
        methods.add(t.paymentMethod);
      }
    });
    return Array.from(methods).sort();
  }, [transactions]);

  // Filter transactions based on selected category and payment method
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by category
      const matchesCategory = !categoryFilter || categoryFilter === "all" || t.budgetId === categoryFilter;
      
      // Filter by payment method
      const matchesPaymentMethod = !paymentMethodFilter || paymentMethodFilter === "all" || 
        (t.paymentMethod === paymentMethodFilter);
      
      return matchesCategory && matchesPaymentMethod;
    });
  }, [transactions, categoryFilter, paymentMethodFilter]);

  // Función para inicializar descripción temporal cuando el usuario enfoca el input
  const initializeTempDescription = (id: string, currentDescription?: string) => {
    if (!tempDescriptions.hasOwnProperty(id)) {
      setTempDescriptions(prev => ({
        ...prev,
        [id]: currentDescription || ''
      }));
    }
  };

  // Función para limpiar descripción (botón X)
  const clearDescription = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      // Limpiar descripción en backend
      onCategorize(transactionId, transaction.budgetId, transaction.budget, "");
      // Limpiar estado temporal
      setTempDescriptions(prev => ({
        ...prev,
        [transactionId]: ''
      }));
    }
  };

  // Función para guardar la descripción
  const saveDescription = (transactionId: string, description: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (transaction) {
      // Llamar a onCategorize con la descripción actualizada
      onCategorize(transactionId, transaction.budgetId, transaction.budget, description);
    }
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-w-[95vw] max-h-[85vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Transacciones</DialogTitle>
          <DialogDescription>
            Lista de todas las transacciones
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            {/* Filtro de categoría */}
            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {availableBudgets
                    .sort((a, b) => {
                      // Movimientos siempre al final
                      if (a.isSpecial && a.name.toLowerCase() === "movimientos") return 1;
                      if (b.isSpecial && b.name.toLowerCase() === "movimientos") return -1;
                      // Resto alfabético
                      return a.name.localeCompare(b.name);
                    })
                    .map(budget => (
                    <SelectItem 
                      key={budget.id} 
                      value={budget.id}
                      className={getCategoryDisplayColor(budget.id, budget.name, budget.isSpecial)}
                    >
                      {budget.name}{budget.isSpecial ? " (especial)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro de medio de pago */}
            <div className="flex items-center gap-2">
              <Select
                value={paymentMethodFilter || "all"}
                onValueChange={(value) => setPaymentMethodFilter(value)}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todos los medios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los medios</SelectItem>
                  {uniquePaymentMethods.map(method => (
                    <SelectItem 
                      key={method} 
                      value={method}
                      className={`${getPaymentMethodColor(method) || ''}`}
                    >
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Fecha</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead className="w-20">Monto</TableHead>
                <TableHead className="w-28">Medio de Pago</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="group">
                    <TableCell className="font-medium">
                      {format(transaction.date, "dd/MM/yyyy")} {transaction.time || "12:00"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {/* Store name - always visible */}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{transaction.store}</span>
                        </div>
                        
                        {/* Description input - always visible, responsive layout */}
                        <div className="flex items-center gap-2 mt-1 w-full">
                          <Input
                            className="h-6 text-xs bg-transparent border-transparent shadow-none hover:bg-background hover:border-input hover:shadow-sm transition-all flex-1"
                            placeholder="Añadir descripción..."
                            value={tempDescriptions[transaction.id] !== undefined 
                              ? tempDescriptions[transaction.id] 
                              : transaction.description || ''
                            }
                            onFocus={() => initializeTempDescription(transaction.id, transaction.description)}
                            onChange={(e) => {
                              setTempDescriptions(prev => ({
                                ...prev,
                                [transaction.id]: e.target.value
                              }));
                            }}
                            onBlur={() => {
                              const description = tempDescriptions[transaction.id]?.trim();
                              if (description !== transaction.description) {
                                saveDescription(transaction.id, description || '');
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const description = tempDescriptions[transaction.id]?.trim();
                                saveDescription(transaction.id, description || '');
                                e.currentTarget.blur();
                              } else if (e.key === 'Escape') {
                                // Revertir a valor original
                                setTempDescriptions(prev => ({
                                  ...prev,
                                  [transaction.id]: transaction.description || ''
                                }));
                                e.currentTarget.blur();
                              }
                            }}
                          />
                          {/* Clear button - only visible when there's content */}
                          {(tempDescriptions[transaction.id] || transaction.description) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500 flex items-center justify-center rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity flex-shrink-0"
                              onClick={() => clearDescription(transaction.id)}
                              title="Eliminar descripción"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={transaction.amount < 0 ? "text-red-600 font-medium" : ""}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.paymentMethod ? (
                        <span className={`text-sm font-medium ${getPaymentMethodColor(transaction.paymentMethod) || ''}`}>
                          {transaction.paymentMethod}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 italic">
                          No especificado
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={transaction.budgetId || "uncategorized"}
                        onValueChange={(value) => {
                          if (value === "uncategorized") {
                            // Caso para "Sin categoría"
                            onCategorize(transaction.id, "", "");
                          } else {
                            const selectedBudget = availableBudgets.find(b => b.id === value);
                            if (selectedBudget) {
                              onCategorize(transaction.id, value, selectedBudget.name || '');
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sin categoría">
                            <span className={getCategoryDisplayColor(
                              transaction.budgetId, 
                              transaction.budget,
                              availableBudgets.find(b => b.id === transaction.budgetId)?.isSpecial
                            )}>
                              {transaction.budgetId ? transaction.budget : "Sin categoría"}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uncategorized" className="text-red-600 font-medium">
                            Sin categoría
                          </SelectItem>
                          {availableBudgets
                            .sort((a, b) => {
                              // Movimientos siempre al final
                              if (a.isSpecial && a.name.toLowerCase() === "movimientos") return 1;
                              if (b.isSpecial && b.name.toLowerCase() === "movimientos") return -1;
                              // Resto alfabético
                              return a.name.localeCompare(b.name);
                            })
                            .map(budget => (
                            <SelectItem 
                              key={budget.id} 
                              value={budget.id}
                              className={getCategoryDisplayColor(budget.id, budget.name, budget.isSpecial)}
                            >
                              {budget.name}{budget.isSpecial ? " (especial)" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      {/* Delete button - only for manual transactions */}
                      {transaction.isManual && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(transaction.id)}
                          title="Eliminar transacción"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                    No hay transacciones para mostrar
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
