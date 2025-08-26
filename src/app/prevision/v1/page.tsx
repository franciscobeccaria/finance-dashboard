"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  Calendar, 
  TrendingUp, 
  BarChart3, 
  Eye, 
  ArrowLeft, 
  ArrowRight,
  Filter,
  DollarSign,
  Target
} from "lucide-react";

import { useGastoStore } from "@/stores/gastoStore";
import { useBudgetStore } from "@/stores/budgetStore";
import { usePaymentMethodStore } from "@/stores/paymentMethodStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForecastTable } from "@/components/ForecastTable";
import { LoginButton } from "@/components/LoginButton";
import { 
  generateForecastPeriod, 
  getYearlyProjections,
  ForecastPeriod 
} from "@/lib/forecastUtils";
import { formatCurrency } from "@/lib/utils";
import { addMonths, format } from "date-fns";

// Summary stats component for forecast
function ForecastSummary({ 
  forecastPeriod, 
  selectedMonths 
}: { 
  forecastPeriod: ForecastPeriod;
  selectedMonths: number;
}) {
  const visibleForecasts = forecastPeriod.monthly_forecasts.slice(0, selectedMonths);
  const yearlyProjections = getYearlyProjections(visibleForecasts);
  const years = Object.keys(yearlyProjections).sort();
  
  const totalInPeriod = visibleForecasts.reduce((sum, f) => sum + f.totals.total_mensual, 0);
  const averageMonthly = Math.round(totalInPeriod / selectedMonths);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Período Seleccionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{selectedMonths} meses</div>
          <p className="text-xs text-gray-500">
            {visibleForecasts[0]?.displayMonth} - {visibleForecasts[selectedMonths - 1]?.displayMonth}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Promedio Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(averageMonthly)}</div>
          <p className="text-xs text-gray-500">proyección basada en tendencias</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Total Proyectado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalInPeriod)}</div>
          <p className="text-xs text-gray-500">
            gastos + presupuestos en {selectedMonths} meses
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">Gastos Únicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{forecastPeriod.summary.total_expenses_count}</div>
          <p className="text-xs text-gray-500">
            cuotas + gastos fijos activos
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Year selector component
function YearSelector({ 
  selectedMonths, 
  onMonthsChange, 
  startDate,
  onStartDateChange
}: {
  selectedMonths: number;
  onMonthsChange: (months: number) => void;
  startDate: Date;
  onStartDateChange: (date: Date) => void;
}) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  const monthOptions = [
    { value: 6, label: "6 meses" },
    { value: 12, label: "12 meses" },
    { value: 18, label: "18 meses" },
    { value: 24, label: "24 meses" }
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">Proyección:</span>
      </div>
      
      <div className="flex gap-2">
        {monthOptions.map(option => (
          <Button
            key={option.value}
            variant={selectedMonths === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onMonthsChange(option.value)}
            className="text-xs"
          >
            {option.label}
          </Button>
        ))}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStartDateChange(addMonths(startDate, -1))}
          className="p-2"
        >
          <ArrowLeft className="h-3 w-3" />
        </Button>
        
        <span className="text-sm font-medium min-w-[100px] text-center">
          {format(startDate, 'MMM yyyy')}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStartDateChange(addMonths(startDate, 1))}
          className="p-2"
        >
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// Main page component
export default function PrevisionPage() {
  const { data: session, status } = useSession();
  
  const [selectedMonths, setSelectedMonths] = useState<number>(12);
  const [startDate, setStartDate] = useState<Date>(new Date());
  
  const { getAllGastos, isLoading, error } = useGastoStore();
  const { budgets, setBudgets } = useBudgetStore();
  const { setPaymentMethods, setTransactions } = usePaymentMethodStore();

  const allGastos = getAllGastos();
  
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
  
  // Generate forecast period
  const forecastPeriod = useMemo(() => {
    return generateForecastPeriod(allGastos, budgets, startDate, 24); // Generate 24 months, display selectedMonths
  }, [allGastos, budgets, startDate]);

  // Show loading screen while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-transparent border-purple-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando previsión...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-4">Presus.</h1>
          <p className="text-gray-600 mb-8">
            Necesitas iniciar sesión para ver la previsión de gastos.
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
            <h1 className="text-3xl font-bold text-purple-800">Previsión</h1>
            <p className="text-gray-600 mt-1">
              Proyección de gastos futuros mes a mes
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Gastos
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <ForecastSummary 
          forecastPeriod={forecastPeriod} 
          selectedMonths={selectedMonths}
        />

        {/* Period Controls */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-800">
                  Vista de Proyección Financiera
                </p>
                <p className="text-sm text-purple-700">
                  Cuotas, gastos fijos y presupuestos proyectados
                </p>
              </div>
            </div>
            
            <YearSelector
              selectedMonths={selectedMonths}
              onMonthsChange={setSelectedMonths}
              startDate={startDate}
              onStartDateChange={setStartDate}
            />
          </div>
        </div>

        {/* Highest/Lowest Month indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Mes de Mayor Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-800">
                {forecastPeriod.summary.highest_month.month}
              </div>
              <p className="text-sm text-green-600">
                {formatCurrency(forecastPeriod.summary.highest_month.amount)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Mes de Menor Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-blue-800">
                {forecastPeriod.summary.lowest_month.month}
              </div>
              <p className="text-sm text-blue-600">
                {formatCurrency(forecastPeriod.summary.lowest_month.amount)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Forecast Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-purple-700">
                Previsión de Gastos ({selectedMonths} meses)
              </CardTitle>
              
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                Mostrando {selectedMonths} de {forecastPeriod.total_months} meses disponibles
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="h-6 w-6 border-2 border-t-transparent border-purple-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Calculando proyecciones...</p>
              </div>
            ) : forecastPeriod.monthly_forecasts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <BarChart3 className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-4">No hay datos suficientes para generar proyecciones</p>
                <p className="text-sm text-gray-500">
                  Agrega algunos gastos en la página principal para ver las proyecciones futuras.
                </p>
              </div>
            ) : (
              <ForecastTable 
                forecasts={forecastPeriod.monthly_forecasts}
                maxMonthsVisible={selectedMonths}
              />
            )}
          </CardContent>
        </Card>

        {/* Yearly Summary (if spanning multiple years) */}
        {selectedMonths >= 12 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg text-purple-700">Resumen Anual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(getYearlyProjections(
                  forecastPeriod.monthly_forecasts.slice(0, selectedMonths)
                )).map(([year, data]) => (
                  <div key={year} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-purple-800">{year}</h3>
                      <span className="text-sm text-gray-500">
                        {data.months_included} meses
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total proyectado:</span>
                        <span className="font-semibold">{formatCurrency(data.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Promedio mensual:</span>
                        <span className="font-semibold">{formatCurrency(data.average_monthly)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}