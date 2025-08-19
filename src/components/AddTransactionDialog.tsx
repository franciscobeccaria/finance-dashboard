import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar as CalendarIcon, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "sonner";
import { getPaymentMethodColor } from "@/lib/paymentMethodColors";
import { fetchPaymentMethods, PaymentMethod } from "@/services/api";

// Extended session type
type ExtendedSession = {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

interface Budget {
  id: string;
  name: string;
  total: number;
  spent?: number;
  isSpecial?: boolean;
}

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgets: Budget[];
  paymentMethods: PaymentMethod[];
  onSave: (transaction: {
    merchant: string;
    amount: number;
    budgetId: string;
    date: Date;
    time: string;
    paymentMethodId?: string;
  }) => Promise<void>;
}

// This will be replaced with API call to fetch payment methods

export function AddTransactionDialog({
  open,
  onOpenChange,
  budgets,
  paymentMethods,
  onSave,
}: AddTransactionDialogProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [time, setTime] = useState("12:00");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Filter out special budgets (like "Movimientos")
  const availableBudgets = budgets.filter(budget => !budget.isSpecial);

  // Payment methods now come as props, no need to load them

  const handleSave = async () => {
    if (!merchant || !amount || !selectedBudgetId || !date) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    // Use selected payment method directly

    setIsLoading(true);
    try {
      await onSave({
        merchant,
        amount: parseFloat(amount),
        budgetId: selectedBudgetId,
        date,
        time,
        paymentMethodId: selectedPaymentMethodId || undefined,
      });
      
      // Reset form
      setMerchant("");
      setAmount("");
      setSelectedBudgetId("");
      setSelectedPaymentMethodId("");
      setDate(new Date());
      setTime("12:00");
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error("Error al guardar la transacción");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">Añadir Transacción</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="comercio" className="text-left sm:text-right text-sm">
              Comercio
            </label>
            <Input
              id="comercio"
              placeholder="Nombre del comercio"
              className="sm:col-span-3"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="monto" className="text-left sm:text-right text-sm">
              Monto
            </label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              placeholder="0 (negativos para reembolsos)"
              className="sm:col-span-3"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="presupuesto" className="text-left sm:text-right text-sm">
              Presupuesto
            </label>
            <div className="sm:col-span-3">
              <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {availableBudgets
                    .sort((a, b) => {
                      // Movimientos siempre al final
                      if (a.isSpecial && a.name.toLowerCase() === "movimientos") return 1;
                      if (b.isSpecial && b.name.toLowerCase() === "movimientos") return -1;
                      // Resto alfabético
                      return a.name.localeCompare(b.name);
                    })
                    .map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="fecha" className="text-left sm:text-right text-sm">
              Fecha
            </label>
            <div className="sm:col-span-3">
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Seleccionar fecha"}
                </Button>
                {showCalendar && (
                  <div className="absolute z-10 mt-1 bg-white shadow-md rounded-md border">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setShowCalendar(false);
                      }}
                      initialFocus
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="hora" className="text-left sm:text-right text-sm">
              Hora
            </label>
            <div className="sm:col-span-3">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-gray-400" />
                <Input
                  id="hora"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="paymentMethod" className="text-left sm:text-right text-sm">
              Medio de Pago
            </label>
            <div className="sm:col-span-3">
              <div className="flex items-center">
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
                <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar medio de pago (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem 
                        key={method.id} 
                        value={method.id}
                        className={method.color || ""}
                      >
                        {method.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
