import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TotalBudgetCardSkeleton() {
  return (
    <Card className="col-span-full bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-500 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl text-center font-bold text-blue-800">Presupuesto Total</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-2">
          <div className="flex items-baseline">
            <Skeleton className="h-8 w-32 mr-2 bg-blue-200/50" />
            <Skeleton className="h-5 w-24 bg-blue-200/50" />
          </div>
        </div>
        <Skeleton className="h-3 w-full my-2 bg-blue-200/50" />
        <div className="flex justify-between mt-2">
          <Skeleton className="h-4 w-20 bg-blue-200/50" />
          <Skeleton className="h-4 w-28 bg-blue-200/50" />
        </div>
      </CardContent>
    </Card>
  );
}
