/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import type { Attachment } from "../services/storageService";
import {
  FC_TRANSACTIONS_SYNCED_EVENT,
  fcTransactionToExpense,
  isBankLedgerId,
  type FinancialConnectionTransactionRow,
} from "../lib/bankLedgerMapping";

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
  /** Merged from `financial_connection_transactions`; not stored in `expenses` table */
  source?: "manual" | "bank";
  bankMeta?: {
    stripeFcAccountId: string;
    stripeTransactionId: string;
    currency: string;
    status: string | null;
  };
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
  addExpense: (expense: Omit<Expense, "id" | "user_id">) => Promise<Expense | null>;
  updateExpense: (id: string, expense: Omit<Expense, "id" | "user_id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loading: boolean;
  customCategories: string[];
  customPaymentMethods: string[];
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export const ExpensesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [manualExpenses, setManualExpenses] = useState<Expense[]>([]);
  const [bankExpenseRows, setBankExpenseRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const expenses = React.useMemo(() => {
    const merged = [...manualExpenses, ...bankExpenseRows];
    merged.sort((a, b) => b.expense_date.localeCompare(a.expense_date));
    return merged;
  }, [manualExpenses, bankExpenseRows]);

  // Extract custom categories and payment methods from existing expenses
  const customCategories = React.useMemo(() => {
    const usedCategories = new Set(
      manualExpenses.filter((e) => e.source !== "bank").map((e) => e.category).filter(Boolean)
    );
    return Array.from(usedCategories).filter((cat) => !DEFAULT_EXPENSE_CATEGORIES.includes(cat));
  }, [manualExpenses]);

  const customPaymentMethods = React.useMemo(() => {
    const usedMethods = new Set(
      manualExpenses.filter((e) => e.source !== "bank").map((e) => e.payment_method).filter(Boolean)
    );
    return Array.from(usedMethods).filter((method) => !DEFAULT_PAYMENT_METHODS.includes(method));
  }, [manualExpenses]);

  const reloadLedger = useCallback(async () => {
    if (!user) {
      setManualExpenses([]);
      setBankExpenseRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [expRes, fcRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id).order("expense_date", { ascending: false }),
      supabase
        .from("financial_connection_transactions")
        .select(
          "stripe_transaction_id,user_id,stripe_fc_account_id,amount,currency,description,status,transacted_at,posted_at"
        )
        .eq("user_id", user.id)
        .order("transacted_at", { ascending: false }),
    ]);

    if (expRes.error) console.error("Error loading expenses:", expRes.error);
    else setManualExpenses((expRes.data as Expense[]) || []);

    if (fcRes.error) {
      console.error("Error loading bank transactions:", fcRes.error);
      setBankExpenseRows([]);
    } else {
      const rows = (fcRes.data as FinancialConnectionTransactionRow[]) || [];
      const out: Expense[] = [];
      for (const row of rows) {
        const e = fcTransactionToExpense(row);
        if (e) out.push(e);
      }
      setBankExpenseRows(out);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    void reloadLedger();
  }, [reloadLedger]);

  useEffect(() => {
    const onSynced = () => void reloadLedger();
    window.addEventListener(FC_TRANSACTIONS_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(FC_TRANSACTIONS_SYNCED_EVENT, onSynced);
  }, [reloadLedger]);

  const addExpense = async (newExpense: Omit<Expense, "id" | "user_id">): Promise<Expense | null> => {
    if (!user) return null;

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

    console.log("inserting: ", expenseToInsert);

    const { data, error } = await supabase.from("expenses").insert([expenseToInsert]).select().single();

    if (error) {
      console.error("Error adding expense:", error);
      return null;
    }
    setManualExpenses((prev) => [data as Expense, ...prev]);
    return data as Expense;
  };

  const updateExpense = async (id: string, updatedExpense: Omit<Expense, "id" | "user_id">) => {
    if (!user) return;
    if (isBankLedgerId(id)) {
      console.warn("Cannot edit bank-synced transactions from the ledger.");
      return;
    }

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
    else setManualExpenses((prev) => prev.map((e) => (e.id === id ? (data as Expense) : e)));
  };

  const deleteExpense = async (id: string) => {
    if (isBankLedgerId(id)) {
      console.warn("Cannot delete bank-synced transactions from the ledger.");
      return;
    }
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) console.error("Error deleting expense:", error);
    else setManualExpenses((prev) => prev.filter((e) => e.id !== id));
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
