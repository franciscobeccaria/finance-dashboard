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
}

export function ViewTransactionsDialog({
  open,
  onOpenChange,
  transactions,
}: ViewTransactionsDialogProps) {
  const [categoryFilter, setCategoryFilter] = useState<string | null>("all");
  
  // Get unique categories for the filter
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    transactions.forEach(transaction => uniqueCategories.add(transaction.budget));
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
                    <TableCell>{transaction.budget}</TableCell>
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
