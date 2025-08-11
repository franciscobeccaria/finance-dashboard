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

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="Ej: Supermercado, Restaurantes, etc."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="total" className="text-right">
              Monto Total
            </Label>
            <div className="relative col-span-3">
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

        <DialogFooter className="flex justify-between">
          {isEditing && onDelete && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
          )}
          <div>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="mr-2">
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSave}>
              {isEditing ? "Guardar" : <><Plus className="h-4 w-4 mr-2" />Crear</>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
