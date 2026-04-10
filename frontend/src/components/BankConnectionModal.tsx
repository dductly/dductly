import React, { useState } from "react";
import { collectFinancialConnectionsAccounts } from "../services/financialConnectionsService";
import {
  clearBankPromptShowOnce,
  markBankPromptDismissed,
} from "../lib/bankConnectionPrompt";

export type BankConnectionModalPurpose = "firstVisit" | "settings";

interface BankConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null | undefined;
  userId: string | undefined;
  purpose: BankConnectionModalPurpose;
  /** Called after a successful link (before close). Use to refresh linked-account lists. */
  onLinked?: () => void;
  /** Primary button label (e.g. “Link another account” when one is already linked). */
  connectActionLabel?: string;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({
  open,
  onOpenChange,
  accessToken,
  userId,
  purpose,
  onLinked,
  connectActionLabel,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finishFirstVisitPrompt = () => {
    if (purpose === "firstVisit" && userId) {
      clearBankPromptShowOnce(userId);
      markBankPromptDismissed(userId);
    }
  };

  const handleNotNow = () => {
    finishFirstVisitPrompt();
    setError(null);
    onOpenChange(false);
  };

  const handleConnect = async () => {
    if (!accessToken) {
      setError("You need to be signed in to connect a bank.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: fcError } = await collectFinancialConnectionsAccounts(accessToken);
      if (fcError) {
        setError(fcError.message);
        return;
      }
      finishFirstVisitPrompt();
      onLinked?.();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-connect-title"
      onClick={handleNotNow}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "26rem" }}
      >
        <button type="button" className="modal-close" onClick={handleNotNow} aria-label="Close">
          ×
        </button>
        <h2 id="bank-connect-title" className="modal-title">
          {purpose === "firstVisit" ? "Connect your bank" : "Bank connections"}
        </h2>
        <p className="modal-subtitle" style={{ marginBottom: "1rem", lineHeight: 1.55 }}>
          {purpose === "firstVisit"
            ? "Link your business bank account so we can help populate your dashboard with transactions. You can skip for now and connect later in Settings."
            : "Securely link your bank through Stripe to pull in transactions and balances. Full import into your ledger is rolling out next."}
        </p>
        {error && (
          <p style={{ color: "#c33", fontSize: "0.9rem", marginBottom: "0.75rem" }} role="alert">
            {error}
          </p>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            marginTop: "1rem",
            width: "100%",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: "1 1 0", minWidth: "min(100%, 10rem)" }}
            onClick={() => void handleConnect()}
            disabled={loading}
          >
            {loading ? "Opening…" : connectActionLabel ?? "Connect bank"}
          </button>
          {purpose === "firstVisit" && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: "1 1 0", minWidth: "min(100%, 10rem)" }}
              onClick={handleNotNow}
              disabled={loading}
            >
              Not now
            </button>
          )}
          {purpose === "settings" && (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flex: "1 1 0", minWidth: "min(100%, 10rem)" }}
              onClick={handleNotNow}
              disabled={loading}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankConnectionModal;
