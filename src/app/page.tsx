"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { BudgetCard } from "@/components/BudgetCard";
import { TotalBudgetCard } from "@/components/TotalBudgetCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { ViewTransactionsDialog } from "@/components/ViewTransactionsDialog";
import { fetchTransactions, ParsedTransaction } from "@/services/api";

// Interface for the budget data structure used in the UI
interface Budget {
  id: string;
  name: string;
  spent: number;
  total: number;
}

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
  
  // State for API data
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for categorized transactions and budget calculation
  const [uiTransactions, setUiTransactions] = useState<UITransaction[]>([]);
  
  // Calculate budgets based on categorized transactions
  const budgets = useMemo<Budget[]>(() => {
    // Start with predefined budgets (with zero spent)
    const workingBudgets = [...predefinedBudgets];
    
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
  }, [uiTransactions]);

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
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Mis Presupuestos</h2>
          
          {/* Total Budget Summary Card */}
          {!isLoading && !error && (
            <div className="mb-6">
              <TotalBudgetCard
                spent={budgets.reduce((sum, budget) => sum + budget.spent, 0)}
                total={budgets.reduce((sum, budget) => sum + budget.total, 0)}
              />
            </div>
          )}
          
          {/* Responsive grid for budget cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {budgets.length === 0 && !isLoading && !error && (
              <div className="col-span-full text-center py-8 text-gray-500">
                No se encontraron presupuestos
              </div>
            )}
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                name={budget.name}
                spent={budget.spent}
                total={budget.total}
              />
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
      />
    </div>
  );
}
