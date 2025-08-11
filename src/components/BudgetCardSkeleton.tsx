import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetCardSkeleton() {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Skeleton className="h-6 w-24 bg-blue-100/60" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-baseline mb-2">
          <Skeleton className="h-7 w-20 bg-blue-100/60" />
          <Skeleton className="h-5 w-16 bg-blue-100/60" />
        </div>
        <Skeleton className="h-3 w-full my-2 bg-blue-100/60" />
        <div className="text-sm text-gray-500 flex justify-between mt-2">
          <Skeleton className="h-4 w-10 bg-blue-100/60" />
          <Skeleton className="h-4 w-16 bg-blue-100/60" />
        </div>
      </CardContent>
    </Card>
  );
}
