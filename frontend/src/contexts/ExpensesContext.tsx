import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export interface Expense {
  id: string;
  user_id: string;
  expense_date: string;
  category: string;
  vendor: string;
  description: string;
  payment_method: string;
  amount: number;
}

interface ExpensesContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "user_id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loading: boolean;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

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

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) console.error("Error deleting expense:", error);
    else setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <ExpensesContext.Provider value={{ expenses, addExpense, deleteExpense, loading }}>
      {children}
    </ExpensesContext.Provider>
  );
};

export const useExpenses = () => {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error("useExpenses must be used within an ExpensesProvider");
  return context;
};
