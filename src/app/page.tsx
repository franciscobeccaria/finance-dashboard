"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { BudgetCard } from "@/components/BudgetCard";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import { ViewTransactionsDialog } from "@/components/ViewTransactionsDialog";

// Sample data
const sampleBudgets = [
  { id: "1", name: "Supermercado", spent: 150.75, total: 400 },
  { id: "2", name: "Salidas", spent: 280, total: 300 },
  { id: "3", name: "Delivery", spent: 90.5, total: 150 },
  { id: "4", name: "Transporte", spent: 45, total: 120 },
];

const sampleTransactions = [
  { id: "1", date: new Date(2025, 7, 1), store: "Disco", amount: 78.50, budget: "Supermercado", time: "10:30" },
  { id: "2", date: new Date(2025, 7, 3), store: "Café Martínez", amount: 45.00, budget: "Salidas", time: "14:15" },
  { id: "3", date: new Date(2025, 7, 5), store: "McDonald's", amount: 35.75, budget: "Delivery", time: "20:45" },
  { id: "4", date: new Date(2025, 7, 7), store: "Coto", amount: 72.25, budget: "Supermercado", time: "11:20" },
  { id: "5", date: new Date(2025, 7, 8), store: "Uber", amount: 45.00, budget: "Transporte", time: "17:50" },
];

export default function Home() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Header onAddTransaction={() => setAddDialogOpen(true)} />
        
        <main className="mt-8">
          <h2 className="text-xl font-semibold text-blue-700 mb-4">Mis Presupuestos</h2>
          
          {/* Responsive grid for budget cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {sampleBudgets.map((budget) => (
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
        transactions={sampleTransactions} 
      />
    </div>
  );
}
