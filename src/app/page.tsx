"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Header } from "@/components/Header";
import { BudgetCard } from "@/components/BudgetCard";
import { BudgetCardSkeleton } from "@/components/BudgetCardSkeleton";
import { TotalBudgetCard } from "@/components/TotalBudgetCard";
import { TotalBudgetCardSkeleton } from "@/components/TotalBudgetCardSkeleton";
import { EditBudgetDialog, Budget as BudgetType } from "@/components/EditBudgetDialog";
import { Edit } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { ViewTransactionsDialog } from "@/components/ViewTransactionsDialog";
import { fetchAllTransactions, BackendTransaction, fetchBudgets, BudgetWithSpent, createBudget, updateBudget, deleteBudget, updateTransactionBudget, createTransaction } from "@/services/api";
import { LoginButton } from "@/components/LoginButton";

// We're now using BudgetType from EditBudgetDialog.tsx

// Interface for the transaction data structure used in the UI
interface UITransaction {
  id: string;
  date: Date;
  store: string;
  amount: number;
  budget: string;
  budgetId: string;
  time?: string;
  paymentMethod?: string; // Nuevo campo para el medio de pago
  description?: string; // Nuevo campo para descripción personalizada
}

// Definir categoría especial para movimientos (no aparece como presupuesto)
const MOVIMIENTOS_CATEGORY = {
  id: "movimientos",
  name: "Movimientos",
  isSpecial: true, // Flag para identificarla como categoría especial
};

// Budget categories are now loaded from user initialization

