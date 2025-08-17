import { create } from 'zustand';
import { fetchAllTransactions, BackendTransaction } from '@/services/api';

interface TransactionStore {
  // Cache de transacciones por mes (key: 'YYYY-MM')
  transactionsByMonth: Record<string, BackendTransaction[]>;
  
  // Estados de carga por mes específico
  loadingByMonth: Record<string, boolean>;
  
  // Fecha seleccionada actual
  selectedDate: Date;
  
  // Error global
  error: string | null;
  
  // Acciones
  setSelectedDate: (date: Date) => void;
  fetchTransactionsForMonth: (accessToken: string, date: Date) => Promise<void>;
  getTransactionsForCurrentMonth: () => BackendTransaction[];
  setError: (error: string | null) => void;
  clearCache: () => void;
  getCurrentMonthKey: () => string;
  isCurrentMonthLoading: () => boolean;
  addTransactionToCache: (transaction: BackendTransaction, date: Date) => void;
  removeTransactionFromCache: (transactionId: string, date: Date) => void;
}

// Helper function to generate month key
const getMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to get date range for a month
const getDateRange = (date: Date) => {
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1); // First day of month
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
  return { startDate, endDate };
};

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  // Estado inicial
  transactionsByMonth: {},
  loadingByMonth: {},
  selectedDate: new Date(),
  error: null,

  // Setear fecha seleccionada
  setSelectedDate: (date: Date) => {
    set({ selectedDate: date });
  },

  // Obtener key del mes actual
  getCurrentMonthKey: () => {
    const { selectedDate } = get();
    return getMonthKey(selectedDate);
  },

  // Verificar si el mes actual está cargando
  isCurrentMonthLoading: () => {
    const { loadingByMonth } = get();
    const monthKey = get().getCurrentMonthKey();
    return loadingByMonth[monthKey] || false;
  },

  // Obtener transacciones del mes actual
  getTransactionsForCurrentMonth: () => {
    const { transactionsByMonth } = get();
    const monthKey = get().getCurrentMonthKey();
    return transactionsByMonth[monthKey] || [];
  },

  // Fetch transacciones para un mes específico (con cache inteligente)
  fetchTransactionsForMonth: async (accessToken: string, date: Date) => {
    const monthKey = getMonthKey(date);
    const { transactionsByMonth, loadingByMonth } = get();

    // Si ya tenemos datos para este mes, no hacer request
    if (transactionsByMonth[monthKey]) {
      return;
    }

    // Si ya está cargando este mes, evitar duplicados
    if (loadingByMonth[monthKey]) {
      return;
    }

    
    // Setear loading state para este mes
    set(state => ({
      loadingByMonth: { ...state.loadingByMonth, [monthKey]: true },
      error: null
    }));

    try {
      const { startDate, endDate } = getDateRange(date);
      const transactionData = await fetchAllTransactions(accessToken, startDate, endDate);
      
      
      // Guardar en cache
      set(state => ({
        transactionsByMonth: {
          ...state.transactionsByMonth,
          [monthKey]: transactionData
        },
        loadingByMonth: { ...state.loadingByMonth, [monthKey]: false }
      }));
      
    } catch (error) {
      console.error(`❌ Store: Error fetching transactions for ${monthKey}:`, error);
      
      // Setear error y limpiar loading
      set(state => ({
        error: error instanceof Error ? error.message : 'Error loading transactions',
        loadingByMonth: { ...state.loadingByMonth, [monthKey]: false }
      }));
    }
  },

  // Setear error
  setError: (error: string | null) => {
    set({ error });
  },

  // Limpiar cache (útil para testing o logout)
  clearCache: () => {
    set({
      transactionsByMonth: {},
      loadingByMonth: {},
      error: null
    });
  },

  // Agregar transacción al cache de un mes específico
  addTransactionToCache: (transaction: BackendTransaction, date: Date) => {
    const monthKey = getMonthKey(date);
    const { transactionsByMonth } = get();
    
    // Solo agregar si ya tenemos datos para ese mes en cache
    if (transactionsByMonth[monthKey]) {
      set(state => ({
        transactionsByMonth: {
          ...state.transactionsByMonth,
          [monthKey]: [transaction, ...state.transactionsByMonth[monthKey]]
        }
      }));
    }
  },

  // Remover transacción del cache de un mes específico
  removeTransactionFromCache: (transactionId: string, date: Date) => {
    const monthKey = getMonthKey(date);
    const { transactionsByMonth } = get();
    
    // Solo remover si ya tenemos datos para ese mes en cache
    if (transactionsByMonth[monthKey]) {
      set(state => ({
        transactionsByMonth: {
          ...state.transactionsByMonth,
          [monthKey]: state.transactionsByMonth[monthKey].filter(t => t.id !== transactionId)
        }
      }));
    }
  }
}));