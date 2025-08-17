import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  isLoading?: boolean;
}

export function DateSelector({ selectedDate, onDateChange, isLoading = false }: DateSelectorProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Helper functions for navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const formatDisplayDate = (date: Date) => {
    return format(date, "MMMM yyyy", { locale: es });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setIsPopoverOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-sm">
      {/* Previous Month Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <ChevronLeft className="h-4 w-4 text-gray-600" />
        <span className="sr-only">Mes anterior</span>
      </Button>

      {/* Current Month/Year Display + Picker */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="h-8 px-3 font-medium text-gray-700 hover:bg-gray-100 text-sm min-w-[120px] justify-center"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin mr-2" />
            ) : (
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            )}
            {formatDisplayDate(selectedDate)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <MonthYearPicker
            selectedDate={selectedDate}
            onDateChange={handleDateSelect}
          />
        </PopoverContent>
      </Popover>

      {/* Next Month Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToNextMonth}
        disabled={isLoading}
        className="h-8 w-8 p-0 hover:bg-gray-100"
      >
        <ChevronRight className="h-4 w-4 text-gray-600" />
        <span className="sr-only">Mes siguiente</span>
      </Button>
    </div>
  );
}

// Month/Year Picker Component
interface MonthYearPickerProps {
  selectedDate: Date;
  onDateChange: (date: Date | undefined) => void;
}

function MonthYearPicker({ selectedDate, onDateChange }: MonthYearPickerProps) {
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  /*
   * KNOWN ISSUE: App crashes when selecting a new month
   * 
   * Problem: Selecting a new month in the MonthYearPicker causes the app to crash.
   * This is likely due to:
   * 1. Cascading state updates when date changes trigger transaction refetches
   * 2. Potential infinite loops in useEffect dependencies 
   * 3. Race conditions between Zustand store updates and React state
   * 4. Possible issues with Date object creation/comparison
   * 
   * Symptoms:
   * - App crashes when user clicks on a month button
   * - Fast Refresh performs full reload due to runtime error
   * 
   * TODO: Investigate and fix the underlying cause of the crash
   * Potential solutions:
   * - Add error boundaries around date selection
   * - Debounce date change events
   * - Review useEffect dependencies in page.tsx
   * - Add try-catch blocks around date operations
   */
  const handleMonthSelect = (monthIndex: number) => {
    try {
      console.log('🗓️ MonthYearPicker: Selecting month', monthIndex, 'year', currentYear);
      const newDate = new Date(currentYear, monthIndex, 1);
      console.log('🗓️ MonthYearPicker: Created new date', newDate.toLocaleDateString('es-ES'));
      onDateChange(newDate);
    } catch (error) {
      console.error('❌ MonthYearPicker: Error selecting month:', error);
    }
  };

  const currentMonth = selectedDate.getMonth();
  const currentSelectedYear = selectedDate.getFullYear();

  return (
    <div className="p-4 bg-white">
      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(currentYear - 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{currentYear}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(currentYear + 1)}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-2">
        {months.map((month, index) => {
          const isSelected = currentSelectedYear === currentYear && currentMonth === index;
          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => handleMonthSelect(index)}
              className={`h-10 text-sm ${
                isSelected 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "hover:bg-gray-100"
              }`}
            >
              {month}
            </Button>
          );
        })}
      </div>
    </div>
  );
}