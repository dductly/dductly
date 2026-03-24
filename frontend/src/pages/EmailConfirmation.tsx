import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import {
  getPublicBillingConfig,
  hasBillingApiBaseUrl,
  type PublicBillingConfig,
} from "../services/billingService";
import {
  STORAGE_POST_SIGNUP_EMAIL,
  STORAGE_SIGNUP_CHECKOUT_COMPLETE,
  STORAGE_SIGNUP_NOTICE,
} from "../lib/signupEmailFlow";

interface EmailConfirmationProps {
  onNavigate: (page: string) => void;
}

const DISPLAY_TRIAL_DAYS = Number(import.meta.env.VITE_STRIPE_TRIAL_DAYS || 14);

const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ onNavigate }) => {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshSession } = useAuth();

  const [pendingFromSignup] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    const v = sessionStorage.getItem(STORAGE_POST_SIGNUP_EMAIL);
    if (v === "1") {
      sessionStorage.removeItem(STORAGE_POST_SIGNUP_EMAIL);
      return true;
    }
    return false;
  });

  const [signupCheckoutComplete] = useState(() => {
    if (typeof sessionStorage === "undefined") return false;
    const v = sessionStorage.getItem(STORAGE_SIGNUP_CHECKOUT_COMPLETE);
    if (v === "1") {
      sessionStorage.removeItem(STORAGE_SIGNUP_CHECKOUT_COMPLETE);
      return true;
    }
    return false;
  });

  const [signupNotice] = useState(() => {
    if (typeof sessionStorage === "undefined") return null as string | null;
    const msg = sessionStorage.getItem(STORAGE_SIGNUP_NOTICE);
    if (msg) {
      sessionStorage.removeItem(STORAGE_SIGNUP_NOTICE);
      return msg;
    }
    return null;
  });

  const [billingInfo, setBillingInfo] = useState<PublicBillingConfig | null>(null);
  const [billingLoadError, setBillingLoadError] = useState<string | null>(null);

  useEffect(() => {
    const awaiting =
      pendingFromSignup || signupCheckoutComplete || (!!user && !user.email_confirmed_at);
    if (!awaiting) return;
    if (!hasBillingApiBaseUrl()) return;

    let cancelled = false;
    (async () => {
      try {
        const config = await getPublicBillingConfig();
        if (!cancelled) setBillingInfo(config);
      } catch {
        if (!cancelled) {
          setBillingLoadError("We couldn't load subscription details right now.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingFromSignup, signupCheckoutComplete, user]);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const type = hashParams.get("type");
        const errorDescription = hashParams.get("error_description");

        const queryParams = new URLSearchParams(window.location.search);
        const queryToken = queryParams.get("token");
        const queryType = queryParams.get("type");
        const queryEmail = queryParams.get("email");

        if (errorDescription) {
          setError(errorDescription);
          setIsVerifying(false);
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }

        if ((accessToken && type === "email") || (queryToken && queryType === "email")) {
          setIsVerifying(true);
          setError(null);

          if (queryToken && queryEmail) {
            const { error: verifyError } = await supabase.auth.verifyOtp({
              token: queryToken,
              type: "email",
              email: queryEmail,
            });

            if (verifyError) {
              setError(verifyError.message);
              setIsVerifying(false);
              window.history.replaceState({}, "", window.location.pathname);
              return;
            }
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));

          await refreshSession();

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user?.email_confirmed_at) {
            setIsVerified(true);
            window.history.replaceState({}, "", window.location.pathname);
          } else {
            setError(
              "Email verification failed. The link may have expired. Please request a new confirmation email."
            );
          }

          setIsVerifying(false);
        } else if (user?.email_confirmed_at) {
          setIsVerified(true);
        }
      } catch (err) {
        console.error("Error verifying email:", err);
        setError("An error occurred while verifying your email. Please try again.");
        setIsVerifying(false);
      }
    };

    handleEmailConfirmation();
  }, [user, refreshSession]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    const hasTokensInUrl =
      (hashParams.get("access_token") && hashParams.get("type") === "email") ||
      (queryParams.get("token") && queryParams.get("type") === "email");

    const awaitingEmail =
      pendingFromSignup ||
      signupCheckoutComplete ||
      (!!user && !user.email_confirmed_at && !isVerified);

    if (!hasTokensInUrl && !isVerifying && !isVerified && !error) {
      if (awaitingEmail) return;
      const timer = setTimeout(() => onNavigate("home"), 100);
      return () => clearTimeout(timer);
    }
  }, [
    isVerifying,
    isVerified,
    user,
    error,
    onNavigate,
    pendingFromSignup,
    signupCheckoutComplete,
  ]);

  if (isVerified || user?.email_confirmed_at) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content success">
              <div className="success-icon">✓</div>
              <h1 className="section-title">Email Verified!</h1>
              <p>Your email has been successfully verified. You can now access all features of dductly.</p>
              <button className="btn btn-primary" onClick={() => onNavigate("home")}>
                Get Started
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content">
              <div className="email-icon">📧</div>
              <h1 className="section-title">Verifying Your Email</h1>
              <p>Please wait while we verify your email address...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content">
              <div className="email-icon">⚠️</div>
              <h1 className="section-title">Verification Error</h1>
              <p>{error}</p>
              <div className="confirmation-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }}
                >
                  Try Again
                </button>
                <button className="btn btn-ghost" onClick={() => onNavigate("home")}>
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const showCheckEmail =
    pendingFromSignup ||
    signupCheckoutComplete ||
    (!!user && !user.email_confirmed_at);

  if (showCheckEmail) {
    return (
      <div className="page">
        <section className="section">
          <div className="confirmation-container">
            <div className="confirmation-content" style={{ maxWidth: "36rem", margin: "0 auto" }}>
              <div className="email-icon">📧</div>
              <h1 className="section-title">Check Your Email</h1>
              {signupNotice && (
                <p style={{ color: "var(--text-medium, #555)", marginBottom: "1rem" }}>{signupNotice}</p>
              )}
              <p>
                We&apos;ve sent you a confirmation link. Please check your email and click the link to verify your
                account.
              </p>

              {billingInfo && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    background: "var(--surface-elevated, rgba(0,0,0,0.04))",
                    textAlign: "left",
                  }}
                >
                  {billingInfo.billingEnabled ? (
                    signupCheckoutComplete ? (
                      <>
                        <p style={{ margin: 0, fontWeight: 600 }}>Subscription</p>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                          You&apos;re on a <strong>{DISPLAY_TRIAL_DAYS}-day free trial</strong>. You won&apos;t be charged
                          until it ends. Manage your plan anytime in <strong>Settings</strong>.
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontWeight: 600 }}>Subscriptions</p>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                          After you verify your email, you can start or manage a plan (includes a free trial) from{" "}
                          <strong>Settings</strong> when you&apos;re ready.
                        </p>
                      </>
                    )
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: 600 }}>You&apos;re in early</p>
                      <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                        Paid plans unlock once we reach <strong>{billingInfo.userThreshold}</strong> members. We&apos;re
                        at <strong>{billingInfo.userCount}</strong> so far — thanks for helping us grow.
                      </p>
                    </>
                  )}
                </div>
              )}

              {billingLoadError && (
                <p style={{ marginTop: "1rem", color: "var(--text-medium, #666)", fontSize: "0.9375rem" }}>
                  {billingLoadError}
                </p>
              )}

              <p style={{ marginTop: "1.5rem" }}>
                <button type="button" className="btn btn-secondary" onClick={() => onNavigate("signin")}>
                  Back to sign in
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <div className="confirmation-container">
          <div className="confirmation-content">
            <div style={{ textAlign: "center" }}>
              <p>Redirecting...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EmailConfirmation;
