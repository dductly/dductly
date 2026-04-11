import type { Expense } from "../contexts/ExpensesContext";
import type { Income } from "../contexts/IncomeContext";

/** Supabase row shape for `financial_connection_transactions` */
export type FinancialConnectionTransactionRow = {
  stripe_transaction_id: string;
  user_id: string;
  stripe_fc_account_id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: string | null;
  transacted_at: string | null;
  posted_at?: string | null;
};

const BANK_CATEGORY = "bank-sync";

const BANK_LEDGER_ID_PREFIX = "fc-";

/** Dispatched after FC transactions are written to Supabase (e.g. post-link API sync). */
export const FC_TRANSACTIONS_SYNCED_EVENT = "dductly-fc-transactions-synced" as const;

export function isBankLedgerId(id: string): boolean {
  return id.startsWith(BANK_LEDGER_ID_PREFIX);
}

function toLocalYmd(iso: string | null | undefined): string {
  if (!iso) {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function amountCentsToMajor(cents: number): number {
  return Math.round(Math.abs(Number(cents))) / 100;
}

/**
 * Negative Stripe FC amounts = money out → expense row.
 */
export function fcTransactionToExpense(row: FinancialConnectionTransactionRow): Expense | null {
  const cents = Number(row.amount);
  if (cents >= 0) return null;

  const desc = (row.description || "").trim() || "Bank transaction";
  const vendor = desc.length > 80 ? `${desc.slice(0, 77)}…` : desc;

  return {
    id: `${BANK_LEDGER_ID_PREFIX}${row.stripe_transaction_id}`,
    user_id: row.user_id,
    expense_date: toLocalYmd(row.transacted_at ?? row.posted_at),
    category: BANK_CATEGORY,
    vendor,
    description: desc,
    payment_method: "bank-transfer",
    amount: amountCentsToMajor(cents),
    attachments: undefined,
    source: "bank",
    bankMeta: {
      stripeFcAccountId: row.stripe_fc_account_id,
      stripeTransactionId: row.stripe_transaction_id,
      currency: row.currency,
      status: row.status,
    },
  };
}

/**
 * Positive Stripe FC amounts = money in → income row.
 */
export function fcTransactionToIncome(row: FinancialConnectionTransactionRow): Income | null {
  const cents = Number(row.amount);
  if (cents <= 0) return null;

  const desc = (row.description || "").trim() || "Bank transaction";

  return {
    id: `${BANK_LEDGER_ID_PREFIX}${row.stripe_transaction_id}`,
    user_id: row.user_id,
    income_date: toLocalYmd(row.transacted_at ?? row.posted_at),
    category: BANK_CATEGORY,
    customer: "—",
    market: "",
    description: desc,
    payment_method: "bank-transfer",
    amount: amountCentsToMajor(cents),
    tip: 0,
    attachments: undefined,
    source: "bank",
    bankMeta: {
      stripeFcAccountId: row.stripe_fc_account_id,
      stripeTransactionId: row.stripe_transaction_id,
      currency: row.currency,
      status: row.status,
    },
  };
}
