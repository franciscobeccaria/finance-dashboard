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
import { PlusCircle, X } from "lucide-react";

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
  onCategorize?: (transactionId: string, budgetId: string, budgetName: string) => void;
  availableBudgets: Budget[];
}

export function ViewTransactionsDialog({
  open,
  onOpenChange,
  transactions,
  onCategorize = () => {},
  availableBudgets = []
}: ViewTransactionsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>("all");
  // Usamos Set para manejar múltiples transacciones en edición simultáneamente
  const [editingDescriptionIds, setEditingDescriptionIds] = useState<Set<string>>(new Set());
  
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

  // Función para alternar el estado de edición de la descripción
  const toggleDescriptionEdit = (id: string) => {
    setEditingDescriptionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto w-full">
        <DialogHeader>
          <DialogTitle>Transacciones</DialogTitle>
          <DialogDescription>
            Lista de todas las transacciones
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Filtro de categoría */}
            <div className="flex items-center gap-2">
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {availableBudgets.map(budget => (
                    <SelectItem 
                      key={budget.id} 
                      value={budget.id}
                      className={budget.isSpecial ? "italic text-blue-600 font-semibold" : ""}
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
                <SelectTrigger className="w-[200px]">
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
        
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Medio de Pago</TableHead>
                <TableHead>Presupuesto</TableHead>
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
                        <div className="flex items-center gap-2 relative">
                          <span className="font-medium">{transaction.store}</span>
                          {!transaction.description && !editingDescriptionIds.has(transaction.id) && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 text-blue-500 flex items-center justify-center rounded-full sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                              onClick={() => toggleDescriptionEdit(transaction.id)}
                              title="Añadir descripción"
                            >
                              <PlusCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {transaction.description ? (
                          <div className="flex items-center gap-2 relative">
                            <span className="text-xs text-gray-500">{transaction.description}</span>
                          </div>
                        ) : editingDescriptionIds.has(transaction.id) && (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              className="h-6 text-xs bg-transparent border-transparent shadow-none sm:group-hover:bg-background sm:group-hover:border-input sm:group-hover:shadow-sm transition-all"
                              placeholder="Añadir descripción..."
                              defaultValue=""
                              // No necesitamos el onChange por ahora
                              // Sólo guardamos en el blur si hay texto
                              onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                                // Solo cerramos si el campo está vacío
                                // Si hay texto, mantenemos el input abierto
                                if (e.target.value.trim() === "") {
                                  setEditingDescriptionIds(prev => {
                                    const newSet = new Set(prev);
                                    newSet.delete(transaction.id);
                                    return newSet;
                                  });
                                }
                              }}
                              autoFocus
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 w-5 p-0 text-gray-400 flex items-center justify-center rounded-full sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity"
                              onClick={() => setEditingDescriptionIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(transaction.id);
                                return newSet;
                              })}
                              title="Cancelar"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
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
                      <div className="flex items-center justify-between">
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
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sin categoría">
                              {transaction.budgetId ? transaction.budget : "Sin categoría"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uncategorized">Sin categoría</SelectItem>
                            {availableBudgets.map(budget => (
                              <SelectItem 
                                key={budget.id} 
                                value={budget.id}
                                className={budget.isSpecial ? "italic text-blue-600 font-semibold" : ""}
                              >
                                {budget.name}{budget.isSpecial ? " (especial)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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
      </DialogContent>
    </Dialog>
  );
}
