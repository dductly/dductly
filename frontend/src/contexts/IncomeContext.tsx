import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export interface Income {
  id: string;
  user_id: string;
  income_date: string;
  category: string;
  customer: string;
  market: string;
  description: string;
  payment_method: string;
  amount: number;
  tip: number;
}

interface IncomeContextType {
  incomes: Income[];
  addIncome: (income: Omit<Income, "id" | "user_id">) => Promise<void>;
  updateIncome: (id: string, income: Omit<Income, "id" | "user_id">) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  loading: boolean;
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const IncomeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch incomes when user changes
  useEffect(() => {
    const fetchIncomes = async () => {
      if (!user) {
        setIncomes([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("income")
        .select("*")
        .eq("user_id", user.id)
        .order("income_date", { ascending: false });

      if (error) console.error("Error loading income:", error);
      else setIncomes(data || []);

      setLoading(false);
    };

    fetchIncomes();
  }, [user]);

  const addIncome = async (newIncome: Omit<Income, "id" | "user_id">) => {
    if (!user) return;

    const incomeToInsert = {
      income_date: newIncome.income_date,
      amount: newIncome.amount,
      category: newIncome.category,
      customer: newIncome.customer,
      market: newIncome.market,
      description: newIncome.description,
      payment_method: newIncome.payment_method,
      tip: newIncome.tip || 0,
      user_id: user.id,
    };

    console.log("inserting: ", incomeToInsert)

    const { data, error } = await supabase
      .from("income")
      .insert([incomeToInsert])
      .select()
      .single();

    if (error) console.error("Error adding income:", error);
    else setIncomes((prev) => [data, ...prev]);
  };

  const updateIncome = async (id: string, updatedIncome: Omit<Income, "id" | "user_id">) => {
    if (!user) return;

    const { data, error } = await supabase
      .from("income")
      .update({
        income_date: updatedIncome.income_date,
        amount: updatedIncome.amount,
        category: updatedIncome.category,
        customer: updatedIncome.customer,
        market: updatedIncome.market,
        description: updatedIncome.description,
        payment_method: updatedIncome.payment_method,
        tip: updatedIncome.tip || 0,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) console.error("Error updating income:", error);
    else setIncomes((prev) => prev.map((i) => (i.id === id ? data : i)));
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) console.error("Error deleting income:", error);
    else setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <IncomeContext.Provider value={{ incomes, addIncome, updateIncome, deleteIncome, loading }}>
      {children}
    </IncomeContext.Provider>
  );
};

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) throw new Error("useIncome must be used within an IncomeProvider");
  return context;
};
