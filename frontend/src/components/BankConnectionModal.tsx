import React, { useState } from "react";
import {
  collectFinancialConnectionsAccounts,
  subscribeFinancialConnectionsTransactions,
  syncFinancialConnectionsFromStripe,
} from "../services/financialConnectionsService";
import { FC_TRANSACTIONS_SYNCED_EVENT } from "../lib/bankLedgerMapping";

interface BankConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessToken: string | null | undefined;
  /** Called after a successful link (before close). Use to refresh linked-account lists. */
  onLinked?: () => void;
  /** Primary button label (e.g. “Link another account” when one is already linked). */
  connectActionLabel?: string;
}

const BankConnectionModal: React.FC<BankConnectionModalProps> = ({
  open,
  onOpenChange,
  accessToken,
  onLinked,
  connectActionLabel,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Opening…");
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  const handleConnect = async () => {
    if (!accessToken) {
      setError("You need to be signed in to connect a bank.");
      return;
    }
    setLoading(true);
    setLoadingLabel("Opening Stripe…");
    setError(null);
    try {
      const { error: fcError } = await collectFinancialConnectionsAccounts(accessToken);
      if (fcError) {
        setError(fcError.message);
        return;
      }
      setLoadingLabel("Gathering transactions…");
      await subscribeFinancialConnectionsTransactions(accessToken);
      await syncFinancialConnectionsFromStripe(accessToken);
      window.dispatchEvent(new CustomEvent(FC_TRANSACTIONS_SYNCED_EVENT));
      onLinked?.();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong while syncing your bank.");
    } finally {
      setLoading(false);
      setLoadingLabel("Opening…");
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-connect-title"
      onClick={handleClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "26rem" }}
      >
        <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        <h2 id="bank-connect-title" className="modal-title">
          Bank connections
        </h2>
        <p className="modal-subtitle" style={{ marginBottom: "0.75rem", lineHeight: 1.55 }}>
          Securely link your bank through Stripe to pull in transactions and balances.
        </p>
        <p
          className="modal-subtitle"
          style={{
            marginBottom: "1rem",
            lineHeight: 1.55,
            fontSize: "0.9rem",
            color: "var(--text-medium, #5c5c5c)",
          }}
        >
          After you connect, please be patient while Stripe gathers your transactions from your bank. This can take up
          to a minute; the window may stay open until the first sync finishes.
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
            {loading ? loadingLabel : connectActionLabel ?? "Connect bank"}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ flex: "1 1 0", minWidth: "min(100%, 10rem)" }}
            onClick={handleClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankConnectionModal;
