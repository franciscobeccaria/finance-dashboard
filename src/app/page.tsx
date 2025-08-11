"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { BudgetCard } from "@/components/BudgetCard";
import { BudgetCardSkeleton } from "@/components/BudgetCardSkeleton";
import { TotalBudgetCard } from "@/components/TotalBudgetCard";
import { TotalBudgetCardSkeleton } from "@/components/TotalBudgetCardSkeleton";
import { EditBudgetDialog, Budget as BudgetType } from "@/components/EditBudgetDialog";
import { Edit } from "lucide-react";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { ViewTransactionsDialog } from "@/components/ViewTransactionsDialog";
import { fetchTransactions, ParsedTransaction } from "@/services/api";

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

// Define our predefined budget categories
const predefinedBudgets = [
  { id: "1", name: "Supermercado", spent: 0, total: 500, isSpecial: false },
  { id: "2", name: "Restaurantes", spent: 0, total: 300, isSpecial: false },
  { id: "3", name: "Transporte", spent: 0, total: 200, isSpecial: false },
  { id: "4", name: "Entretenimiento", spent: 0, total: 250, isSpecial: false },
  { id: "5", name: "Servicios", spent: 0, total: 400, isSpecial: false },
  { id: "6", name: "Salud", spent: 0, total: 350, isSpecial: false },
  { id: "7", name: "Ropa", spent: 0, total: 200, isSpecial: false },
  { id: "8", name: "Otros", spent: 0, total: 150, isSpecial: false }
];

export default function Home() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editBudgetDialogOpen, setEditBudgetDialogOpen] = useState(false);
  const [currentEditBudget, setCurrentEditBudget] = useState<BudgetType | undefined>(undefined);
  
  // State for API data
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for categorized transactions and budget calculation
  const [uiTransactions, setUiTransactions] = useState<UITransaction[]>([]);
  
  // State for budgets (initialized with predefined ones)
  const [budgets, setBudgets] = useState<BudgetType[]>(predefinedBudgets);
  
  // Siempre asegurémonos de tener la categoría especial "Movimientos" disponible para transacciones
  // pero no se muestra como presupuesto
  const allCategories = useMemo<BudgetType[]>(() => {
    // Verificar si ya está incluida en los presupuestos (no debería, pero por seguridad)
    const movimientosExists = budgets.some(b => b.id === MOVIMIENTOS_CATEGORY.id);
    if (!movimientosExists) {
      return [...budgets, {...MOVIMIENTOS_CATEGORY, spent: 0, total: 0}];
    }
    return budgets;
  }, [budgets]);
  
  // Calculate spent amounts for each budget based on categorized transactions
  const budgetsWithSpent = useMemo<BudgetType[]>(() => {
    // Start with current budgets (with zero spent)
    const workingBudgets = budgets.map(budget => ({
      ...budget,
      spent: 0
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

  // Handle transaction categorization
  const handleCategorizeTransaction = (transactionId: string, budgetId: string, budgetName: string) => {
    setUiTransactions(prev => 
      prev.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, budget: budgetName, budgetId: budgetId } 
          : transaction
      )
    );
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
  const handleSaveBudget = (budget: Omit<BudgetType, "spent">) => {
    // Prevenir edición o creación de presupuestos con el ID de movimientos
    if (budget.id === MOVIMIENTOS_CATEGORY.id) {
      return;
    }
    
    if (currentEditBudget) {
      // Editing existing budget
      setBudgets(prev => 
        prev.map(b => 
          b.id === budget.id 
            ? { ...budget, spent: b.spent, isSpecial: false } 
            : b
        )
      );
    } else {
      // Adding new budget
      setBudgets(prev => [...prev, { ...budget, spent: 0, isSpecial: false }]);
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = (budgetId: string) => {
    // No permitir eliminar la categoría especial de Movimientos
    if (budgetId === MOVIMIENTOS_CATEGORY.id) {
      return;
    }
    
    // Remove the budget
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    
    // Remove the category from any transactions using this budget
    setUiTransactions(prev => 
      prev.map(transaction => 
        transaction.budgetId === budgetId 
          ? { ...transaction, budget: '', budgetId: '' } 
          : transaction
      )
    );
  };
  
  // Transform API transactions to UI format when API data changes
  useEffect(() => {
    if (transactions.length > 0) {
      const transformedTransactions = transactions
        .filter(t => t.type === 'expense')
        .map(transaction => {
          const date = new Date(transaction.date);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          
          return {
            id: transaction.messageId,
            date: date,
            store: transaction.merchant,
            amount: transaction.amount,
            budget: '', // No category name assigned initially
            budgetId: '', // No category ID assigned initially
            time: `${hours}:${minutes}`,
            paymentMethod: transaction.source // Mapeando source como medio de pago
          };
        });
      
      setUiTransactions(transformedTransactions);
    }
  }, [transactions]);

  // Fetch transactions from API
  useEffect(() => {
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
  }, []);

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
