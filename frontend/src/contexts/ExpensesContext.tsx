import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  vendor: string;
  description: string;
  paymentMethod: string;
}

interface ExpensesContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: number) => void;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

// Mock initial data
const initialExpenses: Expense[] = [
  {
    id: 1,
    date: "2025-10-28",
    amount: 45.00,
    category: "Booth Fees",
    vendor: "Downtown Farmers Market",
    description: "Weekly booth rental",
    paymentMethod: "Credit Card",
  },
  {
    id: 2,
    date: "2025-10-27",
    amount: 32.50,
    category: "Supplies",
    vendor: "Office Depot",
    description: "Receipt paper and bags",
    paymentMethod: "Debit Card",
  },
  {
    id: 3,
    date: "2025-10-25",
    amount: 125.00,
    category: "Materials",
    vendor: "Craft Supply Co",
    description: "Raw materials for products",
    paymentMethod: "Credit Card",
  },
  {
    id: 4,
    date: "2025-10-24",
    amount: 18.75,
    category: "Travel",
    vendor: "Gas Station",
    description: "Fuel for market trip",
    paymentMethod: "Cash",
  },
  {
    id: 5,
    date: "2025-10-20",
    amount: 85.00,
    category: "Marketing",
    vendor: "Print Shop",
    description: "Business cards and flyers",
    paymentMethod: "Credit Card",
  },
];

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);

  const addExpense = (newExpense: Omit<Expense, 'id'>) => {
    const expense: Expense = {
      ...newExpense,
      id: Date.now(), // Simple ID generation
    };
    setExpenses(prev => [expense, ...prev]);
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, deleteExpense }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
};
