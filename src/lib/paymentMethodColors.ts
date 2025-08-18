// Mapeo de medios de pago a colores personalizados
// Añade aquí los medios de pago y sus colores correspondientes

// Función para obtener el color correspondiente a un medio de pago
export function getPaymentMethodColor(paymentMethod: string | undefined): string | undefined {
  if (!paymentMethod) return undefined;
  
  // Normalizar el nombre del medio de pago (convertir a minúsculas y eliminar espacios extra)
  const normalizedMethod = paymentMethod.trim().toLowerCase();
  
  // Mapeo de medios de pago a colores
  const colorMap: Record<string, string> = {
    // Tarjetas de crédito
    'naranja x': 'text-orange-500',
    'naranja': 'text-orange-500',
    'visa': 'text-blue-600',
    'mastercard': 'text-red-500',
    'american express': 'text-blue-500',
    'amex': 'text-blue-500',
    
    // Bancos
    'santander': 'text-red-600',
    'galicia': 'text-yellow-600',
    'bbva': 'text-blue-800',
    'macro': 'text-blue-700',
    'icbc': 'text-red-700',
    'nación': 'text-blue-700',
    'provincia': 'text-green-700',
    
    // Billeteras virtuales
    'mercado pago': 'text-blue-500',
    'uala': 'text-purple-600',
    'belo': 'text-violet-600',
    'modo': 'text-blue-500',
    'cuenta dni': 'text-green-600',
    'paypal': 'text-blue-600',
    
    // Efectivo y otros
    'efectivo': 'text-green-500',
    'transferencia': 'text-teal-600',
    'débito': 'text-sky-600',
    'debito': 'text-sky-600'
  };
  
  // Buscar coincidencias exactas primero
  if (normalizedMethod in colorMap) {
    return colorMap[normalizedMethod];
  }
  
  // Si no hay coincidencia exacta, buscar coincidencias parciales
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalizedMethod.includes(key)) {
      return color;
    }
  }
  
  // Si no hay coincidencia, devolver undefined (se usará el color por defecto)
  return undefined;
}
