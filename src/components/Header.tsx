import { Plus, Eye, CreditCard, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { LoginButton } from "./LoginButton";
import { DateSelector } from "./DateSelector";

interface HeaderProps {
  onAddTransaction: () => void;
  onCreateBudget: () => void;
  onViewTransactions: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

export function Header({ onAddTransaction, onCreateBudget, onViewTransactions, selectedDate, onDateChange, isLoading = false }: HeaderProps) {
  return (
    <header className="w-full py-4 px-1">
      {/* Mobile Layout: Stacked */}
      <div className="sm:hidden">
        {/* Primera línea: Título + Botones */}
        <div className="flex justify-between items-center w-full mb-3">
          <h1 className="text-2xl font-bold text-blue-800">Presus.</h1>
          <div className="flex items-center gap-1">
            <Button 
              onClick={onViewTransactions} 
              variant="default"
              size="icon"
              className="bg-blue-800 hover:bg-blue-900 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
              <span className="sr-only">Ver Transacciones</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isLoading}>
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-t-transparent border-blue-800 rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-5 w-5 text-blue-800" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddTransaction} className="cursor-pointer" disabled={isLoading}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Añadir Transacción
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onCreateBudget} className="cursor-pointer" disabled={isLoading}>
                  <PieChart className="h-4 w-4 mr-2" />
                  Nuevo Presupuesto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <LoginButton isAppLoading={isLoading} />
          </div>
        </div>
        
        {/* Segunda línea: DateSelector */}
        <div className="flex justify-center w-full">
          <div className="w-full">
            <DateSelector 
              selectedDate={selectedDate}
              onDateChange={onDateChange}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Desktop Layout: Single Line */}
      <div className="hidden sm:flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold text-blue-800 flex-shrink-0">Presus.</h1>
        
        {/* Date Selector - Center */}
        <div className="flex-1 flex justify-center min-w-0 mx-2">
          <DateSelector 
            selectedDate={selectedDate}
            onDateChange={onDateChange}
            isLoading={isLoading}
          />
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            onClick={onViewTransactions} 
            variant="default"
            size="icon"
            className="bg-blue-800 hover:bg-blue-900 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
            <span className="sr-only">Ver Transacciones</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isLoading}>
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-t-transparent border-blue-800 rounded-full animate-spin" />
                ) : (
                  <Plus className="h-5 w-5 text-blue-800" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onAddTransaction} className="cursor-pointer" disabled={isLoading}>
                <CreditCard className="h-4 w-4 mr-2" />
                Añadir Transacción
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onCreateBudget} className="cursor-pointer" disabled={isLoading}>
                <PieChart className="h-4 w-4 mr-2" />
                Nuevo Presupuesto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <LoginButton isAppLoading={isLoading} />
        </div>
      </div>
    </header>
  );
}
