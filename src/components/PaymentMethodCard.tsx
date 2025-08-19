import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getPaymentMethodColor } from "@/lib/paymentMethodColors";

interface PaymentMethodCardProps {
  name: string;
  amount: number;
  transactionCount: number;
  percentage: number;
  isSelected?: boolean;
}

export function PaymentMethodCard({ name, amount, transactionCount, percentage, isSelected = false }: PaymentMethodCardProps) {
  const colorClass = getPaymentMethodColor(name) || "text-gray-600";
  
  return (
    <Card className={`w-full shadow-sm transition-all duration-200 border-2 ${
      isSelected 
        ? "border-blue-500 bg-blue-50 shadow-lg scale-[1.02]" 
        : "border-gray-200 hover:shadow-md"
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg ${colorClass}`}>
          {name || "Sin especificar"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-lg font-bold text-gray-900">
            <span className={amount < 0 ? "text-red-600" : ""}>{formatCurrency(amount)}</span>
          </p>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>{transactionCount} transacciones</span>
            <span>{percentage}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}