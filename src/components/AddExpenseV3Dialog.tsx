import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CreditCard, Calculator, Building, Zap, ShoppingBag, TrendingUp } from "lucide-react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

import { 
  GastoType,
  CreateInstallmentForm,
  CreateVariableExpenseForm
} from "@/types/gastos";
import { useMonthlyInstanceStore } from "@/stores/monthlyInstanceStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface AddExpenseV3DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type selection options with icons (improved v1 style)
const GASTO_TYPES = [
  { 
    type: 'installment' as GastoType, 
    label: 'Cuota', 
    icon: ShoppingBag,
    description: 'Compras en cuotas',
    color: 'text-blue-600'
  },
  { 
    type: 'variable_expense' as GastoType, 
    label: 'Gasto Fijo', 
    icon: TrendingUp,
    description: 'Servicios recurrentes',
    color: 'text-orange-600'
  },
];

// Common installment options (correction #7.1)
const COMMON_INSTALLMENTS = [3, 6, 12, 18, 24, 36];

// Common billing days
const COMMON_BILLING_DAYS = [1, 5, 10, 15, 20, 25, 30];

export function AddExpenseV3Dialog({
  open,
  onOpenChange,
}: AddExpenseV3DialogProps) {
  // Common fields
  const [selectedType, setSelectedType] = useState<GastoType>('installment');
  const [description, setDescription] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Installment specific fields
  const [totalAmount, setTotalAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [billingDay, setBillingDay] = useState("");

  // Variable expense specific fields
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [variableBillingDay, setVariableBillingDay] = useState("");

  const { addInstallment, addVariableExpense } = useMonthlyInstanceStore();
  const { 
    calculatedPaymentMethods
  } = usePaymentMethodStore();
  const { data: session, status } = useSession();

  // Auto-select first payment method when they load
  useEffect(() => {
    if (calculatedPaymentMethods.length > 0 && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(calculatedPaymentMethods[0].name);
    }
  }, [calculatedPaymentMethods, selectedPaymentMethodId]);

  // Calculate installment amount preview
  const installmentAmount = totalAmount && totalInstallments 
    ? Math.round(parseFloat(totalAmount) / parseInt(totalInstallments))
    : 0;

  const resetForm = () => {
    setSelectedType('installment');
    setDescription("");
    setSelectedPaymentMethodId(calculatedPaymentMethods.length > 0 ? calculatedPaymentMethods[0].name : "");
    
    // Reset installment fields
    setTotalAmount("");
    setTotalInstallments("");
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setBillingDay("");
    
    // Reset variable expense fields
    setEstimatedAmount("");
    setVariableBillingDay("");
  };

  const validateCommonFields = () => {
    if (!description.trim()) {
      toast.error("Por favor ingresa una descripción");
      return false;
    }
    
    if (!selectedPaymentMethodId) {
      toast.error("Por favor selecciona un medio de pago");
      return false;
    }
    
    return true;
  };

  const validateInstallmentFields = () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return false;
    }
    
    if (!totalInstallments || parseInt(totalInstallments) <= 0) {
      toast.error("Por favor ingresa un número válido de cuotas");
      return false;
    }
    
    // Validate year range (2023-2027)
    if (selectedYear < 2023 || selectedYear > 2027) {
      toast.error("El año debe estar entre 2023 y 2027");
      return false;
    }
    
    if (!billingDay || parseInt(billingDay) < 1 || parseInt(billingDay) > 31) {
      toast.error("Por favor ingresa un día de vencimiento válido (1-31)");
      return false;
    }
    
    return true;
  };

  const validateVariableExpenseFields = () => {
    if (!estimatedAmount || parseFloat(estimatedAmount) <= 0) {
      toast.error("Por favor ingresa un monto estimado válido");
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateCommonFields()) return;

    setIsLoading(true);
    
    try {
      if (selectedType === 'installment') {
        if (!validateInstallmentFields()) {
          setIsLoading(false);
          return;
        }
        
        // Create start date from selected month/year and billing day
        const startDate = new Date(selectedYear, selectedMonth, parseInt(billingDay));
        
        const formData: CreateInstallmentForm = {
          description: description.trim(),
          total_amount: parseFloat(totalAmount),
          total_installments: parseInt(totalInstallments),
          start_date: format(startDate, 'yyyy-MM-dd'),
          payment_method_id: selectedPaymentMethodId,
        };

        await addInstallment(formData);
        toast.success(`Cuota creada: ${description} (${totalInstallments} cuotas de ${formatCurrency(installmentAmount)})`);
        
      } else if (selectedType === 'variable_expense') {
        if (!validateVariableExpenseFields()) {
          setIsLoading(false);
          return;
        }
        
        const formData: CreateVariableExpenseForm = {
          description: description.trim(),
          estimated_amount: parseFloat(estimatedAmount),
          billing_day: variableBillingDay ? parseInt(variableBillingDay) : undefined,
          payment_method_id: selectedPaymentMethodId,
        };

        await addVariableExpense(formData);
        toast.success(`Gasto fijo creado: ${description} (${formatCurrency(parseFloat(estimatedAmount))} estimado)`);
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving gasto:', error);
      toast.error("Error al guardar el gasto");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-700">Nuevo Gasto</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          
          {/* Type Selection - V1 Style (correction #6) */}
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Tipo de Gasto</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GASTO_TYPES.map(({ type, label, icon: Icon, description, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                    selectedType === type
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <Icon className={`h-6 w-6 mt-0.5 mr-3 ${color}`} />
                    <div>
                      <div className="font-semibold text-base">{label}</div>
                      <div className="text-sm text-gray-500 mt-1">{description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción
              </Label>
              <Input
                id="description"
                placeholder={
                  selectedType === 'installment' ? "iPhone 14 Pro, MacBook Air, Auto Honda Civic, etc." :
                  "Luz y Gas, Internet, Alquiler, Netflix, Seguro Auto, etc."
                }
                className="mt-1"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium">
                Medio de Pago
              </Label>
              <div className="flex items-center mt-1">
                <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
                <Select value={selectedPaymentMethodId} onValueChange={setSelectedPaymentMethodId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      calculatedPaymentMethods.length === 0 
                        ? "Cargando métodos de pago..." 
                        : "Seleccionar método de pago"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {calculatedPaymentMethods.map((method) => (
                      <SelectItem key={method.name} value={method.name}>
                        <div className="flex items-center">
                          <span className={`mr-2 font-medium ${method.color || 'text-gray-600'}`}>
                            {method.name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {calculatedPaymentMethods.length === 0 && (
                      <SelectItem value="no-methods" disabled>
                        <div className="flex items-center opacity-50">
                          <span className="text-gray-500">
                            {status === "loading" ? "Cargando..." : "No hay métodos de pago disponibles"}
                          </span>
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Type-specific fields */}
          {selectedType === 'installment' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg text-blue-700 flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Configuración de Cuotas
              </h3>
              
              {/* Total Amount */}
              <div>
                <Label htmlFor="totalAmount" className="text-sm font-medium">
                  Monto Total
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="120000"
                  className="mt-1"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>

              {/* Number of Installments with prefill options (correction #7.1) */}
              <div>
                <Label htmlFor="installments" className="text-sm font-medium">
                  Número de Cuotas
                </Label>
                <div className="space-y-2 mt-1">
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    max="60"
                    placeholder="12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                  />
                  
                  {/* Quick selection buttons (correction #7.1) */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600 mr-2">Opciones rápidas:</span>
                    {COMMON_INSTALLMENTS.map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setTotalInstallments(num.toString())}
                      >
                        {num}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated installment amount preview */}
              {installmentAmount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <Calculator className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm text-blue-800">
                      <strong>Cuota mensual:</strong> {formatCurrency(installmentAmount)}
                    </span>
                    <span className="text-xs text-blue-600 ml-2">
                      x {totalInstallments} cuotas = {formatCurrency(parseFloat(totalAmount) || 0)}
                    </span>
                  </div>
                </div>
              )}

              {/* First Payment Date with better explanation (correction #7.2) */}
              <div>
                <Label className="text-sm font-medium">
                  Fecha de Primera Cuota
                </Label>
                <p className="text-xs text-gray-600 mb-2">
                  Selecciona el mes y año cuando debes pagar la primera cuota
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                      ].map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => 2023 + i).map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Billing Day */}
              <div>
                <Label htmlFor="billingDay" className="text-sm font-medium">
                  Día de Vencimiento
                </Label>
                <p className="text-xs text-gray-600 mb-2">
                  Día del mes cuando vence cada cuota (1-31)
                </p>
                <div className="space-y-2">
                  <Input
                    id="billingDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={billingDay}
                    onChange={(e) => setBillingDay(e.target.value)}
                  />
                  
                  {/* Quick selection buttons */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600 mr-2">Días comunes:</span>
                    {COMMON_BILLING_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setBillingDay(day.toString())}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedType === 'variable_expense' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-lg text-orange-700 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Configuración de Gasto Fijo
              </h3>
              
              {/* Estimated Amount */}
              <div>
                <Label htmlFor="estimatedAmount" className="text-sm font-medium">
                  Monto Estimado Mensual
                </Label>
                <p className="text-xs text-gray-600 mb-2">
                  Monto aproximado que esperas pagar cada mes
                </p>
                <Input
                  id="estimatedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15000"
                  className="mt-1"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                />
              </div>

              {/* Billing Day (Optional) - (correction #7.3) */}
              <div>
                <Label htmlFor="variableBillingDay" className="text-sm font-medium">
                  Día de Vencimiento (Opcional)
                </Label>
                <p className="text-xs text-gray-600 mb-2">
                  Si conoces el día específico de vencimiento, puedes ingresarlo
                </p>
                <div className="space-y-2">
                  <Input
                    id="variableBillingDay"
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15 (opcional)"
                    value={variableBillingDay}
                    onChange={(e) => setVariableBillingDay(e.target.value)}
                  />
                  
                  {/* Quick selection buttons */}
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-600 mr-2">Días comunes:</span>
                    {COMMON_BILLING_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => setVariableBillingDay(day.toString())}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Note about category and URL (correction #7.3) */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  <strong>Nota:</strong> En esta versión hemos simplificado el proceso. 
                  La categorización automática y carga de archivos se habilitarán en futuras actualizaciones.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)} 
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSave} 
            disabled={isLoading || !description || !selectedPaymentMethodId}
            className="w-full sm:w-auto"
          >
            {isLoading ? "Guardando..." : `Crear ${GASTO_TYPES.find(t => t.type === selectedType)?.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}