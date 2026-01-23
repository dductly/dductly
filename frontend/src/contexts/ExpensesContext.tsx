import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import type { Attachment } from "../services/storageService";

export interface Expense {
  id: string;
  user_id: string;
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  payment_method: string;
  amount: number;
  attachments?: Attachment[];
}

// Default options that come with the app
const DEFAULT_EXPENSE_CATEGORIES = [
  "booth-fees", "supplies", "materials", "equipment", "travel",
  "marketing", "packaging", "utilities", "insurance", "other"
];

const DEFAULT_PAYMENT_METHODS = [
  "cash", "credit-card", "debit-card", "venmo", "check", "bank-transfer", "other"
];

interface ExpensesContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "user_id">) => Promise<void>;
  updateExpense: (id: string, expense: Omit<Expense, "id" | "user_id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loading: boolean;
  customCategories: string[];
  customPaymentMethods: string[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Extract custom categories and payment methods from existing expenses
  const customCategories = React.useMemo(() => {
    const usedCategories = new Set(expenses.map(e => e.category).filter(Boolean));
    return Array.from(usedCategories).filter(cat => !DEFAULT_EXPENSE_CATEGORIES.includes(cat));
  }, [expenses]);

  const customPaymentMethods = React.useMemo(() => {
    const usedMethods = new Set(expenses.map(e => e.payment_method).filter(Boolean));
    return Array.from(usedMethods).filter(method => !DEFAULT_PAYMENT_METHODS.includes(method));
  }, [expenses]);

  // Fetch expenses when user changes
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user) {
        setExpenses([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("expense_date", { ascending: false });

      if (error) console.error("Error loading expenses:", error);
      else setExpenses(data || []);

      setLoading(false);
    };

    fetchExpenses();
  }, [user]);

  const addExpense = async (newExpense: Omit<Expense, "id" | "user_id">) => {
    if (!user) return;

    const expenseToInsert = {
      expense_date: newExpense.expense_date,
      amount: newExpense.amount,
      category: newExpense.category,
      vendor: newExpense.vendor,
      description: newExpense.description,
      payment_method: newExpense.payment_method,
      attachments: newExpense.attachments || [],
      user_id: user.id,
    };

    console.log("inserting: ", expenseToInsert)

    const { data, error } = await supabase
      .from("expenses")
      .insert([expenseToInsert])
      .select()
      .single();

    if (error) console.error("Error adding expense:", error);
    else setExpenses((prev) => [data, ...prev]);
  };

  const updateExpense = async (id: string, updatedExpense: Omit<Expense, "id" | "user_id">) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("expenses")
      .update({
        expense_date: updatedExpense.expense_date,
        amount: updatedExpense.amount,
        category: updatedExpense.category,
        vendor: updatedExpense.vendor,
        description: updatedExpense.description,
        payment_method: updatedExpense.payment_method,
        attachments: updatedExpense.attachments || [],
      })
      .eq("id", id)
      .select()
      .single();

    if (error) console.error("Error updating expense:", error);
    else setExpenses((prev) => prev.map((e) => (e.id === id ? data : e)));
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) console.error("Error deleting expense:", error);
    else setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, updateExpense, deleteExpense, loading, customCategories, customPaymentMethods }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error("useExpenses must be used within an ExpensesProvider");
  return context;
};
