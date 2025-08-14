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

// Interface for budget data from backend (without spent - calculated in frontend)
export interface BudgetWithSpent {
  id: string;
  name: string;
  total: number;
  spent?: number; // Optional since it's calculated in frontend
  isSpecial?: boolean;
}

// Interface for transaction data from backend
export interface BackendTransaction {
  id: string;
  messageId: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  source: string;
  budgetId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Backend URL configuration
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Default budgets for new users
export const DEFAULT_BUDGETS = [
  { id: "1", name: "Supermercado", spent: 0, total: 500, isSpecial: false },
  { id: "2", name: "Restaurantes", spent: 0, total: 300, isSpecial: false },
  { id: "3", name: "Transporte", spent: 0, total: 200, isSpecial: false },
  { id: "4", name: "Entretenimiento", spent: 0, total: 250, isSpecial: false },
  { id: "5", name: "Servicios", spent: 0, total: 400, isSpecial: false },
  { id: "6", name: "Salud", spent: 0, total: 350, isSpecial: false },
  { id: "7", name: "Ropa", spent: 0, total: 200, isSpecial: false },
  { id: "8", name: "Otros", spent: 0, total: 150, isSpecial: false },
  { id: "movimientos", name: "Movimientos", spent: 0, total: 0, isSpecial: true }
];

/**
 * Fetch all transactions from backend (consolidated endpoint)
 * @param accessToken - Google access token from session
 * @returns Promise with an array of transactions
 */
export async function fetchAllTransactions(accessToken: string): Promise<BackendTransaction[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/transactions/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
}

/**
 * Fetch transactions from Gmail and store in backend (original endpoint)
 * @param accessToken - Google access token from session
 * @returns Promise with an array of transactions
 */
export async function fetchTransactions(accessToken: string): Promise<ParsedTransaction[]> {
  const requestBody = {
    q: '(from:"Informes Naranja X" OR from:"Aviso Santander" OR from:"belo" OR from:"Mercado Libre") subject:("Ingresó una compra" OR "Pagaste" OR "Aviso de operación" OR "Envío exitoso" OR "Retiro exitoso" OR "Recibiste tu compra") after:2025/08/01 before:2025/09/01'
  };

  try {
    const response = await fetch(`${BACKEND_URL}/gmail/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
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

/**
 * Fetch budgets from backend (without spent calculation)
 * @param accessToken - Google access token from session
 * @returns Promise with an array of budgets
 */
export async function fetchBudgets(accessToken: string): Promise<BudgetWithSpent[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/budgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Transform backend response to frontend format
    const transformedData = data.map((budget: any) => ({
      id: budget.id,
      name: budget.name,
      total: parseFloat(budget.total_amount || budget.total || 0), // Handle both formats
      isSpecial: budget.is_special || budget.isSpecial || false,
      spent: budget.spent || 0
    }));
    
    console.log('🔄 Transformed budget data:', transformedData);
    return transformedData;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
}

/**
 * Create a new budget
 * @param accessToken - Google access token from session
 * @param budget - Budget data to create
 * @returns Promise with the created budget
 */
export async function createBudget(accessToken: string, budget: { name: string; total_amount: number; is_special?: boolean }): Promise<BudgetWithSpent> {
  try {
    const response = await fetch(`${BACKEND_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(budget)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Transform backend response to frontend format
    return {
      id: data.id,
      name: data.name,
      total: parseFloat(data.total_amount || data.total || 0),
      isSpecial: data.is_special || data.isSpecial || false,
      spent: data.spent || 0
    };
  } catch (error) {
    console.error('Error creating budget:', error);
    throw error;
  }
}

/**
 * Update an existing budget
 * @param accessToken - Google access token from session
 * @param budgetId - ID of the budget to update
 * @param budget - Updated budget data
 * @returns Promise with the updated budget
 */
export async function updateBudget(accessToken: string, budgetId: string, budget: { name: string; total_amount: number; is_special?: boolean }): Promise<BudgetWithSpent> {
  try {
    const response = await fetch(`${BACKEND_URL}/budgets/${budgetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(budget)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Transform backend response to frontend format
    return {
      id: data.id,
      name: data.name,
      total: parseFloat(data.total_amount || data.total || 0),
      isSpecial: data.is_special || data.isSpecial || false,
      spent: data.spent || 0
    };
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
}

/**
 * Delete a budget
 * @param accessToken - Google access token from session
 * @param budgetId - ID of the budget to delete
 */
export async function deleteBudget(accessToken: string, budgetId: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
}

/**
 * Update transaction budget assignment
 * @param accessToken - Google access token from session
 * @param transactionId - ID of the transaction to update
 * @param budgetId - ID of the budget to assign (or null to unassign)
 * @param description - Optional custom description
 */
export async function updateTransactionBudget(
  accessToken: string, 
  transactionId: string, 
  budgetId: string | null, 
  description?: string
): Promise<BackendTransaction> {
  try {
    const response = await fetch(`${BACKEND_URL}/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        budgetId,
        ...(description !== undefined && { description })
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating transaction budget:', error);
    throw error;
  }
}

// Legacy functions for localStorage (will be removed after migration)
/**
 * Initialize user data when logging in for the first time
 * This will be replaced by a backend endpoint in the future
 * @param userEmail - User email from session
 * @returns Default budgets for the user
 */
export function initializeUserBudgets(userEmail: string) {
  const storageKey = `budgets_${userEmail}`;
  
  // Check if user already has budgets in localStorage
  const existingBudgets = localStorage.getItem(storageKey);
  
  if (!existingBudgets) {
    // First time user - initialize with default budgets
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_BUDGETS));
    console.log('First time user detected, initialized default budgets for:', userEmail);
    return DEFAULT_BUDGETS;
  }
  
  // Returning user - load existing budgets
  try {
    const parsedBudgets = JSON.parse(existingBudgets);
    console.log('Returning user detected, loaded existing budgets for:', userEmail);
    return parsedBudgets;
  } catch (error) {
    console.error('Error parsing stored budgets, reinitializing:', error);
    localStorage.setItem(storageKey, JSON.stringify(DEFAULT_BUDGETS));
    return DEFAULT_BUDGETS;
  }
}

/**
 * Save user budgets to localStorage (temporary until backend is ready)
 * @param userEmail - User email from session
 * @param budgets - Budgets to save
 */
export function saveUserBudgets(userEmail: string, budgets: any[]) {
  const storageKey = `budgets_${userEmail}`;
  localStorage.setItem(storageKey, JSON.stringify(budgets));
  console.log('Budgets saved for user:', userEmail);
}
