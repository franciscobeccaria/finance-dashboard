import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TotalBudgetCardProps {
  spent: number;
  total: number;
}

export function TotalBudgetCard({ spent, total }: TotalBudgetCardProps) {
  const percentage = Math.min(Math.round((spent / total) * 100), 100);
  
  // Format the currency amounts
  const formattedSpent = new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS' 
  }).format(spent);
  
  const formattedTotal = new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS' 
  }).format(total);
  
  return (
    <Card className="col-span-full bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-500 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-center font-bold text-blue-800">Presupuesto Total</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-2">
          <div className="text-3xl font-bold text-blue-900">{formattedSpent}</div>
          <div className="text-lg text-gray-600">de {formattedTotal}</div>
        </div>
        <Progress 
          value={percentage} 
          className={`h-3 bg-blue-100 ${
            percentage < 60 
              ? "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-green-500" 
              : percentage < 85 
                ? "[&>div]:bg-gradient-to-r [&>div]:from-yellow-400 [&>div]:to-amber-500" 
                : "[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:to-red-600"
          }`}
        />
        <div className="flex justify-between text-sm mt-1">
          <div className="text-gray-500">
            {percentage}% utilizado
          </div>
          <div className={
            percentage < 60 
              ? "text-green-600 font-medium" 
              : percentage < 85 
                ? "text-amber-600 font-medium" 
                : "text-red-600 font-medium"
          }>
            {percentage < 60 
              ? "Bajo control" 
              : percentage < 85 
                ? "Precaución" 
                : "Límite alcanzado"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
