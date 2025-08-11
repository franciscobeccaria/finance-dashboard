"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { BudgetCard } from "@/components/BudgetCard";
import { TotalBudgetCard } from "@/components/TotalBudgetCard";
import { EditBudgetDialog, Budget as BudgetType } from "@/components/EditBudgetDialog";
import { PlusCircle, Edit } from "lucide-react";
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
  time?: string;
}

// Define our predefined budget categories
const predefinedBudgets = [
  { id: "1", name: "Supermercado", spent: 0, total: 500 },
  { id: "2", name: "Restaurantes", spent: 0, total: 300 },
  { id: "3", name: "Transporte", spent: 0, total: 200 },
  { id: "4", name: "Entretenimiento", spent: 0, total: 250 },
  { id: "5", name: "Servicios", spent: 0, total: 400 },
  { id: "6", name: "Salud", spent: 0, total: 350 },
  { id: "7", name: "Ropa", spent: 0, total: 200 },
  { id: "8", name: "Otros", spent: 0, total: 150 }
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
  
  // Calculate spent amounts for each budget based on categorized transactions
  const budgetsWithSpent = useMemo<BudgetType[]>(() => {
    // Start with current budgets (with zero spent)
    const workingBudgets = budgets.map(budget => ({
      ...budget,
      spent: 0
    }));
    
    // Update spent amounts based on categorized transactions
    uiTransactions.forEach(transaction => {
      if (transaction.budget) {
        const budgetIndex = workingBudgets.findIndex(b => b.name === transaction.budget);
        if (budgetIndex !== -1) {
          workingBudgets[budgetIndex].spent += transaction.amount;
        }
      }
    });
    
    return workingBudgets;
  }, [uiTransactions, budgets]);

  // Handle transaction categorization
  const handleCategorizeTransaction = (transactionId: string, category: string) => {
    setUiTransactions(prev => 
      prev.map(transaction => 
        transaction.id === transactionId 
          ? { ...transaction, budget: category } 
          : transaction
      )
    );
  };
  
  // Handle opening the edit budget dialog
  const handleEditBudget = (budget: BudgetType) => {
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
    if (currentEditBudget) {
      // Editing existing budget
      setBudgets(prev => 
        prev.map(b => 
          b.id === budget.id 
            ? { ...budget, spent: b.spent } 
            : b
        )
      );
    } else {
      // Adding new budget
      setBudgets(prev => [...prev, { ...budget, spent: 0 }]);
    }
  };
  
  // Handle deleting a budget
  const handleDeleteBudget = (budgetId: string) => {
    // Remove the budget
    setBudgets(prev => prev.filter(b => b.id !== budgetId));
    
    // Remove the category from any transactions using this budget
    const budgetName = budgets.find(b => b.id === budgetId)?.name;
    if (budgetName) {
      setUiTransactions(prev => 
        prev.map(transaction => 
          transaction.budget === budgetName 
            ? { ...transaction, budget: '' } 
            : transaction
        )
      );
    }
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
            budget: '', // No category assigned initially
            time: `${hours}:${minutes}`
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
        <Header onAddTransaction={() => setAddDialogOpen(true)} />
        
        <main className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-blue-700">Mis Presupuestos</h2>
            <Button onClick={handleAddBudget} variant="outline" className="flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nuevo Presupuesto
            </Button>
          </div>
          
          {/* Total Budget Summary Card */}
          {!isLoading && !error && (
            <div className="mb-6">
              <TotalBudgetCard
                spent={budgetsWithSpent.reduce((sum, budget) => sum + budget.spent, 0)}
                total={budgetsWithSpent.reduce((sum, budget) => sum + budget.total, 0)}
              />
            </div>
          )}
          
          {/* Responsive grid for budget cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {budgetsWithSpent.length === 0 && !isLoading && !error && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No se encontraron presupuestos
              </div>
            )}
            {budgetsWithSpent.map((budget) => (
              <div key={budget.id} className="relative group">
                <BudgetCard
                  name={budget.name}
                  spent={budget.spent}
                  total={budget.total}
                />
                <button 
                  onClick={() => handleEditBudget(budget)}
                  className="absolute top-2 right-2 p-2 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* View all transactions button */}
          <div className="flex justify-center mt-6">
            <Button 
              variant="link" 
              className="text-green-700 font-medium"
              onClick={() => setViewDialogOpen(true)}
            >
              Ver Todas las Transacciones
            </Button>
          </div>
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
        availableBudgets={budgets.map(budget => budget.name)}
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
