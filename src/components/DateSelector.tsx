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

  // Helper functions for date validation
  const isDateOutOfRange = (date: Date) => {
    const targetYear = date.getFullYear();
    
    // Check if date is outside allowed range (2023-2027)
    return targetYear < 2023 || targetYear > 2027;
  };

  const canNavigateToNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return !isDateOutOfRange(nextMonth);
  };

  // Helper functions for navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    if (isDateOutOfRange(newDate)) return;
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
    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 sm:px-2 py-1 shadow-sm w-full sm:max-w-full sm:w-auto">
      {/* Previous Month Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={goToPreviousMonth}
        disabled={isLoading}
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 flex-shrink-0"
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
            className="h-7 sm:h-8 px-2 sm:px-3 font-medium text-gray-700 hover:bg-gray-100 text-xs sm:text-sm min-w-0 justify-center flex-1 sm:flex-shrink sm:max-w-none sm:min-w-[120px]"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-t-transparent border-gray-400 rounded-full animate-spin mr-2" />
            ) : (
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-gray-500 flex-shrink-0" />
            )}
            <span className="truncate">{formatDisplayDate(selectedDate)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-lg shadow-lg border border-gray-200" align="center">
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
        disabled={isLoading || !canNavigateToNextMonth()}
        className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-gray-100 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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

  // Helper functions for date validation
  const MIN_ALLOWED_YEAR = 2023; // Updated range: 2023-2027
  const MAX_ALLOWED_YEAR = 2027;
  
  const canNavigateToNextYear = () => {
    return currentYear < MAX_ALLOWED_YEAR;
  };

  const canNavigateToPreviousYear = () => {
    return currentYear > MIN_ALLOWED_YEAR;
  };

  const isMonthDisabled = (monthIndex: number, year: number) => {
    // Disable if outside allowed year range
    return year < MIN_ALLOWED_YEAR || year > MAX_ALLOWED_YEAR;
  };
  
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
      // Prevent selection of disabled months
      if (isMonthDisabled(monthIndex, currentYear)) return;
      
      const newDate = new Date(currentYear, monthIndex, 1);
      onDateChange(newDate);
    } catch (error) {
      console.error('❌ MonthYearPicker: Error selecting month:', error);
    }
  };

  const currentMonth = selectedDate.getMonth();
  const currentSelectedYear = selectedDate.getFullYear();

  return (
    <div className="p-6 bg-white rounded-lg">
      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(currentYear - 1)}
          disabled={!canNavigateToPreviousYear()}
          className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-800">{currentYear}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentYear(currentYear + 1)}
          disabled={!canNavigateToNextYear()}
          className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-3">
        {months.map((month, index) => {
          const isSelected = currentSelectedYear === currentYear && currentMonth === index;
          const isDisabled = isMonthDisabled(index, currentYear);
          return (
            <Button
              key={index}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => handleMonthSelect(index)}
              disabled={isDisabled}
              className={`h-12 w-full min-w-[60px] text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center border ${
                isSelected 
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md border-transparent" 
                  : isDisabled
                  ? "opacity-40 cursor-not-allowed text-gray-400 bg-gray-50 hover:bg-gray-50 hover:opacity-40 border-transparent"
                  : "hover:bg-gray-100 hover:shadow-sm border-transparent hover:border-gray-200"
              }`}
            >
              {month}
            </Button>
          );
        })}
      </div>
      
      {/* Date Range Info */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Rango disponible: {MIN_ALLOWED_YEAR} - {MAX_ALLOWED_YEAR}
        </p>
      </div>
    </div>
  );
}