// API service for interacting with the backend

// Interface for transactions from the API
export interface ParsedTransaction {
  messageId: string;
  date: string; // Formato ISO 8601
  merchant: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  source: string;
}

// Constants
export const TEST_USER_ID = '134b7590-9f83-4cc4-828e-d1ab6cc1dcf4'; // User ID for testing

/**
 * Fetch transactions from the API
 * @returns Promise with an array of transactions
 */
export async function fetchTransactions(): Promise<ParsedTransaction[]> {
  const requestBody = {
    q: '(from:"Informes Naranja X" OR from:"Aviso Santander" OR from:"belo" OR from:"Mercado Libre") subject:("Ingresó una compra" OR "Pagaste" OR "Aviso de operación" OR "Envío exitoso" OR "Retiro exitoso" OR "Recibiste tu compra") after:2025/08/01 before:2025/09/01'
  };

  try {
    const response = await fetch('http://localhost:3000/gmail/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

/**
 * Group transactions by budget/category and calculate totals
 * @param transactions List of transactions to group
 * @returns Budget data with totals calculated
 */
export function calculateBudgets(transactions: ParsedTransaction[]) {
  // Extract unique merchants to use as budget categories
  const categories = new Set<string>();
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      categories.add(transaction.merchant);
    }
  });
  
  // For each category, calculate the total spent
  const budgets = Array.from(categories).map(category => {
    const categoryTransactions = transactions.filter(
      t => t.merchant === category && t.type === 'expense'
    );
    
    const spent = categoryTransactions.reduce(
      (sum, transaction) => sum + transaction.amount, 
      0
    );
    
    return {
      id: category,
      name: category,
      spent,
      total: spent * 1.5, // Estimating budget as 1.5x current spending
    };
  });
  
  return budgets;
}
