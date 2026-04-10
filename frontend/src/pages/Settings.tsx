import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { useInactivity } from "../hooks/useInactivity";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { TIMEOUT_OPTIONS } from "../contexts/InactivityContext";
import editIcon from "../img/pencil-edit.svg";
import recycleIcon from "../img/recycle.svg";
import openEyeIcon from "../img/open-eye.svg";
import closedEyeIcon from "../img/closed-eye.svg";
import { supabase } from "../lib/supabaseClient";
import {
  FREE_FOR_LIFE_DISPLAY_NAME,
  PROFILE_SUBSCRIPTION_FREE_TRIAL,
  PROFILE_SUBSCRIPTION_STANDARD_MONTHLY,
  PROFILE_SUBSCRIPTION_STANDARD_YEARLY,
  PROFILE_SUBSCRIPTION_TIER_FREE_FOR_LIFE,
  STANDARD_SUBSCRIPTION_CARD,
} from "../constants/subscriptionMarketing";

function isProfileFreeForLifeTier(tier: string | null | undefined): boolean {
  if (tier == null || tier === "") return false;
  return tier.trim().toLowerCase() === PROFILE_SUBSCRIPTION_TIER_FREE_FOR_LIFE;
}

function normalizeProfileTier(tier: string | null | undefined): string | null {
  if (tier == null || tier === "") return null;
  return tier.trim().toLowerCase();
}
import { cleanupBilling, hasBillingApiBaseUrl } from "../services/billingService";
import {
  disconnectFinancialAccount,
  fetchLinkedFinancialAccounts,
  type LinkedFinancialAccount,
} from "../services/financialConnectionsService";
import BankConnectionModal from "../components/BankConnectionModal";