export default function Home() {
  const { data: session, status } = useSession();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editBudgetDialogOpen, setEditBudgetDialogOpen] = useState(false);
  const [currentEditBudget, setCurrentEditBudget] = useState<BudgetType | undefined>(undefined);
  
  // State for API data
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for categorized transactions and budget calculation
  const [uiTransactions, setUiTransactions] = useState<UITransaction[]>([]);
  
  // State for budgets (loaded from backend)
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  
  // Siempre asegurémonos de tener la categoría especial "Movimientos" disponible para transacciones
  // pero no se muestra como presupuesto
  const allCategories = useMemo<BudgetType[]>(() => {
    // Convert BudgetWithSpent to BudgetType and add movimientos category
    const budgetTypes: BudgetType[] = budgets.map(b => ({
      id: b.id,
      name: b.name,
      spent: b.spent,
      total: b.total,
      isSpecial: b.isSpecial || false
    }));
    
    // Verificar si ya está incluida en los presupuestos (no debería, pero por seguridad)
    const movimientosExists = budgetTypes.some(b => b.id === MOVIMIENTOS_CATEGORY.id);
    if (!movimientosExists) {
      return [...budgetTypes, {...MOVIMIENTOS_CATEGORY, spent: 0, total: 0}];
    }
    return budgetTypes;
  }, [budgets]);
  
  // Calculate spent amounts for each budget based on categorized transactions
  const budgetsWithSpent = useMemo<BudgetType[]>(() => {
    // Start with current budgets (with zero spent)
    const workingBudgets = budgets.map(budget => ({
      id: budget.id,
      name: budget.name,
      spent: 0,
      total: budget.total,
      isSpecial: budget.isSpecial || false
    }));
    
    // Update spent amounts based on categorized transactions
    uiTransactions.forEach(transaction => {
      if (transaction.budgetId) {
        const budgetIndex = workingBudgets.findIndex(b => b.id === transaction.budgetId);
        if (budgetIndex !== -1) {
          workingBudgets[budgetIndex].spent += transaction.amount;
        }
      }
    });
    
    return workingBudgets;
  }, [uiTransactions, budgets]);
  
  // Filtrar presupuestos para mostrar solo los no especiales en la UI
  const displayBudgets = useMemo(() => {
    return budgetsWithSpent.filter(budget => !budget.isSpecial);
  }, [budgetsWithSpent]);

  // Handle transaction categorization and description updates
  const handleCategorizeTransaction = async (transactionId: string, budgetId: string, budgetName: string, description?: string) => {
    if (!session?.accessToken) return;
    
    console.log('🔄 Categorizing transaction:', { transactionId, budgetId, budgetName, description });
    
    // Store original state for rollback if needed
    const originalTransaction = uiTransactions.find(t => t.id === transactionId);
    
    try {
      // Optimistic update - update UI immediately
      setUiTransactions(prev => 
        prev.map(transaction => 
          transaction.id === transactionId 
            ? { 
                ...transaction, 
                budget: budgetName, 
                budgetId: budgetId,
                ...(description !== undefined && { description })
              } 
            : transaction
        )
      );
      
      // Send request to backend (no need to process response)
      await updateTransactionBudget(
        session.accessToken,
        transactionId,
        budgetId === '' ? null : budgetId,
        description
      );
      
      console.log('✅ Category updated successfully');
      
    } catch (error) {
      console.error('❌ Failed to update category:', error);
      
      // Rollback optimistic update only if request failed
      if (originalTransaction) {
        setUiTransactions(prev => 
          prev.map(transaction => 
            transaction.id === transactionId ? originalTransaction : transaction
          )
        );
      }
      
      setError(error instanceof Error ? error.message : 'Error updating transaction');
    }
  };
  
  // Handle opening the edit budget dialog
  const handleEditBudget = (budget: BudgetType) => {
    // No permitir editar la categoría especial Movimientos
    if (budget.id === MOVIMIENTOS_CATEGORY.id) {
      return;
    }
    
    setCurrentEditBudget(budget);
    setEditBudgetDialogOpen(true);
  };
  
  // Handle creating a new budget
  const handleAddBudget = () => {
    setCurrentEditBudget(undefined);
    setEditBudgetDialogOpen(true);
  };
  
  // Handle saving a budget (new or edited)
  const handleSaveBudget = async (budget: Omit<BudgetType, "spent">) => {
    // Prevenir edición o creación de presupuestos con el ID de movimientos
    if (budget.id === MOVIMIENTOS_CATEGORY.id) {
      return;
    }
    
    if (!session?.accessToken) return;
    
    try {
      if (currentEditBudget) {
        // Editing existing budget
        await updateBudget(session.accessToken, budget.id, {
          name: budget.name,
          total_amount: budget.total
        });
      } else {
        // Adding new budget
        await createBudget(session.accessToken, {
          name: budget.name,
          total_amount: budget.total
        });
      }
      
      // Refresh budgets from backend
      const updatedBudgets = await fetchBudgets(session.accessToken);
      setBudgets(updatedBudgets);
    } catch (error) {
      console.error('Error saving budget:', error);
      setError(error instanceof Error ? error.message : 'Error saving budget');
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = async (budgetId: string) => {
    // No permitir eliminar la categoría especial de Movimientos
    if (budgetId === MOVIMIENTOS_CATEGORY.id) {
      return;
    }
    
    if (!session?.accessToken) return;
    
    try {
      // Delete budget from backend
      await deleteBudget(session.accessToken, budgetId);
      
      // Refresh budgets from backend
      const updatedBudgets = await fetchBudgets(session.accessToken);
      setBudgets(updatedBudgets);
      
      // Remove the category from any transactions using this budget
      setUiTransactions(prev => 
        prev.map(transaction => 
          transaction.budgetId === budgetId 
            ? { ...transaction, budget: '', budgetId: '' } 
            : transaction
        )
      );
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError(error instanceof Error ? error.message : 'Error deleting budget');
    }
  };

  // Handle creating a new transaction
  const handleCreateTransaction = async (transaction: {
    merchant: string;
    amount: number;
    budgetId: string;
    date: Date;
    time: string;
  }) => {
    if (!session?.accessToken) return;

    try {
      console.log('🔄 Creating transaction:', transaction);
      
      // Create transaction via API
      const createdTransaction = await createTransaction(session.accessToken, {
        merchant: transaction.merchant,
        amount: transaction.amount,
        budgetId: transaction.budgetId || undefined,
        date: transaction.date, // Pass Date object directly
        description: 'Transacción manual',
        type: 'expense',
        source: 'Manual'
      });
      
      console.log('✅ Transaction created:', createdTransaction);
      
      // Add the new transaction to local state 
      // The useMemo budgetsWithSpent will automatically recalculate spent amounts
      setTransactions(prev => [createdTransaction, ...prev]);
      
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };
  
  // Transform API transactions to UI format when API data changes
  useEffect(() => {
    console.log('🔍 All transactions before filter:', transactions);
    console.log('🔍 Sample transaction structure:', transactions[0]);
    
    const transformedTransactions = transactions
      .filter(t => t.transaction_type === 'expense') // Fix: backend uses transaction_type, not type
      .map(transaction => {
        const date = new Date(transaction.transaction_date); // Fix: backend uses transaction_date, not date
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        // Find budget name from budgetId if assigned
        let budgetName = '';
        if (transaction.budget_id) { // Fix: backend uses budget_id, not budgetId
          const assignedBudget = budgets.find(b => b.id === transaction.budget_id);
          if (assignedBudget) {
            budgetName = assignedBudget.name;
          }
        }
        
        return {
          id: transaction.id,
          date: date,
          store: transaction.merchant,
          amount: parseFloat(transaction.amount), // Convert string to number
          budget: budgetName,
          budgetId: transaction.budget_id || '',
          time: `${hours}:${minutes}`,
          paymentMethod: transaction.source,
          description: transaction.description
        };
      });
    
    console.log('🔍 Expense transactions after filter:', transformedTransactions.length);
    console.log('🔄 Transformed transactions for UI:', transformedTransactions);
    setUiTransactions(transformedTransactions);
  }, [transactions, budgets]);

  // Fetch transactions from API
  // TODO: Temporarily commented out - will be re-enabled after auth implementation
  /* useEffect(() => {
    const getTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await fetchTransactions();
        setTransactions(data);
        console.log('Transactions loaded:', data.length);
        if (data.length > 0) {
          console.log('Sample transaction:', data[0]);
        }
      } catch (err: unknown) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    getTransactions();
  }, []); */
  
  // Initialize user data and fetch transactions when authenticated
  useEffect(() => {
    const initializeUserData = async () => {
      if (status === "loading") return; // Wait for session to load
      
      if (!session?.user?.email || !session.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔑 Testing authentication with Google token...');
        
        // Test budgets first (should work)
        const budgetData = await fetchBudgets(session.accessToken);
        setBudgets(budgetData);
        console.log('✅ Budgets loaded:', budgetData.length);
        
        // Test transactions (might not work yet)
        try {
          const transactionData = await fetchAllTransactions(session.accessToken);
          setTransactions(transactionData);
          console.log('✅ Transactions loaded:', transactionData.length);
        } catch (transErr) {
          console.log('⚠️ Transactions endpoint not ready:', transErr);
          setTransactions([]); // Set empty array to continue
        }
        
        if (budgetData.length > 0) {
          console.log('📊 Sample budget:', budgetData[0]);
        }
      } catch (err: unknown) {
        console.error('❌ Error initializing user data:', err);
        setError(err instanceof Error ? err.message : 'Error loading data from backend');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUserData();
  }, [session, status]);

  // Show loading screen while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-t-transparent border-blue-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold text-blue-800 mb-4">Presus.</h1>
          <p className="text-gray-600 mb-8">
            Gestiona tus presupuestos y transacciones de forma inteligente.
            Inicia sesión con Google para comenzar.
          </p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header 
          onAddTransaction={() => setAddDialogOpen(true)} 
          onCreateBudget={handleAddBudget}
          onViewTransactions={() => setViewDialogOpen(true)}
          isLoading={isLoading}
        />
        
        <main>
          
          {/* Total Budget Summary Card */}
          {isLoading ? (
            <div className="mb-6">
              <TotalBudgetCardSkeleton />
            </div>
          ) : !error && (
            <div className="mb-6">
              <TotalBudgetCard
                spent={uiTransactions
                  .filter(t => t.budgetId !== MOVIMIENTOS_CATEGORY.id) // Excluir movimientos del cálculo
                  .reduce((sum, transaction) => sum + transaction.amount, 0)}
                total={displayBudgets.reduce((sum, budget) => sum + budget.total, 0)}
              />
            </div>
          )}
          
          {/* Responsive grid for budget cards - adaptado según la cantidad de presupuestos */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${isLoading ? "lg:grid-cols-4" : displayBudgets.length === 1 
            ? "lg:grid-cols-1" 
            : displayBudgets.length === 2 
            ? "lg:grid-cols-2" 
            : displayBudgets.length === 3 
            ? "lg:grid-cols-3" 
            : "lg:grid-cols-4"} gap-4 mb-8`}>
            {/* Estado de carga con skeletons */}
            {isLoading && (
              <>
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
                <BudgetCardSkeleton />
              </>
            )}
            
            {/* Mensaje cuando no hay presupuestos */}
            {budgetsWithSpent.length === 0 && !isLoading && !error && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No se encontraron presupuestos
              </div>
            )}
            
            {/* Lista de presupuestos */}
            {!isLoading && displayBudgets.map((budget) => (
              <div key={budget.id} className="relative group">
                <BudgetCard
                  name={budget.name}
                  spent={budgetsWithSpent.find(b => b.id === budget.id)?.spent || 0}
                  total={budget.total}
                />
                <button 
                  onClick={() => handleEditBudget(budget)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-full"
                >
                  <Edit className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Ya no es necesario el botón aquí, se movió al Header */}
        </main>
      </div>
      
      {/* Dialogs */}
      <AddTransactionDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        budgets={budgets}
        onSave={handleCreateTransaction}
      />
      <ViewTransactionsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        transactions={uiTransactions}
        onCategorize={handleCategorizeTransaction}
        availableBudgets={allCategories}
      />
      
      <EditBudgetDialog
        open={editBudgetDialogOpen}
        onOpenChange={setEditBudgetDialogOpen}
        budget={currentEditBudget}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
      />
    </div>
  );
}
