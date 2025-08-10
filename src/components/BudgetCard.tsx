import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BudgetCardProps {
  name: string;
  spent: number;
  total: number;
}

export function BudgetCard({ name, spent, total }: BudgetCardProps) {
  const percentage = Math.min(Math.round((spent / total) * 100), 100);
  
  // Determine the color based on percentage spent
  const getProgressColor = () => {
    if (percentage < 60) return "bg-green-500";
    if (percentage < 85) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-blue-700">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              ${spent.toFixed(2)} / ${total.toFixed(2)}
            </p>
            <p className="text-sm font-medium">{percentage}%</p>
          </div>
          <Progress value={percentage} className={`h-2 ${getProgressColor()}`} />
        </div>
      </CardContent>
    </Card>
  );
}
