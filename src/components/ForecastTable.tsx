import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Pause,
  Play
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { MonthlyForecast, ForecastExpense } from "@/lib/forecastUtils";
import { Budget } from "@/types/gastos";

interface ForecastTableProps {
  forecasts: MonthlyForecast[];
  maxMonthsVisible?: number;
}

// Component for individual forecast cell
function ForecastCell({ 
  expense, 
  amount 
}: { 
  expense?: ForecastExpense; 
  amount: number;
}) {
  if (!expense || amount === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const getCellStyle = () => {
    if (!expense.is_active_in_month) {
      return "text-gray-400 line-through";
    }
    
    switch (expense.type) {
      case 'installment':
        return expense.projection_notes?.includes('Última') 
          ? "text-green-600 font-semibold" 
          : "text-blue-600";
      case 'variable_expense':
        return expense.projection_notes?.includes('+') 
          ? "text-red-600" 
          : expense.projection_notes?.includes('-') 
          ? "text-green-600" 
          : "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="text-right">
      <div className={`font-medium ${getCellStyle()}`}>
        {formatCurrency(amount)}
      </div>
      {expense.projection_notes && (
        <div className="text-xs text-gray-500 mt-1">
          {expense.projection_notes}
        </div>
      )}
    </div>
  );
}

// Component for section headers
function SectionHeader({ title, colSpan }: { title: string; colSpan: number }) {
  return (
    <TableRow>
      <TableCell 
        colSpan={colSpan} 
        className="bg-gray-100 font-semibold text-gray-700 text-sm py-3 sticky left-0 z-10"
      >
        {title}
      </TableCell>
    </TableRow>
  );
}

// Component for totals row
function TotalsRow({ 
  forecasts, 
  label, 
  getValue 
}: { 
  forecasts: MonthlyForecast[];
  label: string;
  getValue: (forecast: MonthlyForecast) => number;
}) {
  const totalSum = forecasts.reduce((sum, f) => sum + getValue(f), 0);
  
  return (
    <TableRow className="bg-blue-50 border-t-2 border-blue-200">
      <TableCell className="font-bold text-blue-800 sticky left-0 bg-blue-50 z-10">
        {label}
      </TableCell>
      
      {forecasts.map((forecast) => (
        <TableCell key={forecast.month} className="text-right">
          <div className="font-bold text-blue-800">
            {formatCurrency(getValue(forecast))}
          </div>
        </TableCell>
      ))}
      
      <TableCell className="text-right bg-blue-100">
        <div className="font-bold text-blue-900">
          {formatCurrency(totalSum)}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function ForecastTable({ forecasts, maxMonthsVisible = 12 }: ForecastTableProps) {
  // Limit visible months
  const visibleForecasts = forecasts.slice(0, maxMonthsVisible);
  
  // Get all unique expenses across all months
  const allExpenses = new Map<string, { description: string; type: 'installment' | 'variable_expense'; category?: string }>();
  const allBudgets = new Map<string, Budget>();
  
  visibleForecasts.forEach(forecast => {
    forecast.gastos.forEach(expense => {
      if (!allExpenses.has(expense.id)) {
        allExpenses.set(expense.id, {
          description: expense.description,
          type: expense.type,
          category: expense.category
        });
      }
    });
    
    forecast.budgets.forEach(budget => {
      if (!allBudgets.has(budget.id)) {
        allBudgets.set(budget.id, budget);
      }
    });
  });
  
  // Separate expenses by type
  const installments = Array.from(allExpenses.entries()).filter(([_, exp]) => exp.type === 'installment');
  const variableExpenses = Array.from(allExpenses.entries()).filter(([_, exp]) => exp.type === 'variable_expense');
  const budgets = Array.from(allBudgets.entries());

  // Calculate column width for months
  const monthColumnWidth = Math.max(100, Math.min(120, 1200 / visibleForecasts.length));

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] sticky left-0 bg-white z-20 border-r">
              Descripción
            </TableHead>
            
            {visibleForecasts.map((forecast) => (
              <TableHead 
                key={forecast.month} 
                className="text-center text-xs font-medium"
                style={{ minWidth: monthColumnWidth }}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{forecast.displayMonth}</span>
                  <span className="text-gray-500 text-xs">
                    {forecast.date.getDate()}/{forecast.date.getMonth() + 1}
                  </span>
                </div>
              </TableHead>
            ))}
            
            <TableHead className="w-[100px] text-right bg-gray-50">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          {/* CUOTAS Section */}
          <SectionHeader title="CUOTAS" colSpan={visibleForecasts.length + 2} />
          
          {installments.map(([expenseId, expenseData]) => {
            const expenseTotal = visibleForecasts.reduce((sum, forecast) => {
              const expense = forecast.gastos.find(g => g.id === expenseId);
              return sum + (expense?.projected_amount || 0);
            }, 0);
            
            return (
              <TableRow key={expenseId}>
                <TableCell className="sticky left-0 bg-white z-10 border-r">
                  <div className="font-medium text-sm">{expenseData.description}</div>
                  <div className="text-xs text-gray-500">Cuota mensual</div>
                </TableCell>
                
                {visibleForecasts.map((forecast) => {
                  const expense = forecast.gastos.find(g => g.id === expenseId);
                  return (
                    <TableCell key={forecast.month} className="text-center">
                      <ForecastCell 
                        expense={expense} 
                        amount={expense?.projected_amount || 0} 
                      />
                    </TableCell>
                  );
                })}
                
                <TableCell className="text-right bg-gray-50">
                  <div className="font-semibold text-blue-600">
                    {formatCurrency(expenseTotal)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* GASTOS FIJOS Section */}
          <SectionHeader title="GASTOS FIJOS" colSpan={visibleForecasts.length + 2} />
          
          {variableExpenses.map(([expenseId, expenseData]) => {
            const expenseTotal = visibleForecasts.reduce((sum, forecast) => {
              const expense = forecast.gastos.find(g => g.id === expenseId);
              return sum + (expense?.projected_amount || 0);
            }, 0);
            
            return (
              <TableRow key={expenseId}>
                <TableCell className="sticky left-0 bg-white z-10 border-r">
                  <div className="font-medium text-sm">{expenseData.description}</div>
                  <div className="text-xs text-gray-500">{expenseData.category}</div>
                </TableCell>
                
                {visibleForecasts.map((forecast) => {
                  const expense = forecast.gastos.find(g => g.id === expenseId);
                  return (
                    <TableCell key={forecast.month} className="text-center">
                      <ForecastCell 
                        expense={expense} 
                        amount={expense?.projected_amount || 0} 
                      />
                    </TableCell>
                  );
                })}
                
                <TableCell className="text-right bg-gray-50">
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(expenseTotal)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* PRESUPUESTOS Section */}
          <SectionHeader title="PRESUPUESTOS" colSpan={visibleForecasts.length + 2} />
          
          {budgets.map(([budgetId, budgetData]) => {
            const budgetTotal = visibleForecasts.length * budgetData.total;
            
            return (
              <TableRow key={budgetId}>
                <TableCell className="sticky left-0 bg-white z-10 border-r">
                  <div className="font-medium text-sm">{budgetData.name}</div>
                  <div className="text-xs text-gray-500">
                    Presupuesto mensual • {((budgetData.spent / budgetData.total) * 100).toFixed(0)}% usado
                  </div>
                </TableCell>
                
                {visibleForecasts.map((forecast) => (
                  <TableCell key={forecast.month} className="text-center">
                    <div className="text-right">
                      <div className="font-medium text-yellow-600">
                        {formatCurrency(budgetData.total)}
                      </div>
                      <div className="text-xs text-gray-500">
                        fijo mensual
                      </div>
                    </div>
                  </TableCell>
                ))}
                
                <TableCell className="text-right bg-gray-50">
                  <div className="font-semibold text-yellow-600">
                    {formatCurrency(budgetTotal)}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          
          {/* TOTALS Row */}
          <TotalsRow
            forecasts={visibleForecasts}
            label="TOTAL MENSUAL"
            getValue={(forecast) => forecast.totals.total_mensual}
          />
        </TableBody>
      </Table>
      
      {/* Footer with period summary */}
      <div className="border-t bg-gray-50 px-4 py-3 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Período:</span> {visibleForecasts.length} meses
            <div className="text-xs text-gray-500">
              {visibleForecasts[0]?.displayMonth} - {visibleForecasts[visibleForecasts.length - 1]?.displayMonth}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Cuotas:</span> {installments.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleForecasts.reduce((sum, f) => sum + f.totals.cuotas, 0)
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Gastos Fijos:</span> {variableExpenses.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleForecasts.reduce((sum, f) => sum + f.totals.gastos_variables, 0)
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Presupuestos:</span> {budgets.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleForecasts.reduce((sum, f) => sum + f.totals.presupuestos, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}