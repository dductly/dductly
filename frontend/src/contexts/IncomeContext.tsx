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
import { hasBillingApiBaseUrl } from "../services/billingService";
import {
  fetchLinkedFinancialAccounts,
  formatLinkedFinancialAccountLabel,
} from "../services/financialConnectionsService";
import type { Attachment } from "../services/storageService";
import {
  FC_TRANSACTIONS_SYNCED_EVENT,
  fcTransactionToIncome,
  isBankLedgerId,
  type FinancialConnectionTransactionRow,
} from "../lib/bankLedgerMapping";

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
  attachments?: Attachment[];
  /** Merged from `financial_connection_transactions`; not stored in `income` table */
  source?: "manual" | "bank";
  bankMeta?: {
    stripeFcAccountId: string;
    stripeTransactionId: string;
    currency: string;
    status: string | null;
    linkedAccountLabel?: string;
  };
}

// Default options that come with the app
const DEFAULT_INCOME_CATEGORIES = [
  "product-sales", "services", "consulting", "grants", "investments",
  "refunds", "commissions", "royalties", "other"
];

const DEFAULT_PAYMENT_METHODS = [
  "cash", "credit-card", "debit-card", "venmo", "check", "bank-transfer", "other"
];

interface IncomeContextType {
  incomes: Income[];
  addIncome: (income: Omit<Income, "id" | "user_id">) => Promise<Income | null>;
  updateIncome: (id: string, income: Omit<Income, "id" | "user_id">) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  loading: boolean;
  customCategories: string[];
  customPaymentMethods: string[];
}

const IncomeContext = createContext<IncomeContextType | undefined>(undefined);

export const IncomeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, session } = useAuth();
  const [manualIncomes, setManualIncomes] = useState<Income[]>([]);
  const [bankIncomeRows, setBankIncomeRows] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  const incomes = React.useMemo(() => {
    const merged = [...manualIncomes, ...bankIncomeRows];
    merged.sort((a, b) => b.income_date.localeCompare(a.income_date));
    return merged;
  }, [manualIncomes, bankIncomeRows]);

  // Extract custom categories and payment methods from existing income
  const customCategories = React.useMemo(() => {
    const usedCategories = new Set(
      manualIncomes.filter((i) => i.source !== "bank").map((i) => i.category).filter(Boolean)
    );
    return Array.from(usedCategories).filter((cat) => !DEFAULT_INCOME_CATEGORIES.includes(cat));
  }, [manualIncomes]);

  const customPaymentMethods = React.useMemo(() => {
    const usedMethods = new Set(
      manualIncomes.filter((i) => i.source !== "bank").map((i) => i.payment_method).filter(Boolean)
    );
    return Array.from(usedMethods).filter((method) => !DEFAULT_PAYMENT_METHODS.includes(method));
  }, [manualIncomes]);

  const reloadLedger = useCallback(async () => {
    if (!user) {
      setManualIncomes([]);
      setBankIncomeRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const token = session?.access_token;

    const [incRes, fcRes] = await Promise.all([
      supabase.from("income").select("*").eq("user_id", user.id).order("income_date", { ascending: false }),
      supabase
        .from("financial_connection_transactions")
        .select(
          "stripe_transaction_id,user_id,stripe_fc_account_id,amount,currency,description,status,transacted_at,posted_at,ledger_source,linked_account_label"
        )
        .eq("user_id", user.id)
        .order("transacted_at", { ascending: false }),
    ]);

    if (incRes.error) console.error("Error loading income:", incRes.error);
    else setManualIncomes((incRes.data as Income[]) || []);

    if (fcRes.error) {
      console.error("Error loading bank transactions:", fcRes.error);
      setBankIncomeRows([]);
    } else {
      const rows = (fcRes.data as FinancialConnectionTransactionRow[]) || [];
      const out: Income[] = [];
      for (const row of rows) {
        const inc = fcTransactionToIncome(row);
        if (!inc) continue;
        out.push(inc);
      }
      setBankIncomeRows(out);
    }

    setLoading(false);

    if (token && hasBillingApiBaseUrl()) {
      void (async () => {
        try {
          const accounts = await fetchLinkedFinancialAccounts(token);
          const accountLabelById = new Map(
            accounts.map((a) => [a.id, formatLinkedFinancialAccountLabel(a)] as const)
          );
          setBankIncomeRows((prev) =>
            prev.map((i) => {
              const meta = i.bankMeta;
              if (!meta?.stripeFcAccountId) return i;
              if (meta.linkedAccountLabel) return i;
              const label = accountLabelById.get(meta.stripeFcAccountId);
              if (!label) return i;
              return { ...i, bankMeta: { ...meta, linkedAccountLabel: label } };
            })
          );
        } catch {
          /* labels optional */
        }
      })();
    }
  }, [user, session?.access_token]);

  useEffect(() => {
    void reloadLedger();
  }, [reloadLedger]);

  useEffect(() => {
    const onSynced = () => void reloadLedger();
    window.addEventListener(FC_TRANSACTIONS_SYNCED_EVENT, onSynced);
    return () => window.removeEventListener(FC_TRANSACTIONS_SYNCED_EVENT, onSynced);
  }, [reloadLedger]);

  const addIncome = async (newIncome: Omit<Income, "id" | "user_id">): Promise<Income | null> => {
    if (!user) return null;

    const incomeToInsert = {
      income_date: newIncome.income_date,
      amount: newIncome.amount,
      category: newIncome.category,
      customer: newIncome.customer,
      market: newIncome.market,
      description: newIncome.description,
      payment_method: newIncome.payment_method,
      tip: newIncome.tip || 0,
      attachments: newIncome.attachments || [],
      user_id: user.id,
    };

    console.log("inserting: ", incomeToInsert);

    const { data, error } = await supabase.from("income").insert([incomeToInsert]).select().single();

    if (error) {
      console.error("Error adding income:", error);
      return null;
    }
    setManualIncomes((prev) => [data as Income, ...prev]);
    return data as Income;
  };

  const updateIncome = async (id: string, updatedIncome: Omit<Income, "id" | "user_id">) => {
    if (!user) return;
    if (isBankLedgerId(id)) {
      console.warn("Cannot edit bank-synced transactions from the ledger.");
      return;
    }

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
        attachments: updatedIncome.attachments || [],
      })
      .eq("id", id)
      .select()
      .single();

    if (error) console.error("Error updating income:", error);
    else setManualIncomes((prev) => prev.map((i) => (i.id === id ? (data as Income) : i)));
  };

  const deleteIncome = async (id: string) => {
    if (isBankLedgerId(id)) {
      console.warn("Cannot delete bank-synced transactions from the ledger.");
      return;
    }
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) console.error("Error deleting income:", error);
    else setManualIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <IncomeContext.Provider value={{ incomes, addIncome, updateIncome, deleteIncome, loading, customCategories, customPaymentMethods }}>
      {children}
    </IncomeContext.Provider>
  );
};

export const useIncome = () => {
  const context = useContext(IncomeContext);
  if (!context) throw new Error("useIncome must be used within an IncomeProvider");
  return context;
};
