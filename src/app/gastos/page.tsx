"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, RotateCcw, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { useMonthlyInstanceStore } from "@/stores/monthlyInstanceStore";
import { useBudgetStore } from "@/stores/budgetStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";
import { useGastoStore } from "@/stores/gastoStore"; // Para migración
import { MonthlyExpenseInstance } from "@/types/gastos";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GastosV3Table } from "@/components/GastosV3Table";
import { AddExpenseV3Dialog } from "@/components/AddExpenseV3Dialog";
import { LoginButton } from "@/components/LoginButton";
import { DateSelector } from "@/components/DateSelector";

// Summary stats component for monthly expenses (excluding budgets from progress)
function MonthlyExpensesSummary({ 
  instances, 
  selectedMonth 
}: { 
  instances: MonthlyExpenseInstance[];
  selectedMonth: string;
}) {
  // Filter instances for selected month
  const monthInstances = instances.filter(instance => instance.month === selectedMonth);
  
  // Separate by type for better organization
  const installmentInstances = monthInstances.filter(instance => instance.parent_expense_type === 'installment');
  const variableInstances = monthInstances.filter(instance => instance.parent_expense_type === 'variable_expense');
  const budgetInstances = monthInstances.filter(instance => instance.parent_expense_type === 'budget');
  
  // Calculate totals
  const totalBudgeted = monthInstances.reduce((sum, instance) => sum + instance.amount_budgeted, 0);
  const totalPaid = monthInstances.reduce((sum, instance) => sum + (instance.amount_paid || 0), 0);
  
  // Progress calculation excluding budgets (as requested)
  const expenseInstances = [...installmentInstances, ...variableInstances];
  const paidExpensesCount = expenseInstances.filter(instance => instance.amount_paid !== null).length;
  const totalExpensesCount = expenseInstances.length;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Gastos del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthInstances.length}</div>
          <p className="text-xs text-gray-500">
            {installmentInstances.length} cuotas, {variableInstances.length} gastos fijos, {budgetInstances.length} presupuestos
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Total Presupuestado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalBudgeted.toLocaleString()}</div>
          <p className="text-xs text-gray-500">estimado para el mes</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Total Pagado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalPaid.toLocaleString()}</div>
          <p className="text-xs text-gray-500">
            {monthInstances.filter(i => i.amount_paid !== null).length} de {monthInstances.length} pagadas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">Progreso de Gastos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalExpensesCount > 0 ? Math.round((paidExpensesCount / totalExpensesCount) * 100) : 0}%
          </div>
          <p className="text-xs text-gray-500">
            {paidExpensesCount} de {totalExpensesCount} gastos pagados
          </p>
          <p className="text-xs text-gray-400 mt-1">
            (excluyendo presupuestos)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Migration banner component (reused from v2)
function MigrationBanner({ onMigrate, isLoading }: { onMigrate: () => void; isLoading: boolean }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-800">Actualización a Sistema v3</h3>
            <p className="text-sm text-amber-700 mt-1">
              Gastos v3 ofrece mejor organización por secciones, drag & drop, y terminología más clara.
              Tus datos existentes serán migrados automáticamente.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              El historial de pagos se mantiene intacto.
            </p>
          </div>
        </div>
        <Button
          onClick={onMigrate}
          disabled={isLoading}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {isLoading ? 'Migrando...' : 'Actualizar a v3'}
        </Button>
      </div>
    </div>
  );
}

