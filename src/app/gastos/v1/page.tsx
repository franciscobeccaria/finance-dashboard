"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Filter, RotateCcw, Calendar, CreditCard, Tag, DollarSign } from "lucide-react";

import { useGastoStore } from "@/stores/gastoStore";
import { useBudgetStore } from "@/stores/budgetStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";
import { GastoType, UnifiedMonthlyExpense } from "@/types/gastos";
import { getAllUnifiedExpenses, getUnifiedSummary, UnifiedExpenseSummary } from "@/lib/unifiedExpenseUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GastosTable } from "@/components/GastosTable";
import { AddGastoDialog } from "@/components/AddGastoDialog";
import { LoginButton } from "@/components/LoginButton";
import { DateSelector } from "@/components/DateSelector";

// Type badges for filtering (sistema actualizado)
const TYPE_BADGES = [
  { type: 'installment' as const, label: 'Cuotas', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { type: 'variable_expense' as const, label: 'Fijos', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { type: 'budget' as const, label: 'Presupuestos', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
];

// Summary stats component
function GastosSummary({ summary }: { summary: UnifiedExpenseSummary }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Gastos + Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.active_expenses + summary.total_budgets}</div>
          <p className="text-xs text-gray-500">
            {summary.total_installments} cuotas, {summary.total_variable_expenses || 0} variables, {summary.total_budgets} presupuestos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Total Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.total_monthly_expenses.toLocaleString()}</div>
          <p className="text-xs text-gray-500">gastos + presupuestos por mes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Presupuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.monthly_budgets.toLocaleString()}</div>
          <p className="text-xs text-gray-500">
            {summary.budget_utilization_percentage.toFixed(0)}% utilizado (${summary.total_budget_spent.toLocaleString()})
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Gastos Fijos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${summary.monthly_variable_expenses.toLocaleString()}</div>
          <p className="text-xs text-gray-500">servicios fijos, seguros, suscripciones</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Type filter component
function TypeFilter({ 
  selectedTypes, 
  onToggleType, 
  onClearTypes 
}: { 
  selectedTypes: string[], 
  onToggleType: (type: string) => void, 
  onClearTypes: () => void 
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 flex items-center gap-1">
        <Tag className="h-3 w-3" />
        Tipos:
      </span>
      
      {TYPE_BADGES.map(({ type, label, color }) => (
        <button
          key={type}
          onClick={() => onToggleType(type)}
          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border transition-all
            ${selectedTypes.includes(type) 
              ? color 
              : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'}`}
        >
          {label}
        </button>
      ))}
      
      {selectedTypes.length > 0 && (
        <button
          onClick={onClearTypes}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Limpiar
        </button>
      )}
    </div>
  );
}

// Main page component
export default function GastosPage() {
  const { data: session, status } = useSession();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  const {
    loadGastos,
    refreshData,
    getAllGastos,
    isLoading,
    error,
    clearError
  } = useGastoStore();

  const { budgets, setBudgets } = useBudgetStore();
  const { calculatedPaymentMethods, setPaymentMethods, setTransactions } = usePaymentMethodStore();

  const allGastos = getAllGastos();
  const allUnifiedExpenses = getAllUnifiedExpenses(allGastos, budgets);
  const unifiedSummary = getUnifiedSummary(allGastos, budgets, selectedDate);
  
  // Filter unified expenses by type
  const filteredExpenses = selectedTypes.length > 0 
    ? allUnifiedExpenses.filter(expense => selectedTypes.includes(expense.type))
    : allUnifiedExpenses;

  // Sync data from home API when authenticated
  useEffect(() => {
    const syncDataFromHome = async () => {
      if (status === "authenticated" && session?.accessToken) {
        try {
          // Import functions from services
          const { fetchBudgets, fetchPaymentMethods, fetchAllTransactions } = await import('@/services/api');
          
          // Load data in parallel
          const [budgetsFromAPI, paymentMethodsFromAPI, transactionsFromAPI] = await Promise.all([
            fetchBudgets(session.accessToken),
            fetchPaymentMethods(session.accessToken),
            fetchAllTransactions(session.accessToken)
          ]);
          
          // Filter out special budgets (like "Movimientos")
          const regularBudgets = budgetsFromAPI.filter(b => !b.isSpecial);
          
          setBudgets(regularBudgets);
          setPaymentMethods(paymentMethodsFromAPI);
          setTransactions(transactionsFromAPI);
        } catch (error) {
          console.error('Error syncing data from home:', error);
          // Don't show error to user, just keep existing data
        }
      }
    };
    
    syncDataFromHome();
  }, [status, session?.accessToken, setBudgets, setPaymentMethods, setTransactions]);

  const handleToggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleClearTypes = () => {
    setSelectedTypes([]);
  };

  // Show loading screen while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-transparent border-blue-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Presus.</h1>
          <p className="text-gray-600 mb-8">
            Necesitas iniciar sesión para ver tus gastos.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-800">Gastos</h1>
            <p className="text-gray-600 mt-1">
              Vista unificada: Cuotas, Gastos Fijos y Presupuestos
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isLoading}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            
            <Button
              onClick={() => setAddDialogOpen(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Gasto
            </Button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{error}</p>
              <Button variant="ghost" size="sm" onClick={clearError}>
                ×
              </Button>
            </div>
          </div>
        )}


        {/* Summary Cards */}
        <GastosSummary summary={unifiedSummary} />

        {/* Monthly expenses for selected date */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-blue-800">
                  Total mensual - {selectedDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm text-blue-700">
                  ${unifiedSummary.total_monthly_expenses.toLocaleString()} - Gastos + Presupuestos
                </p>
              </div>
            </div>
            
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TypeFilter 
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            onClearTypes={handleClearTypes}
          />
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {filteredExpenses.length} elemento{filteredExpenses.length !== 1 ? 's' : ''} 
              {filteredExpenses.length !== allUnifiedExpenses.length ? ' filtrado' + (filteredExpenses.length !== 1 ? 's' : '') : ''}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-700">
                Gastos y Presupuestos ({filteredExpenses.length})
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {TYPE_BADGES.map(({ type, label, color }) => (
                  <div key={type} className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${color}`}>
                    {filteredExpenses.filter(e => e.type === type).length} {label}
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-6 w-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Cargando datos...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <DollarSign className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">No hay elementos para mostrar</p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Gasto
                </Button>
              </div>
            ) : (
              <GastosTable gastos={filteredExpenses} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddGastoDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}