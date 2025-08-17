import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface Budget {
  id: string;
  name: string;
  spent: number;
  total: number;
  isSpecial?: boolean; // Indica si es una categoría especial como "Movimientos"
}

interface EditBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budget?: Budget;
  onSave: (budget: Omit<Budget, "spent">) => void;
  onDelete?: (id: string) => void;
}

export function EditBudgetDialog({
  open,
  onOpenChange,
  budget,
  onSave,
  onDelete,
}: EditBudgetDialogProps) {
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isEditing = !!budget;

  // Reset form when dialog opens/closes or budget changes
  useEffect(() => {
    if (open && budget) {
      setName(budget.name);
      setTotal(budget.total.toString());
    } else if (open) {
      // New budget defaults
      setName("");
      setTotal("");
    }
    setError(null);
  }, [open, budget]);

  const handleSave = () => {
    // Validate inputs
    if (!name.trim()) {
      setError("El nombre del presupuesto es requerido");
      return;
    }

    const totalValue = parseFloat(total);
    if (isNaN(totalValue) || totalValue <= 0) {
      setError("El monto debe ser un número positivo");
      return;
    }

    // Save the budget (new or updated)
    onSave({
      id: budget?.id || `budget-${Date.now()}`, // Generate a unique ID for new budgets
      name: name.trim(),
      total: totalValue,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    if (budget && onDelete) {
      onDelete(budget.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">
            {isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {error && (
            <div className="text-sm font-medium text-red-500 mb-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="name" className="text-left sm:text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="sm:col-span-3"
              placeholder="Ej: Supermercado, Restaurantes, etc."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label htmlFor="total" className="text-left sm:text-right">
              Monto Total
            </Label>
            <div className="relative sm:col-span-3">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                $
              </span>
              <Input
                id="total"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="pl-8"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto sm:mr-2">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              {isEditing ? "Guardar" : <><Plus className="h-4 w-4 mr-2" />Crear</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
