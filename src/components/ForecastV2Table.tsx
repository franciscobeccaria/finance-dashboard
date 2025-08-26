import React from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  DollarSign
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
import { ForecastPeriodV2, ParentExpenseRow } from "@/lib/forecastV2Utils";

interface ForecastV2TableProps {
  forecastPeriod: ForecastPeriodV2;
  maxMonthsVisible?: number;
}

// Component for individual forecast cell
function ForecastCell({ 
  amount, 
  sequenceNumber,
  notes 
}: { 
  amount: number;
  sequenceNumber?: number;
  notes?: string;
}) {
  if (amount === 0) {
    return <span className="text-gray-400">—</span>;
  }

  return (
    <div className="text-right">
      <div className="font-medium text-gray-900">
        {formatCurrency(amount)}
      </div>
      {(sequenceNumber || notes) && (
        <div className="text-xs text-gray-500 mt-1">
          {notes || `Cuota ${sequenceNumber}`}
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
  forecastPeriod, 
  visibleMonths,
  label, 
  getValue 
}: { 
  forecastPeriod: ForecastPeriodV2;
  visibleMonths: string[];
  label: string;
  getValue: (monthlyTotal: any) => number;
}) {
  const totalSum = visibleMonths.reduce((sum, month) => {
    return sum + getValue(forecastPeriod.monthly_totals[month]);
  }, 0);
  
  return (
    <TableRow className="bg-blue-50 border-t-2 border-blue-200">
      <TableCell className="font-bold text-blue-800 sticky left-0 bg-blue-50 z-10">
        {label}
      </TableCell>
      
      {visibleMonths.map((month) => (
        <TableCell key={month} className="text-right">
          <div className="font-bold text-blue-800">
            {formatCurrency(getValue(forecastPeriod.monthly_totals[month]))}
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

export function ForecastV2Table({ forecastPeriod, maxMonthsVisible = 12 }: ForecastV2TableProps) {
  // Limit visible months
  const visibleMonths = forecastPeriod.months.slice(0, maxMonthsVisible);
  const visibleDisplayMonths = forecastPeriod.display_months.slice(0, maxMonthsVisible);
  
  // Get parent expense rows by category
  const { cuotas, gastos_fijos, presupuestos } = forecastPeriod.parent_expense_rows;

  // Calculate column width for months
  const monthColumnWidth = Math.max(100, Math.min(120, 1200 / visibleMonths.length));

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px] sticky left-0 bg-white z-20 border-r">
              Descripción
            </TableHead>
            
            {visibleMonths.map((month, index) => (
              <TableHead 
                key={month} 
                className="text-center text-xs font-medium"
                style={{ minWidth: monthColumnWidth }}
              >
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{visibleDisplayMonths[index]}</span>
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
          <SectionHeader title="CUOTAS" colSpan={visibleMonths.length + 2} />
          
          {cuotas.map((cuotaRow) => (
            <TableRow key={cuotaRow.parent_expense_id}>
              <TableCell className="sticky left-0 bg-white z-10 border-r">
                <div className="font-medium text-sm">{cuotaRow.display_name}</div>
                <div className="text-xs text-gray-500">Cuota mensual</div>
              </TableCell>
              
              {visibleMonths.map((month) => {
                const monthData = cuotaRow.monthly_data[month];
                return (
                  <TableCell key={month} className="text-center">
                    <ForecastCell 
                      amount={monthData?.amount || 0}
                      sequenceNumber={monthData?.sequence_number}
                      notes={monthData?.notes}
                    />
                  </TableCell>
                );
              })}
              
              <TableCell className="text-right bg-gray-50">
                <div className="font-semibold text-blue-600">
                  {formatCurrency(cuotaRow.total_amount)}
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {/* GASTOS FIJOS Section */}
          <SectionHeader title="GASTOS FIJOS" colSpan={visibleMonths.length + 2} />
          
          {gastos_fijos.map((gastoRow) => (
            <TableRow key={gastoRow.parent_expense_id}>
              <TableCell className="sticky left-0 bg-white z-10 border-r">
                <div className="font-medium text-sm">{gastoRow.display_name}</div>
                <div className="text-xs text-gray-500">Gasto fijo mensual</div>
              </TableCell>
              
              {visibleMonths.map((month) => {
                const monthData = gastoRow.monthly_data[month];
                return (
                  <TableCell key={month} className="text-center">
                    <ForecastCell 
                      amount={monthData?.amount || 0}
                    />
                  </TableCell>
                );
              })}
              
              <TableCell className="text-right bg-gray-50">
                <div className="font-semibold text-orange-600">
                  {formatCurrency(gastoRow.total_amount)}
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {/* PRESUPUESTOS Section */}
          <SectionHeader title="PRESUPUESTOS" colSpan={visibleMonths.length + 2} />
          
          {presupuestos.map((presupuestoRow) => (
            <TableRow key={presupuestoRow.parent_expense_id}>
              <TableCell className="sticky left-0 bg-white z-10 border-r">
                <div className="font-medium text-sm">{presupuestoRow.display_name}</div>
                <div className="text-xs text-gray-500">
                  Presupuesto mensual fijo
                </div>
              </TableCell>
              
              {visibleMonths.map((month) => {
                const monthData = presupuestoRow.monthly_data[month];
                return (
                  <TableCell key={month} className="text-center">
                    <div className="text-right">
                      <div className="font-medium text-yellow-600">
                        {formatCurrency(monthData?.amount || 0)}
                      </div>
                    </div>
                  </TableCell>
                );
              })}
              
              <TableCell className="text-right bg-gray-50">
                <div className="font-semibold text-yellow-600">
                  {formatCurrency(presupuestoRow.total_amount)}
                </div>
              </TableCell>
            </TableRow>
          ))}
          
          {/* TOTALS Row */}
          <TotalsRow
            forecastPeriod={forecastPeriod}
            visibleMonths={visibleMonths}
            label="TOTAL MENSUAL"
            getValue={(monthlyTotal) => monthlyTotal.total_mensual}
          />
        </TableBody>
      </Table>
      
      {/* Footer with period summary */}
      <div className="border-t bg-gray-50 px-4 py-3 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Período:</span> {visibleMonths.length} meses
            <div className="text-xs text-gray-500">
              {visibleDisplayMonths[0]} - {visibleDisplayMonths[visibleDisplayMonths.length - 1]}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Cuotas:</span> {cuotas.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleMonths.reduce((sum, month) => sum + forecastPeriod.monthly_totals[month].cuotas, 0)
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Gastos Fijos:</span> {gastos_fijos.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleMonths.reduce((sum, month) => sum + forecastPeriod.monthly_totals[month].gastos_fijos, 0)
              )}
            </div>
          </div>
          
          <div>
            <span className="font-medium">Presupuestos:</span> {presupuestos.length}
            <div className="text-xs text-gray-500">
              Total proyectado: {formatCurrency(
                visibleMonths.reduce((sum, month) => sum + forecastPeriod.monthly_totals[month].presupuestos, 0)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}