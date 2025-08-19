import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { toast } from "sonner";
import { createPaymentMethod, PaymentMethod } from "@/services/api";

// Extended session type
type ExtendedSession = {
  accessToken?: string;
  refreshToken?: string;
  error?: string;
};

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (paymentMethod: PaymentMethod) => void;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSave,
}: AddPaymentMethodDialogProps) {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [color, setColor] = useState("text-blue-500");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Por favor ingresa un nombre para el medio de pago");
      return;
    }

    const extendedSession = session as typeof session & ExtendedSession;
    if (!extendedSession?.accessToken) {
      toast.error("No estás autenticado");
      return;
    }

    setIsLoading(true);
    try {
      const newPaymentMethod = await createPaymentMethod(extendedSession.accessToken, {
        name: name.trim(),
        color: color,
      });

      // Call parent callback
      onSave(newPaymentMethod);

      // Reset form
      setName("");
      setColor("text-blue-500");
      
      toast.success(`Medio de pago "${newPaymentMethod.name}" creado exitosamente`);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving payment method:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al guardar el medio de pago");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">
            Agregar Medio de Pago
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="paymentName" className="text-left sm:text-right text-sm">
              Nombre
            </label>
            <div className="sm:col-span-3">
              <Input
                id="paymentName"
                placeholder="Ej: Mi Banco, Billetera Personal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
            <label className="text-left sm:text-right text-sm pt-2">
              Color
            </label>
            <div className="sm:col-span-3">
              <ColorPicker
                selectedColor={color}
                onColorChange={setColor}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isLoading} 
            className="w-full sm:w-auto"
          >
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}