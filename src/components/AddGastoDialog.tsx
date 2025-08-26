import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, CreditCard, Calculator, Building, Zap, ShoppingBag, TrendingUp } from "lucide-react";
import { format, addMonths } from "date-fns";
import { toast } from "sonner";

import { 
  GastoType,
  CreateInstallmentForm,
  CreateVariableExpenseForm,
  EXPENSE_CATEGORIES
} from "@/types/gastos";
import { useGastoStore } from "@/stores/gastoStore";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/utils";

interface AddGastoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Type selection options with icons (sistema actualizado)
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

// Common installment options
const COMMON_INSTALLMENTS = [3, 6, 12, 18, 24];

// Common billing days
const COMMON_BILLING_DAYS = [1, 5, 10, 15, 20, 25, 30];

export function AddGastoDialog({
  open,
  onOpenChange,
}: AddGastoDialogProps) {
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

  const { addInstallment, addVariableExpense } = useGastoStore();
  const { 
    calculatedPaymentMethods, 
    setPaymentMethods, 
    setTransactions, 
    setLoading, 
    setError 
  } = usePaymentMethodStore();
  const { data: session, status } = useSession();

  // Payment data is now loaded by the parent pages (gastos/prevision)
  // This component just uses the calculated payment methods from the store

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
        toast.success(`Gasto variable creado: ${description} (${formatCurrency(parseFloat(estimatedAmount))} estimado)`);
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
          
          {/* Type Selection */}
          <div className="grid gap-2">
            <label className="text-sm font-medium">Tipo de Gasto</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GASTO_TYPES.map(({ type, label, icon: Icon, description, color }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`p-3 text-left border rounded-lg transition-all hover:shadow-md ${
                    selectedType === type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <Icon className={`h-5 w-5 mt-0.5 mr-2 ${color}`} />
                    <div>
                      <div className="font-medium text-sm">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="description" className="text-left sm:text-right text-sm font-medium">
              Descripción
            </label>
            <Input
              id="description"
              placeholder={
                selectedType === 'installment' ? "iPhone 14 Pro, MacBook Air, etc." :
                "Luz, Gas, Internet, Alquiler, Netflix, etc."
              }
              className="sm:col-span-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Type-specific fields */}
          {selectedType === 'installment' && (
            <>
              {/* Total Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="totalAmount" className="text-left sm:text-right text-sm font-medium">
                  Monto Total
                </label>
                <Input
                  id="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="120000"
                  className="sm:col-span-3"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>

              {/* Number of Installments */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="installments" className="text-left sm:text-right text-sm font-medium">
                  Cuotas
                </label>
                <div className="sm:col-span-3 space-y-2">
                  <Input
                    id="installments"
                    type="number"
                    min="1"
                    max="60"
                    placeholder="12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                  />
                  
                  {/* Quick selection buttons */}
                  <div className="flex flex-wrap gap-1">
                    {COMMON_INSTALLMENTS.map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
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
                <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                  <div className="text-left sm:text-right text-sm text-gray-600">
                    Cuota mensual
                  </div>
                  <div className="sm:col-span-3 flex items-center">
                    <Calculator className="h-4 w-4 text-green-600 mr-2" />
                    <span className="font-medium text-green-600">
                      {formatCurrency(installmentAmount)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      x {totalInstallments} cuotas
                    </span>
                  </div>
                </div>
              )}

              {/* First Payment Month */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label className="text-left sm:text-right text-sm font-medium">
                  Primer mes de pago
                </label>
                <div className="sm:col-span-3 flex gap-2">
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="billingDay" className="text-left sm:text-right text-sm font-medium">
                  Día de Vencimiento
                </label>
                <div className="sm:col-span-3 space-y-2">
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
                    {COMMON_BILLING_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setBillingDay(day.toString())}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedType === 'fixed_expense' && (
            <>
              {/* Monthly Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="monthlyAmount" className="text-left sm:text-right text-sm font-medium">
                  Monto Mensual
                </label>
                <Input
                  id="monthlyAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="45000"
                  className="sm:col-span-3"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(e.target.value)}
                />
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="fixedCategory" className="text-left sm:text-right text-sm font-medium">
                  Categoría
                </label>
                <div className="sm:col-span-3">
                  <Select value={fixedCategory} onValueChange={setFixedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.fixed.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="notes" className="text-left sm:text-right text-sm font-medium">
                  Notas
                </label>
                <Input
                  id="notes"
                  placeholder="Incluye expensas, etc."
                  className="sm:col-span-3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={200}
                />
              </div>
            </>
          )}

          {selectedType === 'automatic_debit' && (
            <>
              {/* Expected Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="expectedAmount" className="text-left sm:text-right text-sm font-medium">
                  Monto Esperado
                </label>
                <Input
                  id="expectedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="2199"
                  className="sm:col-span-3"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                />
              </div>

              {/* Billing Day */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="billingDay" className="text-left sm:text-right text-sm font-medium">
                  Día de Facturación
                </label>
                <div className="sm:col-span-3 space-y-2">
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
                    {COMMON_BILLING_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setBillingDay(day.toString())}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="automaticCategory" className="text-left sm:text-right text-sm font-medium">
                  Categoría
                </label>
                <div className="sm:col-span-3">
                  <Select value={automaticCategory} onValueChange={setAutomaticCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.automatic.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Service URL */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="serviceUrl" className="text-left sm:text-right text-sm font-medium">
                  URL del Servicio
                </label>
                <Input
                  id="serviceUrl"
                  type="url"
                  placeholder="https://netflix.com"
                  className="sm:col-span-3"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {selectedType === 'variable_expense' && (
            <>
              {/* Estimated Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="estimatedAmount" className="text-left sm:text-right text-sm font-medium">
                  Monto Estimado
                </label>
                <Input
                  id="estimatedAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="15000"
                  className="sm:col-span-3"
                  value={estimatedAmount}
                  onChange={(e) => setEstimatedAmount(e.target.value)}
                />
              </div>

              {/* Billing Day (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
                <label htmlFor="variableBillingDay" className="text-left sm:text-right text-sm font-medium">
                  Día de Vencimiento
                </label>
                <div className="sm:col-span-3 space-y-2">
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
                    {COMMON_BILLING_DAYS.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setVariableBillingDay(day.toString())}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Payment Method - Common to all types */}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <label htmlFor="paymentMethod" className="text-left sm:text-right text-sm font-medium">
              Medio de Pago
            </label>
            <div className="sm:col-span-3">
              <div className="flex items-center">
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