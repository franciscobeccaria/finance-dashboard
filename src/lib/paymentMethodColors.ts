import { PaymentMethod } from "@/services/api";

// This will hold the payment methods loaded from API
let cachedPaymentMethods: PaymentMethod[] = [];

// Function to set payment methods cache (called from components that load payment methods)
export function setPaymentMethodsCache(paymentMethods: PaymentMethod[]): void {
  cachedPaymentMethods = paymentMethods;
}

// Function to get the color for a payment method
export function getPaymentMethodColor(paymentMethodName: string | undefined, paymentMethods?: PaymentMethod[]): string | undefined {
  if (!paymentMethodName) return undefined;
  
  // Use provided payment methods or fallback to cache
  const methods = paymentMethods || cachedPaymentMethods;
  
  // Find the payment method by name
  const method = methods.find(pm => 
    pm.name.toLowerCase() === paymentMethodName.toLowerCase()
  );
  
  if (method) {
    return method.color;
  }
  
  // Fallback for automatic transactions (Santander, Naranja X, Belo)
  const normalizedMethod = paymentMethodName.trim().toLowerCase();
  const automaticColorMap: Record<string, string> = {
    'santander': 'text-red-600',
    'naranja x': 'text-orange-500', 
    'naranja': 'text-orange-500',
    'belo': 'text-violet-600',
  };
  
  if (normalizedMethod in automaticColorMap) {
    return automaticColorMap[normalizedMethod];
  }
  
  // No color found
  return undefined;
}
