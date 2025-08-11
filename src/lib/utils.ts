import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea un valor numérico como moneda en formato argentino (ARS)
 * @param value - El valor numérico a formatear
 * @param includeSymbol - Si debe incluir el símbolo de peso ($)
 * @returns Cadena formateada con separadores de miles usando puntos
 */
export function formatCurrency(value: number, includeSymbol = true): string {
  // Formatear con puntos como separadores de miles (formato argentino)
  const formatted = new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(value);
  
  return includeSymbol ? `$${formatted}` : formatted;
}
