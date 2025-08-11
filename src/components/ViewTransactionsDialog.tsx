import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface Transaction {
  id: string;
  date: Date;
  store: string;
  amount: number;
  budget: string; // El nombre del presupuesto (para retrocompatibilidad)
  budgetId: string; // Nuevo: el ID del presupuesto
  time?: string;
}

interface Budget {
  id: string;
  name: string;
  total: number;
  spent: number;
}

interface ViewTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onCategorize?: (transactionId: string, budgetId: string, budgetName: string) => void;
  availableBudgets: Budget[];
}

// Las categorías ahora se reciben como prop

export function ViewTransactionsDialog({
  open,
  onOpenChange,
  transactions,
  onCategorize = () => {},
  availableBudgets = []
}: ViewTransactionsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all");
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Ya no necesitamos calcular categorías únicas, usamos directamente availableBudgets
  
  // Filter transactions based on selected category
  const filteredTransactions = useMemo(() => {
    if (!categoryFilter || categoryFilter === "all") return transactions;
    return transactions.filter(t => t.budgetId === categoryFilter);
  }, [transactions, categoryFilter]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">Todas las Transacciones</DialogTitle>
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Filtrar por categoría:</span>
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {availableBudgets.map(budget => (
                    <SelectItem key={budget.id} value={budget.id}>{budget.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Comercio</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Presupuesto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {format(transaction.date, "dd/MM/yyyy")} {transaction.time || "12:00"}
                    </TableCell>
                    <TableCell>{transaction.store}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>
                      {editingTransaction === transaction.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableBudgets.map(budget => (
                                <SelectItem key={budget.id} value={budget.id}>{budget.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => {
                              const selectedBudget = availableBudgets.find(b => b.id === selectedCategory);
                              onCategorize(transaction.id, selectedCategory, selectedBudget?.name || '');
                              setEditingTransaction(null);
                            }}
                            size="sm"
                            disabled={!selectedCategory}
                          >
                            Guardar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className={`${!transaction.budgetId ? 'text-gray-400 italic' : ''}`}>
                            {transaction.budgetId ? availableBudgets.find(b => b.id === transaction.budgetId)?.name || 'Sin categoría' : 'Sin categoría'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditingTransaction(transaction.id);
                              setSelectedCategory(transaction.budgetId || "");
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-gray-500">
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
