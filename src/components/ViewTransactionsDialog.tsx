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
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface Transaction {
  id: string;
  date: Date;
  store: string;
  amount: number;
  budget: string;
  time?: string;
}

interface ViewTransactionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  onCategorize?: (transactionId: string, category: string) => void;
}

// Predefined budget categories
const predefinedCategories = [
  "Supermercado", 
  "Restaurantes", 
  "Transporte", 
  "Entretenimiento", 
  "Servicios", 
  "Salud", 
  "Ropa", 
  "Otros"
];

export function ViewTransactionsDialog({
  open,
  onOpenChange,
  transactions,
  onCategorize = () => {}
}: ViewTransactionsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all");
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  
  // Get unique categories for the filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    // Add all predefined categories
    predefinedCategories.forEach(category => uniqueCategories.add(category));
    // Add categories from transactions (if any are assigned)
    transactions.forEach(transaction => {
      if (transaction.budget) {
        uniqueCategories.add(transaction.budget);
      }
    });
    return Array.from(uniqueCategories);
  }, [transactions]);
  
  // Filter transactions based on selected category
  const filteredTransactions = useMemo(() => {
    if (!categoryFilter || categoryFilter === "all") return transactions;
    return transactions.filter(t => t.budget === categoryFilter);
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
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
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
                    <TableCell>${transaction.amount.toFixed(2)}</TableCell>
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
                              {predefinedCategories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => {
                              onCategorize(transaction.id, selectedCategory);
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
                          <span className={`${!transaction.budget ? 'text-gray-400 italic' : ''}`}>
                            {transaction.budget || 'Sin categoría'}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setEditingTransaction(transaction.id);
                              setSelectedCategory(transaction.budget || "");
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