// Main page component
export default function GastosPageV3() {
  const { data: session, status } = useSession();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showMigration, setShowMigration] = useState(true);
  
  // New monthly instance store
  const {
    baseExpenses,
    monthlyInstances,
    generateInstancesForPeriod,
    generateBudgetInstancesForPeriod,
    migrateFromLegacyStore,
    isLoading: instancesLoading,
    error: instancesError,
    clearError: clearInstancesError
  } = useMonthlyInstanceStore();

  // Legacy store for migration
  const { getAllGastos, gastos: legacyGastosState } = useGastoStore();

  // Other stores
  const { budgets, setBudgets } = useBudgetStore();
  const { calculatedPaymentMethods, setPaymentMethods, setTransactions } = usePaymentMethodStore();

  const selectedMonth = format(selectedDate, 'yyyy-MM');

  // Generate instances for selected month and surrounding months
  useEffect(() => {
    if (baseExpenses.length > 0 || budgets.length > 0) {
      const currentMonth = format(selectedDate, 'yyyy-MM');
      const prevMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1), 'yyyy-MM');
      const nextMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1), 'yyyy-MM');
      
      generateInstancesForPeriod(prevMonth, nextMonth);
      
      // Also generate budget instances
      if (budgets.length > 0) {
        generateBudgetInstancesForPeriod(prevMonth, nextMonth, budgets);
      }
    }
  }, [selectedDate, baseExpenses.length, budgets.length, generateInstancesForPeriod, generateBudgetInstancesForPeriod, budgets]);

  // Sync data from home API when authenticated
  useEffect(() => {
    const syncDataFromHome = async () => {
      if (status === "authenticated" && session?.accessToken) {
        try {
          const { fetchBudgets, fetchPaymentMethods, fetchAllTransactions } = await import('@/services/api');
          
          const [budgetsFromAPI, paymentMethodsFromAPI, transactionsFromAPI] = await Promise.all([
            fetchBudgets(session.accessToken),
            fetchPaymentMethods(session.accessToken),
            fetchAllTransactions(session.accessToken)
          ]);
          
          const regularBudgets = budgetsFromAPI.filter(b => !b.isSpecial);
          
          setBudgets(regularBudgets);
          setPaymentMethods(paymentMethodsFromAPI);
          setTransactions(transactionsFromAPI);
        } catch (error) {
          console.error('Error syncing data from home:', error);
        }
      }
    };
    
    syncDataFromHome();
  }, [status, session?.accessToken, setBudgets, setPaymentMethods, setTransactions]);

  // Migration handler
  const handleMigration = async () => {
    try {
      let legacyGastos = getAllGastos();
      
      console.log('🔄 Using existing legacy gastos:', legacyGastos.length, 'gastos');
      
      await migrateFromLegacyStore(legacyGastos);
      setShowMigration(false);
    } catch (error) {
      console.error('Migration error:', error);
      alert('Error durante la migración. Por favor contacta soporte.');
    }
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
            <h1 className="text-3xl font-bold text-blue-800">Gastos V3</h1>
            <p className="text-gray-600 mt-1">
              Gestión organizada por secciones con drag & drop
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateInstancesForPeriod(selectedMonth, selectedMonth)}
              disabled={instancesLoading}
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

        {/* Migration Banner */}
        {showMigration && getAllGastos().length > 0 && baseExpenses.length === 0 && (
          <MigrationBanner onMigrate={handleMigration} isLoading={instancesLoading} />
        )}

        {/* Error message */}
        {instancesError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-red-700">{instancesError}</p>
              <Button variant="ghost" size="sm" onClick={clearInstancesError}>
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <MonthlyExpensesSummary 
          instances={monthlyInstances}
          selectedMonth={selectedMonth}
        />

        {/* Selected month info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="font-medium text-blue-800">
                  {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </p>
                <p className="text-sm text-blue-700">
                  Vista organizada por secciones
                </p>
              </div>
            </div>
            
            <DateSelector
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              isLoading={instancesLoading}
            />
          </div>
        </div>

        {/* Main Content - Table with sections */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-700">
                Gastos Mensuales ({monthlyInstances.filter(i => i.month === selectedMonth).length})
              </CardTitle>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Organizado por secciones con drag & drop
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {instancesLoading ? (
              <div className="text-center py-8">
                <div className="h-6 w-6 border-2 border-t-transparent border-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Cargando gastos...</p>
              </div>
            ) : monthlyInstances.filter(i => i.month === selectedMonth).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Calendar className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">
                  No hay gastos para {format(selectedDate, 'MMMM yyyy', { locale: es })}
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Gasto
                </Button>
              </div>
            ) : (
              <GastosV3Table 
                instances={monthlyInstances}
                selectedMonth={selectedMonth}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddExpenseV3Dialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}