// API service for interacting with the backend

// Budget type interface
interface BudgetType {
  id: string;
  name: string;
  spent: number;
  total: number;
  isSpecial?: boolean;
}

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
  user_id: string;
  budget_id: string | null;
  message_id: string;
  transaction_date: string;
  merchant: string;
  amount: string; // Backend returns as string
  currency: string;
  transaction_type: 'expense' | 'income';
  source: string;
  payment_method: string | null;
  description: string | null;
  is_automatic: boolean;
  created_at: string;
  updated_at: string;
  budget?: {
    id: string;
    user_id: string;
    name: string;
    total_amount: string;
    is_special: boolean;
    created_at: string;
    updated_at: string;
  } | null;
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
  { id: "8", name: "Otros", spent: 0, total: 150, isSpecial: false }
];

/**
 * Fetch all transactions from backend (consolidated endpoint)
 * @param accessToken - Google access token from session
 * @param startDate - Optional start date for filtering (defaults to current month start)
 * @param endDate - Optional end date for filtering (defaults to current month end)
 * @returns Promise with an array of transactions
 */
export async function fetchAllTransactions(
  accessToken: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<BackendTransaction[]> {
  try {
    // Build query parameters for date filtering
    const queryParams = new URLSearchParams();
    
    if (startDate) {
      queryParams.append('startDate', startDate.toISOString().split('T')[0]); // YYYY-MM-DD format
    }
    
    if (endDate) {
      queryParams.append('endDate', endDate.toISOString().split('T')[0]); // YYYY-MM-DD format
    }
    
    const queryString = queryParams.toString();
    const url = `${BACKEND_URL}/transactions/all${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔍 Fetching transactions with date filter:', { 
      startDate: startDate?.toISOString().split('T')[0], 
      endDate: endDate?.toISOString().split('T')[0],
      url 
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error('❌ Authentication failed - token expired or invalid');
        throw new Error('AUTHENTICATION_ERROR');
      }
      
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
 * @param startDate - Optional start date for Gmail search (defaults to current month start)
 * @param endDate - Optional end date for Gmail search (defaults to current month end)
 * @returns Promise with an array of transactions
 */
export async function fetchTransactions(
  accessToken: string, 
  startDate?: Date, 
  endDate?: Date
): Promise<ParsedTransaction[]> {
  // Generate date range if not provided (current month)
  const now = new Date();
  const defaultStartDate = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Format dates for Gmail query (YYYY/MM/DD)
  const formatGmailDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  };
  
  const afterDate = formatGmailDate(defaultStartDate);
  const beforeDate = formatGmailDate(defaultEndDate);
  
  console.log('🔍 Gmail search date range:', { afterDate, beforeDate });
  
  const requestBody = {
    q: `(from:"Informes Naranja X" OR from:"Aviso Santander" OR from:"belo" OR from:"Mercado Libre") subject:("Ingresó una compra" OR "Pagaste" OR "Aviso de operación" OR "Envío exitoso" OR "Retiro exitoso" OR "Recibiste tu compra") after:${afterDate} before:${beforeDate}`
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
      
      // Handle authentication errors specifically
      if (response.status === 401) {
        console.error('❌ Authentication failed - token expired or invalid');
        throw new Error('AUTHENTICATION_ERROR');
      }
      
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // Transform backend response to frontend format
    const transformedData = data.map((budget: { 
      id: string; 
      name: string; 
      total_amount?: number; 
      total?: number; 
      spent_amount?: number; 
      spent?: number;
      isSpecial?: boolean;
    }) => ({
      id: budget.id,
      name: budget.name,
      total: parseFloat(String(budget.total_amount || budget.total || 0)), // Handle both formats
      isSpecial: (budget as typeof budget & { is_special?: boolean }).is_special || budget.isSpecial || false,
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
 * Create a new manual transaction
 * @param accessToken - Google access token from session
 * @param transaction - Transaction data to create
 * @returns Promise with the created transaction
 */
export async function createTransaction(
  accessToken: string,
  transaction: {
    merchant: string;
    amount: number;
    budgetId?: string;
    date: Date | string;
    description?: string;
    type?: 'expense' | 'income';
    source?: string;
  }
): Promise<BackendTransaction> {
  try {
    // Ensure date is a Date object
    const transactionDate = typeof transaction.date === 'string' 
      ? new Date(transaction.date) 
      : transaction.date;

    const response = await fetch(`${BACKEND_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        merchant: transaction.merchant,
        amount: transaction.amount,
        budget_id: transaction.budgetId || null, // Use snake_case for backend
        transaction_date: transactionDate.toISOString(),
        description: transaction.description,
        transaction_type: transaction.type || 'expense',
        source: transaction.source || 'Manual',
        currency: 'ARS' // Default currency
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

/**
 * Update transaction budget assignment and description
 * @param accessToken - Google access token from session
 * @param transactionId - ID of the transaction to update
 * @param budgetId - ID of the budget to assign (or null to unassign)
 * @param description - Optional custom description
 */
/**
 * Delete a transaction
 * @param accessToken - Google access token from session
 * @param transactionId - ID of the transaction to delete
 */
export async function deleteTransaction(
  accessToken: string, 
  transactionId: string
): Promise<void> {
  const url = `${BACKEND_URL}/transactions/${transactionId}`;
  
  console.log('🗑️ API Request - Delete Transaction:', {
    method: 'DELETE',
    url,
    headers: {
      'Authorization': `Bearer ${accessToken ? 'present' : 'missing'}`,
    }
  });
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error Response Body:', errorData);
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    console.log('✅ Transaction deleted successfully');
  } catch (error) {
    console.error('❌ Network/Parse Error:', error);
    throw error;
  }
}

export async function updateTransactionBudget(
  accessToken: string, 
  transactionId: string, 
  budgetId: string | null, 
  description?: string
): Promise<BackendTransaction> {
  const url = `${BACKEND_URL}/transactions/${transactionId}`;
  const payload = {
    budget_id: budgetId,
    ...(description !== undefined && { description })
  };
  
  console.log('🔧 API Request:', {
    method: 'PUT',
    url,
    payload,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken ? 'present' : 'missing'}`,
    }
  });
  
  try {
    const response = await fetch(url, {
      method: 'PUT', // Fix: backend uses PUT, not PATCH
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('❌ Error Response Body:', errorData);
      throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('✅ Success Response:', responseData);
    return responseData;
  } catch (error) {
    console.error('❌ Network/Parse Error:', error);
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
export function saveUserBudgets(userEmail: string, budgets: BudgetType[]) {
  const storageKey = `budgets_${userEmail}`;
  localStorage.setItem(storageKey, JSON.stringify(budgets));
  console.log('Budgets saved for user:', userEmail);
}