function formatBankSubcategory(sub: string | null): string {
  if (!sub) return "";
  return sub
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const DISPLAY_TRIAL_DAYS = Number(import.meta.env.VITE_STRIPE_TRIAL_DAYS || 14);

interface SettingsProps {
  onNavigate: (page: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
  const { user, session, updateProfile, updateAutoLogoutTimeout, updatePassword, refreshSession, signOut } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { currentTimeoutMinutes } = useInactivity();
  const { expenses } = useExpenses();
  const { incomes } = useIncome();
  const [savingTimeout, setSavingTimeout] = useState(false);
  const [emailChangeNotice, setEmailChangeNotice] = useState(false);

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete = deleteConfirmText === "DELETE" && deleteReason.trim().length > 0;

  const handleDeleteAccount = async () => {
    if (!canDelete || !user) return;

    setDeleteLoading(true);
    setDeleteError(null);

    try {
      // If this deletion was initiated from the "cancel free trial" flow,
      // remove billing info from Stripe first (best-effort).
      if (cancelFlowExportThenDelete) {
        const token = session?.access_token;
        if (token) {
          try {
            await cleanupBilling(token);
          } catch (e) {
            console.warn("Stripe cleanup failed:", e);
          }
        }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY as string;

      if (!supabaseUrl || !anonKey) {
        throw new Error("Missing configuration");
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          userId: user.id,
          reason: deleteReason.trim(),
          email: user.email,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete account");
      }

      // Sign out and redirect to home
      await signOut();
      onNavigate("signin");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleteLoading(false);
    }
  };

  const openDeleteModalForCancelFlow = () => {
    setIsExporting(false);
    setCancelConfirmOpen(false);
    setCancelSubscriptionError(null);
    setDeleteError(null);
    // Prefill a reason but still require the user to type DELETE.
    setDeleteReason("Canceled free trial and exported data");
    setDeleteConfirmText("");
    setIsDeleting(true);
  };

  const handleCloseDelete = () => {
    setIsDeleting(false);
    setDeleteConfirmText("");
    setDeleteReason("");
    setDeleteError(null);
    setCancelFlowExportThenDelete(false);
  };

  // Export modal state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSelections, setExportSelections] = useState({
    expenses: false,
    income: false,
    statistics: false,
  });

  const toggleExportSelection = (key: 'expenses' | 'income' | 'statistics') => {
    setExportSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const hasExportSelection = exportSelections.expenses || exportSelections.income || exportSelections.statistics;

  const handleCloseExport = () => {
    setIsExporting(false);
    setExportSelections({ expenses: false, income: false, statistics: false });
  };

  const downloadSelected = async () => {
    if (exportSelections.expenses) exportExpenses();
    if (exportSelections.income) exportIncome();
    if (exportSelections.statistics) exportStatistics();
    handleCloseExport();

    // If the user initiated "cancel during trial", show the standard delete modal next.
    if (cancelFlowExportThenDelete) {
      openDeleteModalForCancelFlow();
    }
  };

  // Get business name for filenames
  const businessName = user?.user_metadata?.business_name || "MyBusiness";
  const sanitizedBusinessName = businessName.replace(/[^a-zA-Z0-9]/g, "_");

  const [subscription, setSubscription] = useState<any | null>(null);
  const [, setSubscriptionLoading] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  /** Value from `profiles.subscription` (e.g. `free_for_life`). */
  const [profileSubscription, setProfileSubscription] = useState<string | null>(null);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [cancelSubscriptionError, setCancelSubscriptionError] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelFlowExportThenDelete, setCancelFlowExportThenDelete] = useState(false);
  const [bankConnectionModalOpen, setBankConnectionModalOpen] = useState(false);
  const [linkedBankAccounts, setLinkedBankAccounts] = useState<LinkedFinancialAccount[]>([]);
  const [linkedBanksLoading, setLinkedBanksLoading] = useState(false);
  const [linkedBanksError, setLinkedBanksError] = useState<string | null>(null);
  const [disconnectingAccountId, setDisconnectingAccountId] = useState<string | null>(null);
  const [bankDisconnectConfirm, setBankDisconnectConfirm] = useState<{
    accountId: string;
    label: string;
  } | null>(null);
  const [bankDisconnectError, setBankDisconnectError] = useState<string | null>(null);

  const refreshLinkedBankAccounts = React.useCallback(async () => {
    const token = session?.access_token;
    if (!user?.id || !token || !hasBillingApiBaseUrl()) {
      setLinkedBankAccounts([]);
      setLinkedBanksError(null);
      setLinkedBanksLoading(false);
      return;
    }
    setLinkedBanksLoading(true);
    setLinkedBanksError(null);
    try {
      const accounts = await fetchLinkedFinancialAccounts(token);
      setLinkedBankAccounts(accounts);
    } catch (e) {
      setLinkedBanksError(e instanceof Error ? e.message : "Could not load linked banks");
      setLinkedBankAccounts([]);
    } finally {
      setLinkedBanksLoading(false);
    }
  }, [user?.id, session?.access_token]);

  React.useEffect(() => {
    void refreshLinkedBankAccounts();
  }, [refreshLinkedBankAccounts]);

  const requestDisconnectBank = (accountId: string, label: string) => {
    setBankDisconnectError(null);
    setBankDisconnectConfirm({ accountId, label });
  };

  const cancelBankDisconnectConfirm = () => {
    setBankDisconnectConfirm(null);
    setBankDisconnectError(null);
  };

  const confirmDisconnectBank = async () => {
    if (!session?.access_token || !bankDisconnectConfirm) return;
    const { accountId } = bankDisconnectConfirm;
    setDisconnectingAccountId(accountId);
    setBankDisconnectError(null);
    try {
      await disconnectFinancialAccount(session.access_token, accountId);
      setBankDisconnectConfirm(null);
      await refreshLinkedBankAccounts();
    } catch (e) {
      setBankDisconnectError(e instanceof Error ? e.message : "Could not remove account");
    } finally {
      setDisconnectingAccountId(null);
    }
  };

  React.useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      setSubscriptionLoading(true);
      setSubscriptionError(null);
      setSubscription(null);
      setProfileSubscription(null);

      const [subResult, profileResult] = await Promise.all([
        supabase
          .from("billing_subscriptions")
          .select(
            "user_id,stripe_customer_id,stripe_subscription_id,status,plan,price_id,current_period_end,trial_end,cancel_at_period_end,canceled_at,updated_at"
          )
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("profiles").select("subscription").eq("id", user.id).maybeSingle(),
      ]);

      if (subResult.error) {
        setSubscriptionError(subResult.error.message);
        setSubscription(null);
      } else {
        setSubscription(subResult.data);
      }

      if (profileResult.error) {
        console.warn("profiles.subscription:", profileResult.error.message);
        setProfileSubscription(null);
      } else {
        setProfileSubscription(profileResult.data?.subscription ?? null);
      }

      setSubscriptionLoading(false);
    };

    void run();
  }, [user?.id]);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString();
  };

  const billingLabel = subscription?.status
    ? `Stripe (${subscription.status})`
    : subscriptionError
      ? "Stripe (unavailable)"
      : "Stripe";

  const billingCadence = subscription?.plan === "yearly" ? "yearly" : subscription?.plan === "monthly" ? "monthly" : null;
  const cadenceLabel = billingCadence ? `Billed ${billingCadence}` : "Billing";
  const standardTitle = STANDARD_SUBSCRIPTION_CARD.title;
  const priceLabel =
    billingCadence === "yearly"
      ? `${STANDARD_SUBSCRIPTION_CARD.yearly.price}${STANDARD_SUBSCRIPTION_CARD.yearly.period}`
      : billingCadence === "monthly"
        ? `${STANDARD_SUBSCRIPTION_CARD.monthly.price}${STANDARD_SUBSCRIPTION_CARD.monthly.period}`
        : "-";

  const isFreeForLifeFromProfile = isProfileFreeForLifeTier(profileSubscription);
  const profileTier = normalizeProfileTier(profileSubscription);
  const isFreeTrialFromProfile = profileTier === PROFILE_SUBSCRIPTION_FREE_TRIAL;
  const isStandardMonthlyFromProfile = profileTier === PROFILE_SUBSCRIPTION_STANDARD_MONTHLY;
  const isStandardYearlyFromProfile = profileTier === PROFILE_SUBSCRIPTION_STANDARD_YEARLY;

  const subscriptionDisplayTitle = isFreeForLifeFromProfile
    ? FREE_FOR_LIFE_DISPLAY_NAME
    : isFreeTrialFromProfile
      ? `${standardTitle} — free trial`
      : isStandardYearlyFromProfile
        ? `${standardTitle} — billed yearly`
        : isStandardMonthlyFromProfile
          ? `${standardTitle} — billed monthly`
          : billingCadence
            ? `${standardTitle} — billed ${billingCadence}`
            : standardTitle;
  const priceDisplay = isFreeForLifeFromProfile ? "Free" : priceLabel;
  const billingStatusRowLabel = isFreeForLifeFromProfile ? "Billing" : cadenceLabel;
  const billingStatusRowValue = isFreeForLifeFromProfile ? "—" : billingLabel;

  const estimatedTrialEnd =
    subscription?.trial_end ??
    (subscription?.status === "pending" && subscription?.updated_at
      ? new Date(new Date(subscription.updated_at).getTime() + DISPLAY_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString()
      : null);

  const activeTrialEnd = (() => {
    if (!estimatedTrialEnd) return null;
    const d = new Date(estimatedTrialEnd);
    if (Number.isNaN(d.getTime())) return null;
    return d.getTime() > Date.now() ? d.toISOString() : null;
  })();

  const canCancelNow = !Boolean(subscription?.cancel_at_period_end);

  // Format date for filenames
  const getDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  // Download CSV helper
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export expenses
  const exportExpenses = () => {
    if (expenses.length === 0) {
      return;
    }

    const headers = ["Date", "Description", "Category", "Payment Method", "Amount"];
    const rows = expenses.map((expense) => [
      expense.expense_date,
      `"${expense.description.replace(/"/g, '""')}"`,
      expense.category,
      expense.payment_method,
      expense.amount.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadCSV(csv, `${sanitizedBusinessName}_Expenses_${getDateString()}.csv`);
  };

  // Export income
  const exportIncome = () => {
    if (incomes.length === 0) {
      return;
    }

    const headers = ["Date", "Description", "Category", "Payment Method", "Amount"];
    const rows = incomes.map((income) => [
      income.income_date,
      `"${income.description.replace(/"/g, '""')}"`,
      income.category,
      income.payment_method,
      income.amount.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    downloadCSV(csv, `${sanitizedBusinessName}_Income_${getDateString()}.csv`);
  };

  // Export statistics summary
  const exportStatistics = () => {
    if (expenses.length === 0 && incomes.length === 0) {
      alert("No data to export");
      return;
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    // Expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // Income by category
    const incomesByCategory: Record<string, number> = {};
    incomes.forEach((i) => {
      incomesByCategory[i.category] = (incomesByCategory[i.category] || 0) + i.amount;
    });

    // Build CSV content
    let csv = "STATISTICS SUMMARY\n";
    csv += `Generated,${new Date().toLocaleDateString()}\n`;
    csv += `Business,${businessName}\n\n`;

    csv += "OVERVIEW\n";
    csv += `Revenue,$${totalIncome.toFixed(2)}\n`;
    csv += `Total Expenses,$${totalExpenses.toFixed(2)}\n`;
    csv += `Net Profit,$${netProfit.toFixed(2)}\n`;
    csv += `Revenue Entries,${incomes.length}\n`;
    csv += `Total Expense Entries,${expenses.length}\n\n`;

    if (Object.keys(expensesByCategory).length > 0) {
      csv += "EXPENSES BY CATEGORY\n";
      csv += "Category,Amount,Percentage\n";
      Object.entries(expensesByCategory)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, amount]) => {
          const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : "0";
          csv += `${category},$${amount.toFixed(2)},${pct}%\n`;
        });
      csv += "\n";
    }

    if (Object.keys(incomesByCategory).length > 0) {
      csv += "INCOME BY CATEGORY\n";
      csv += "Category,Amount,Percentage\n";
      Object.entries(incomesByCategory)
        .sort(([, a], [, b]) => b - a)
        .forEach(([category, amount]) => {
          const pct = totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : "0";
          csv += `${category},$${amount.toFixed(2)},${pct}%\n`;
        });
    }

    downloadCSV(csv, `${sanitizedBusinessName}_Statistics_${getDateString()}.csv`);
  };

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Password validation checks (same as signup)
  const passwordChecks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);
  const passwordsMatch = newPassword === confirmNewPassword;
  const canChangePassword = isPasswordValid && passwordsMatch && newPassword.length > 0;

  const sendNotificationEmail = (type: 'password_changed' | 'email_changed', email: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_PUBLIC_KEY as string;
    if (!supabaseUrl || !anonKey) return;

    fetch(`${supabaseUrl}/functions/v1/send-notification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        email,
        type,
        firstName: user?.user_metadata?.first_name || "",
      }),
    }).catch(() => {
      // Fire-and-forget: don't block UI on notification email failures
    });
  };

  const handleChangePassword = async () => {
    if (!canChangePassword) return;

    setPasswordLoading(true);
    setPasswordError(null);

    const { error } = await updatePassword(newPassword);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      // Send notification email
      if (user?.email) {
        sendNotificationEmail('password_changed', user.email);
      }
      setTimeout(() => {
        setIsChangingPassword(false);
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordSuccess(false);
      }, 2000);
    }

    setPasswordLoading(false);
  };

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError(null);
    setPasswordSuccess(false);
  };
  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.user_metadata?.first_name || "",
    lastName: user?.user_metadata?.last_name || "",
    email: user?.email || "",
    businessName: user?.user_metadata?.business_name || "",
    productsSold: user?.user_metadata?.products_sold || "",
    farmersMarkets: user?.user_metadata?.farmers_markets || "",
    country: user?.user_metadata?.country || "",
    currency: user?.user_metadata?.currency || "USD",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEditClick = () => {
    setProfileForm({
      firstName: user?.user_metadata?.first_name || "",
      lastName: user?.user_metadata?.last_name || "",
      email: user?.email || "",
      businessName: user?.user_metadata?.business_name || "",
      productsSold: user?.user_metadata?.products_sold || "",
      farmersMarkets: user?.user_metadata?.farmers_markets || "",
      country: user?.user_metadata?.country || "",
      currency: user?.user_metadata?.currency || "USD",
    });
    setIsEditing(true);
    setError(null);
    setSuccess(false);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    const emailChanged = profileForm.email !== user?.email;

    const { error } = await updateProfile(
      profileForm.firstName,
      profileForm.lastName,
      profileForm.email,
      profileForm.businessName,
      profileForm.productsSold,
      profileForm.farmersMarkets,
      profileForm.country,
      profileForm.currency,
    );

    if (error) {
      setError(error.message);
    } else {
      setIsEditing(false);
      setSuccess(true);
      if (emailChanged && user?.email) {
        // Send notification to the old email address
        sendNotificationEmail('email_changed', user.email);
        setEmailChangeNotice(true);
      } else {
        window.location.reload();
      }
    }

    setLoading(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="page">
      <section className="section">
        <div className="settings-container">
          <div className="settings-header">
            <button
              className="back-button"
              onClick={() => onNavigate('home')}
              aria-label="Go back to dashboard"
            >
              ← Back to Dashboard
            </button>
            <h1 className="section-title">Settings</h1>
            <p className="section-subtitle">
              Manage your account and preferences
            </p>
          </div>

          {success && (
            <div className="success-banner">
              Profile updated successfully!
            </div>
          )}

          <div className="settings-grid">
            {/* Account Information */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Account Information</h2>
                <button
                  className="icon-btn"
                  onClick={handleEditClick}
                  aria-label="Edit profile"
                >
                  <img src={editIcon} alt="Edit" className="edit-icon" />
                </button>
              </div>
              <div className="settings-card-content">
                <div className="settings-row">
                  <span className="settings-label">First Name</span>
                  <span className="settings-value">{user?.user_metadata?.first_name || '-'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Last Name</span>
                  <span className="settings-value">{user?.user_metadata?.last_name || '-'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Email</span>
                  <span className="settings-value">{user?.email}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Business Name</span>
                  <span className="settings-value">{user?.user_metadata?.business_name || '-'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Country</span>
                  <span className="settings-value">{user?.user_metadata?.country || '-'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Currency</span>
                  <span className="settings-value">{user?.user_metadata?.currency || 'USD'}</span>
                </div>
                <div className="settings-hint">
                  Changed your email?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); refreshSession(); }}
                    className="settings-link"
                  >
                    Click here to refresh
                  </a>
                </div>
              </div>
            </div>

            {/* Business Details */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Business Details</h2>
                <button
                  className="icon-btn"
                  onClick={handleEditClick}
                  aria-label="Edit business details"
                >
                  <img src={editIcon} alt="Edit" className="edit-icon" />
                </button>
              </div>
              <div className="settings-card-content">
                <div className="settings-row">
                  <span className="settings-label">Products & Services</span>
                  <span className="settings-value">{user?.user_metadata?.products_sold || '-'}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Platforms & Locations</span>
                  <span className="settings-value">{user?.user_metadata?.farmers_markets || '-'}</span>
                </div>
              </div>
            </div>

            {/* Subscription (visual-only) */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Subscription</h2>
              </div>
              <div className="settings-card-content">
                <div className="settings-row">
                  <span className="settings-label">Subscription</span>
                  <span className="settings-value">{subscriptionDisplayTitle}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">Price</span>
                  <span className="settings-value">{priceDisplay}</span>
                </div>
                <div className="settings-row">
                  <span className="settings-label">{billingStatusRowLabel}</span>
                  <span className="settings-value">{billingStatusRowValue}</span>
                </div>
                {activeTrialEnd && !isFreeForLifeFromProfile && (
                  <div className="settings-row" style={{ alignItems: "center" }}>
                    <span className="settings-label">Free trial ends on</span>
                    <span
                      className="settings-value"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                        width: "100%",
                      }}
                    >
                      <span>{formatDate(activeTrialEnd)}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
                        {!cancelConfirmOpen ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-small settings-danger-btn"
                            onClick={() => setCancelConfirmOpen(true)}
                          disabled={!canCancelNow || cancelingSubscription}
                          >
                            Cancel free trial
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-small settings-danger-btn"
                            disabled={!canCancelNow || cancelingSubscription}
                              onClick={async () => {
                                try {
                                  setCancelSubscriptionError(null);
                                  setCancelingSubscription(true);
                                  const token = session?.access_token;
                                  if (!token) throw new Error("Missing session");

                                // Start export->delete flow. Stripe cleanup happens right before deletion.
                                  setCancelFlowExportThenDelete(true);
                                  setIsExporting(true);

                                  setCancelConfirmOpen(false);
                                } catch (e) {
                                  setCancelSubscriptionError(
                                    e instanceof Error ? e.message : "Failed to cancel free trial"
                                  );
                                } finally {
                                  setCancelingSubscription(false);
                                }
                              }}
                            >
                              {cancelingSubscription ? "Canceling…" : "Are you sure?"}
                            </button>
                            <button
                              type="button"
                            className="btn btn-small settings-soft-btn"
                              onClick={() => setCancelConfirmOpen(false)}
                              disabled={cancelingSubscription}
                            >
                              Keep trial
                            </button>
                          </>
                        )}
                      </span>
                    </span>
                  </div>
                )}

                {cancelSubscriptionError && (
                  <div className="settings-hint" style={{ color: "var(--text-medium, #666)" }}>
                    {cancelSubscriptionError}
                  </div>
                )}
              </div>
            </div>

            {/* Bank connections (Stripe Financial Connections) */}
            <div className="settings-card settings-card--bank-connect">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Bank connections</h2>
              </div>
              <div className="settings-card-content">
                <p
                  className="settings-hint"
                  style={{ marginBottom: "12px", lineHeight: 1.5, paddingLeft: 24, paddingRight: 24 }}
                >
                  Link your business bank accounts securely through Stripe to sync transactions and balances. Automatic
                  entry import into dductly is coming soon; linked accounts are stored with your Stripe customer.
                </p>
                {linkedBanksLoading && (
                  <p className="settings-hint" style={{ marginBottom: "12px", paddingLeft: 24, paddingRight: 24 }}>
                    Loading linked accounts…
                  </p>
                )}
                {linkedBanksError && (
                  <p
                    className="settings-hint"
                    style={{ marginBottom: "12px", color: "#c33", paddingLeft: 24, paddingRight: 24 }}
                  >
                    {linkedBanksError}
                  </p>
                )}
                {!linkedBanksLoading && linkedBankAccounts.length > 0 && (
                  <ul
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: "0 24px 12px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    {linkedBankAccounts.map((a) => {
                      const typeLabel = a.subcategory ? formatBankSubcategory(a.subcategory) : "Account";
                      const institution = a.institutionName || "Linked institution";
                      const segments = [
                        institution,
                        a.displayName || null,
                        a.last4 ? `····${a.last4}` : null,
                        typeLabel,
                        a.status && a.status !== "active" ? a.status : null,
                      ].filter((s): s is string => Boolean(s));
                      const titleFull = segments.join(" · ");
                      const ellipsize: React.CSSProperties = {
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      };
                      const canRemove = a.status !== "disconnected";
                      return (
                        <li
                          key={a.id}
                          className="settings-bank-link-row"
                          style={{
                            padding: "6px 8px 6px 10px",
                            borderRadius: "8px",
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flexWrap: "nowrap",
                                gap: "1.125rem",
                                minWidth: 0,
                                flex: "1 1 0%",
                                fontSize: "0.9rem",
                                lineHeight: 1.35,
                                color: "var(--text-dark)",
                              }}
                              title={titleFull}
                            >
                              <span
                                style={{
                                  ...ellipsize,
                                  flex: "0 1 auto",
                                  maxWidth: "38%",
                                  fontWeight: 600,
                                  color: "var(--text-dark)",
                                }}
                              >
                                {institution}
                              </span>
                              {a.displayName ? (
                                <span
                                  style={{
                                    ...ellipsize,
                                    flex: "1 1 0%",
                                    color: "var(--text-medium)",
                                  }}
                                >
                                  {a.displayName}
                                </span>
                              ) : null}
                              {a.last4 ? (
                                <span
                                  style={{
                                    flexShrink: 0,
                                    color: "var(--text-medium)",
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  ····{a.last4}
                                </span>
                              ) : null}
                              <span
                                style={{
                                  flexShrink: 0,
                                  color: "var(--text-medium)",
                                }}
                              >
                                {typeLabel}
                              </span>
                              {a.status && a.status !== "active" ? (
                                <span
                                  style={{
                                    flexShrink: 0,
                                    color: "var(--text-medium)",
                                    fontSize: "0.85rem",
                                  }}
                                >
                                  {a.status}
                                </span>
                              ) : null}
                            </div>
                            {canRemove ? (
                              <button
                                type="button"
                                className="settings-bank-remove-btn"
                                disabled={disconnectingAccountId === a.id}
                                onClick={() => requestDisconnectBank(a.id, institution)}
                                aria-label={`Remove ${institution}`}
                                aria-busy={disconnectingAccountId === a.id}
                                title="Remove linked account"
                                style={
                                  disconnectingAccountId === a.id ? { opacity: 0.55 } : undefined
                                }
                              >
                                <img
                                  src={recycleIcon}
                                  alt=""
                                  className="dropdown-icon"
                                  aria-hidden
                                />
                              </button>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {!linkedBanksLoading && !linkedBanksError && linkedBankAccounts.length === 0 && hasBillingApiBaseUrl() && (
                  <p className="settings-hint" style={{ marginBottom: "12px", paddingLeft: 24, paddingRight: 24 }}>
                    No banks linked yet.
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    paddingLeft: 24,
                    paddingRight: 24,
                    paddingBottom: 8,
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={() => setBankConnectionModalOpen(true)}
                  >
                    {linkedBankAccounts.length > 0 ? "Link another account" : "Connect bank account"}
                  </button>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Preferences</h2>
              </div>
              <div className="settings-card-content">
                <div className="settings-row settings-row-toggle">
                  <div>
                    <span className="settings-label">Dark Mode</span>
                    <span className="settings-description">Switch between light and dark themes</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={toggleDarkMode}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Security</h2>
              </div>
              <div className="settings-card-content">
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Auto-Logout</span>
                    <span className="settings-description">Automatically log out after inactivity</span>
                  </div>
                  <select
                    className="settings-select"
                    value={currentTimeoutMinutes}
                    onChange={async (e) => {
                      const newTimeout = parseInt(e.target.value);
                      setSavingTimeout(true);
                      await updateAutoLogoutTimeout(newTimeout);
                      setSavingTimeout(false);
                    }}
                    disabled={savingTimeout}
                  >
                    {TIMEOUT_OPTIONS.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {minutes} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Password</span>
                    <span className="settings-description">Change your account password</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-small"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title">Data & Privacy</h2>
              </div>
              <div className="settings-card-content">
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Export Data</span>
                    <span className="settings-description">Download your expenses, income, or statistics</span>
                  </div>
                  <button className="btn btn-ghost btn-small" onClick={() => setIsExporting(true)}>
                    Export
                  </button>
                </div>
                <div className="settings-row">
                  <div>
                    <span className="settings-label">Delete Account</span>
                    <span className="settings-description">Permanently delete your account and data</span>
                  </div>
                  <button
                    className="btn btn-ghost btn-small settings-danger-btn"
                    onClick={() => setIsDeleting(true)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BankConnectionModal
        open={bankConnectionModalOpen}
        onOpenChange={setBankConnectionModalOpen}
        accessToken={session?.access_token}
        userId={user?.id}
        purpose="settings"
        onLinked={() => void refreshLinkedBankAccounts()}
        connectActionLabel={
          linkedBankAccounts.length > 0 ? "Link another account" : "Connect bank account"
        }
      />

      {bankDisconnectConfirm && (
        <div className="modal-overlay" onClick={cancelBankDisconnectConfirm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "26rem" }}>
            <button type="button" className="modal-close" onClick={cancelBankDisconnectConfirm} aria-label="Close">
              ×
            </button>
            <div className="modal-header">
              <h2>Remove bank connection?</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-medium)", lineHeight: 1.55, marginBottom: bankDisconnectError ? 12 : 0 }}>
                Remove <strong style={{ color: "var(--text-dark)" }}>{bankDisconnectConfirm.label}</strong>? You can
                link this bank again later from this page.
              </p>
              {bankDisconnectError && (
                <p style={{ color: "#c33", fontSize: "0.9rem", margin: 0 }} role="alert">
                  {bankDisconnectError}
                </p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={cancelBankDisconnectConfirm}
                disabled={disconnectingAccountId === bankDisconnectConfirm.accountId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void confirmDisconnectBank()}
                disabled={disconnectingAccountId === bankDisconnectConfirm.accountId}
              >
                {disconnectingAccountId === bankDisconnectConfirm.accountId ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="modal-close" onClick={handleCancelEdit}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, firstName: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Business Name</label>
                <input
                  type="text"
                  value={profileForm.businessName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, businessName: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. Smith's Organic Farm"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label>Products & Services</label>
                <textarea
                  value={profileForm.productsSold}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, productsSold: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. nail services, jewelry, consulting, etc."
                  disabled={loading}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Platforms & Locations</label>
                <textarea
                  value={profileForm.farmersMarkets}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, farmersMarkets: e.target.value })
                  }
                  className="form-input"
                  placeholder="e.g. Instagram, Etsy, salon, home-based, etc."
                  disabled={loading}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Country</label>
                <select
                  value={profileForm.country}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, country: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                >
                  <option value="">Select country</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Eurozone">Eurozone</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  value={profileForm.currency}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, currency: e.target.value })
                  }
                  className="form-input"
                  disabled={loading}
                >
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="JPY">Japanese Yen (JPY)</option>
                  <option value="GBP">Pound Sterling (GBP)</option>
                  <option value="AUD">Australian Dollar (AUD)</option>
                  <option value="CAD">Canadian Dollar (CAD)</option>
                  <option value="CHF">Swiss Franc (CHF)</option>
                  <option value="CNY">Chinese Yuan (CNY)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelEdit} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangingPassword && (
        <div className="modal-overlay" onClick={handleCancelPasswordChange}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={handleCancelPasswordChange}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {passwordError && (
                <div className="error-message" style={{ marginBottom: '16px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="success-banner" style={{ marginBottom: '16px' }}>
                  Password updated successfully!
                </div>
              )}
              <div className="form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showNewPassword ? openEyeIcon : closedEyeIcon}
                      alt={showNewPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
                {newPassword.length > 0 && (
                  <div className="password-requirements">
                    <div className={`requirement ${passwordChecks.length ? 'met' : ''}`}>
                      <span className="requirement-icon">{passwordChecks.length ? '✓' : '○'}</span>
                      At least 8 characters
                    </div>
                    <div className={`requirement ${passwordChecks.uppercase ? 'met' : ''}`}>
                      <span className="requirement-icon">{passwordChecks.uppercase ? '✓' : '○'}</span>
                      One uppercase letter
                    </div>
                    <div className={`requirement ${passwordChecks.lowercase ? 'met' : ''}`}>
                      <span className="requirement-icon">{passwordChecks.lowercase ? '✓' : '○'}</span>
                      One lowercase letter
                    </div>
                    <div className={`requirement ${passwordChecks.number ? 'met' : ''}`}>
                      <span className="requirement-icon">{passwordChecks.number ? '✓' : '○'}</span>
                      One number
                    </div>
                    <div className={`requirement ${passwordChecks.special ? 'met' : ''}`}>
                      <span className="requirement-icon">{passwordChecks.special ? '✓' : '○'}</span>
                      One special character (!@#$%^&*)
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="Confirm new password"
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    aria-label={showConfirmNewPassword ? "Hide password" : "Show password"}
                  >
                    <img
                      src={showConfirmNewPassword ? openEyeIcon : closedEyeIcon}
                      alt={showConfirmNewPassword ? "Hide password" : "Show password"}
                      className="eye-icon"
                    />
                  </button>
                </div>
                {confirmNewPassword.length > 0 && !passwordsMatch && (
                  <div className="password-mismatch-error" style={{ color: '#c33', fontSize: '0.875rem', marginTop: '8px' }}>
                    Passwords do not match
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelPasswordChange} disabled={passwordLoading}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleChangePassword}
                disabled={passwordLoading || !canChangePassword}
              >
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {isExporting && (
        <div className="modal-overlay" onClick={handleCloseExport}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Export Data</h2>
              <button className="modal-close" onClick={handleCloseExport}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '24px', color: 'var(--text-medium)' }}>
                Select what data you'd like to download. Files will be saved as CSV format.
              </p>
              <div className="export-options">
                <label
                  className={`export-option-btn ${exportSelections.expenses ? 'selected' : ''} ${expenses.length === 0 ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={exportSelections.expenses}
                    onChange={() => toggleExportSelection('expenses')}
                    disabled={expenses.length === 0}
                    className="export-checkbox"
                  />
                  <div className="export-option-icon" style={{ background: '#FEE2E2' }}>
                    <span style={{ color: '#EF4444' }}>$</span>
                  </div>
                  <div className="export-option-content">
                    <span className="export-option-title">Expenses</span>
                    <span className="export-option-desc">{expenses.length} entries</span>
                  </div>
                  <div className="export-checkmark">
                    {exportSelections.expenses && <span>✓</span>}
                  </div>
                </label>
                <label
                  className={`export-option-btn ${exportSelections.income ? 'selected' : ''} ${incomes.length === 0 ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={exportSelections.income}
                    onChange={() => toggleExportSelection('income')}
                    disabled={incomes.length === 0}
                    className="export-checkbox"
                  />
                  <div className="export-option-icon" style={{ background: '#DCFCE7' }}>
                    <span style={{ color: '#22C55E' }}>$</span>
                  </div>
                  <div className="export-option-content">
                    <span className="export-option-title">Income</span>
                    <span className="export-option-desc">{incomes.length} entries</span>
                  </div>
                  <div className="export-checkmark">
                    {exportSelections.income && <span>✓</span>}
                  </div>
                </label>
                <label
                  className={`export-option-btn ${exportSelections.statistics ? 'selected' : ''} ${expenses.length === 0 && incomes.length === 0 ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={exportSelections.statistics}
                    onChange={() => toggleExportSelection('statistics')}
                    disabled={expenses.length === 0 && incomes.length === 0}
                    className="export-checkbox"
                  />
                  <div className="export-option-icon" style={{ background: '#EDE9FE' }}>
                    <span style={{ color: 'var(--primary-purple)' }}>%</span>
                  </div>
                  <div className="export-option-content">
                    <span className="export-option-title">Statistics Summary</span>
                    <span className="export-option-desc">Overview & categories breakdown</span>
                  </div>
                  <div className="export-checkmark">
                    {exportSelections.statistics && <span>✓</span>}
                  </div>
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseExport}>
                Cancel
              </button>
              {cancelFlowExportThenDelete && !hasExportSelection ? (
                <button className="btn btn-primary" onClick={openDeleteModalForCancelFlow}>
                  Continue to delete
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={downloadSelected}
                  disabled={!hasExportSelection}
                >
                  Download Selected
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Change Notice Modal */}
      {emailChangeNotice && (
        <div className="modal-overlay" onClick={() => setEmailChangeNotice(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEmailChangeNotice(false)}>
              &times;
            </button>
            <div className="modal-header">
              <h2>Email Updated</h2>
            </div>
            <div className="modal-body">
              <div className="success-banner" style={{ marginBottom: '16px' }}>
                Profile updated successfully!
              </div>
              <p style={{ color: 'var(--text-medium)', lineHeight: 1.6 }}>
                A confirmation email has been sent to your new email address. Please verify it and then{' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); refreshSession(); setEmailChangeNotice(false); }}
                  className="link"
                >
                  click here to refresh
                </a>
                {' '}to see the changes.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setEmailChangeNotice(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleting && (
        <div className="modal-overlay" onClick={handleCloseDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ color: '#DC2626' }}>Delete Account</h2>
              <button className="modal-close" onClick={handleCloseDelete}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <div className="delete-warning-icon">⚠️</div>
                <div className="delete-warning-content">
                  <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    This action cannot be undone
                  </p>
                  <p style={{ color: 'var(--text-medium)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
                    This will permanently delete your account and remove all your data including:
                  </p>
                  <ul style={{ color: 'var(--text-medium)', fontSize: '0.9375rem', marginTop: '12px', paddingLeft: '20px' }}>
                    <li>All expenses ({expenses.length} entries)</li>
                    <li>All income records ({incomes.length} entries)</li>
                    <li>Your account information</li>
                  </ul>
                </div>
              </div>

              {deleteError && (
                <div className="error-message" style={{ marginTop: '16px', padding: '12px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
                  {deleteError}
                </div>
              )}

              <div className="form-group" style={{ marginTop: '24px' }}>
                <label style={{ fontWeight: 500 }}>
                  Why are you deleting your account?
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="form-input"
                  placeholder="Please let us know why you're leaving..."
                  disabled={deleteLoading}
                  rows={3}
                  style={{ marginTop: '8px', resize: 'vertical' }}
                />
                {deleteReason.trim().length === 0 && deleteConfirmText === "DELETE" && (
                  <p style={{ color: '#DC2626', fontSize: '0.85rem', marginTop: '6px' }}>
                    Please provide a reason before deleting your account.
                  </p>
                )}
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 500 }}>
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="form-input"
                  placeholder="DELETE"
                  disabled={deleteLoading}
                  style={{ marginTop: '8px' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDelete} disabled={deleteLoading}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !canDelete}
              >
                {deleteLoading ? "Deleting..." : "Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
