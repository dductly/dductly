import React, { useEffect, useState } from "react";
import { usePostHog } from "@posthog/react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useAuth } from "../hooks/useAuth";
import openEyeIcon from "../img/open-eye.svg";
import closedEyeIcon from "../img/closed-eye.svg";
import {
  createCheckoutSession,
  getPublicBillingConfig,
  hasBillingApiBaseUrl,
  type CheckoutPlan,
  type PublicBillingConfig,
} from "../services/billingService";
import { STANDARD_SUBSCRIPTION_CARD } from "../constants/subscriptionMarketing";
import { SIGNUP_PLAN_STEP_SECTION } from "../constants/signupPlanStep";
import { STORAGE_POST_SIGNUP_EMAIL } from "../lib/signupEmailFlow";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = stripePublishableKey?.trim() ? loadStripe(stripePublishableKey.trim()) : null;
const DISPLAY_TRIAL_DAYS = Number(import.meta.env.VITE_STRIPE_TRIAL_DAYS || 14);
/** Primary CTA on plan step when Stripe checkout is available */
const SIGNUP_CONTINUE_TO_PAYMENT_LABEL = "Continue to payment method";

interface SignUpProps {
  onNavigate?: (page: string) => void;
  stripeCheckoutReturnSessionId?: string | null;
  onStripeCheckoutReturnHandled?: () => void;
}

const SignUp: React.FC<SignUpProps> = ({
  onNavigate,
  stripeCheckoutReturnSessionId,
  onStripeCheckoutReturnHandled,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [productsSold, setProductsSold] = useState("");
  const [farmersMarkets, setFarmersMarkets] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [customCurrency, setCustomCurrency] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signUp } = useAuth();
  const posthog = usePostHog();
  const [billingInfo, setBillingInfo] = useState<PublicBillingConfig | null>(null);
  const [billingLoadError, setBillingLoadError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<CheckoutPlan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [embeddedCheckoutClientSecret, setEmbeddedCheckoutClientSecret] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [completedSignupPayment, setCompletedSignupPayment] = useState(false);

  /** Steps 1–3 = profile/account fields; step 4 = plan + single submit (signUp → Stripe when possible). */
  const LAST_FORM_STEP = 3;

  const markPostSignupEmail = () => {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(STORAGE_POST_SIGNUP_EMAIL, "1");
  };

  // Password validation checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const hasCountry = !!country.trim();
  const hasCurrency = currency === "OTHER" ? !!customCurrency.trim() : !!currency;
  const canProceedToStep2 = businessName && productsSold && hasCountry && hasCurrency;
  const canProceedToStep3 = farmersMarkets;
  const canSubmit = firstName && lastName && email && password && confirmPassword && password === confirmPassword && isPasswordValid && agreedToTerms;

  const handleNext = () => {
    setError(null);
    if (currentStep === 1 && !canProceedToStep2) {
      setError("Please tell us about your business");
      return;
    }
    if (currentStep === 2 && !canProceedToStep3) {
      setError("Please tell us where you operate");
      return;
    }
    if (currentStep === 3) {
      if (!canSubmit) {
        setError("Please complete all required fields");
        return;
      }
      setCheckoutError(null);
      setSelectedPlan(null);
      setCurrentStep(4);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, LAST_FORM_STEP));
  };

  const handleBack = () => {
    setError(null);
    setCheckoutError(null);
    if (currentStep === 4) {
      if (embeddedCheckoutClientSecret) {
        setEmbeddedCheckoutClientSecret(null);
        return;
      }
      setCurrentStep(3);
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  /** Step 4: create Supabase user, then Stripe Embedded Checkout (trial; charge after trial). */
  const handleCompleteSignup = async (opts: { skipCheckout: boolean }) => {
    setLoading(true);
    setError(null);
    setCheckoutError(null);

    if (!canSubmit) {
      setError("Please complete all required fields");
      setLoading(false);
      return;
    }

    // Embedded checkout is required for this flow.
    if (opts.skipCheckout) {
      setCheckoutError("Embedded checkout is required to finish sign up.");
      setLoading(false);
      return;
    }

    const checkoutAvailable =
      !!billingInfo &&
      billingInfo.hasStripeConfig &&
      hasBillingApiBaseUrl() &&
      (billingInfo.availablePlans.monthly || billingInfo.availablePlans.yearly);

    if (!checkoutAvailable) {
      setCheckoutError("Payment is not configured yet. Please try again shortly.");
      setLoading(false);
      return;
    }

    if (!selectedPlan) {
      setError("Please select monthly or yearly to continue to checkout.");
      setLoading(false);
      return;
    }

    const planOk =
      (selectedPlan === "monthly" && billingInfo.availablePlans.monthly) ||
      (selectedPlan === "yearly" && billingInfo.availablePlans.yearly);
    if (!planOk) {
      setError("That plan isn't available right now.");
      setLoading(false);
      return;
    }

    const chosenCurrency =
      currency === "OTHER" && customCurrency.trim() ? customCurrency.trim() : currency;

    const { error: signUpError, session, user: signedUpUser } = await signUp(
      email,
      password,
      firstName,
      lastName,
      businessName,
      productsSold,
      farmersMarkets,
      country,
      chosenCurrency
    );

    if (signUpError) {
      if (signUpError.message.includes("Password should contain at least one character")) {
        setError("Please Choose a Stronger Password!");
      } else {
        setError(signUpError.message);
      }
      setLoading(false);
      return;
    }

    // Persist a flag so `/confirm-email` doesn't immediately bounce back to Home.
    markPostSignupEmail();

    posthog?.capture("user_signed_up", {
      email,
      first_name: firstName,
      last_name: lastName,
      business_name: businessName || undefined,
      products_sold: productsSold || undefined,
      farmers_markets: farmersMarkets || undefined,
      country: country || undefined,
      currency: chosenCurrency || undefined,
    });

    const canStartCheckout = !!session?.access_token || !!signedUpUser?.id;

    const wantStripeRedirect = checkoutAvailable && selectedPlan && canStartCheckout;

    if (wantStripeRedirect && selectedPlan) {
      try {
        if (!stripePromise) {
          setCheckoutError(
            "Payment form isn’t configured (missing VITE_STRIPE_PUBLISHABLE_KEY). You can subscribe later in Settings after you verify your email."
          );
          setSuccess(true);
          setLoading(false);
          return;
        }
        const result = await createCheckoutSession(
          session?.access_token
            ? {
                email,
                plan: selectedPlan,
                embedded: true,
                accessToken: session.access_token,
              }
            : {
                email,
                plan: selectedPlan,
                embedded: true,
                supabaseUserId: signedUpUser!.id,
              }
        );
        if (result.embedded) {
          posthog?.capture("signup_checkout_started", { plan: selectedPlan, embedded: true });
          setEmbeddedCheckoutClientSecret(result.clientSecret);
          setLoading(false);
          return;
        }
        posthog?.capture("signup_checkout_started", { plan: selectedPlan, embedded: false });
        window.location.assign(result.url);
        return;
      } catch (err) {
        setCheckoutError(err instanceof Error ? err.message : "Could not start checkout");
        setSuccess(true);
        setLoading(false);
        return;
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  useEffect(() => {
    if (!success && currentStep !== 4) return;
    if (!hasBillingApiBaseUrl()) {
      setBillingLoadError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const config = await getPublicBillingConfig();
        if (!cancelled) {
          setBillingInfo(config);
          posthog?.capture("signup_billing_rollout_loaded", {
            has_stripe_config: config.hasStripeConfig,
          });
        }
      } catch {
        if (!cancelled) {
          setBillingLoadError("We couldn't load plan availability right now. You can check Settings after you sign in.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [success, currentStep, posthog]);

  useEffect(() => {
    if (!billingInfo) return;
    const { monthly, yearly } = billingInfo.availablePlans;
    if (monthly && !yearly) setSelectedPlan("monthly");
    else if (!monthly && yearly) setSelectedPlan("yearly");
  }, [billingInfo]);

  useEffect(() => {
    if (!stripeCheckoutReturnSessionId) return;
    setSuccess(true);
    setCompletedSignupPayment(true);
    setEmbeddedCheckoutClientSecret(null);
    setCheckoutError(null);
    setLoading(false);
    posthog?.capture("signup_embedded_checkout_completed", {
      stripe_session_id: stripeCheckoutReturnSessionId,
    });
    onStripeCheckoutReturnHandled?.();
  }, [stripeCheckoutReturnSessionId, posthog, onStripeCheckoutReturnHandled]);

  const stepCompleted = (n: number) => currentStep > n;
  const stepActive = (n: number) => currentStep === n;

  const billingLoading =
    currentStep === 4 &&
    !success &&
    hasBillingApiBaseUrl() &&
    !billingInfo &&
    !billingLoadError;
  const checkoutAvailable =
    !!billingInfo &&
    billingInfo.hasStripeConfig &&
    hasBillingApiBaseUrl() &&
    (billingInfo.availablePlans.monthly || billingInfo.availablePlans.yearly);

  if (success) {
    return (
      <div className="page">
        <section className="section">
          <div className="signup-container">
            <div className="success-message">
              <h1 className="section-title">Check Your Email</h1>
              <p>
                We&apos;ve sent you a confirmation link. Please check your email and click the link to verify your
                account.
              </p>

              {billingInfo && (
                <div
                  className="success-billing-notice"
                  style={{
                    marginTop: "1.5rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    background: "var(--surface-elevated, rgba(0,0,0,0.04))",
                    textAlign: "left",
                    maxWidth: "36rem",
                    marginLeft: "auto",
                    marginRight: "auto",
                  }}
                >
                  {completedSignupPayment ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 600 }}>Subscription</p>
                      <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                        You&apos;re on a <strong>{DISPLAY_TRIAL_DAYS}-day free trial</strong>. You won&apos;t be charged until it
                        ends. Manage your plan anytime in <strong>Settings</strong>.
                      </p>
                    </>
                  ) : billingInfo.hasStripeConfig ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 600 }}>Subscriptions</p>
                      <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                        After you verify your email, you can start a plan (includes a free trial) from <strong>Settings</strong>{" "}
                        when you&apos;re ready.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: 600 }}>Subscription setup</p>
                      <p style={{ margin: "0.5rem 0 0", color: "var(--text-medium, #555)" }}>
                        After you verify your email, subscription checkout isn&apos;t fully configured yet. You can finish setup
                        later in <strong>Settings</strong>.
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

              {checkoutError && (
                <p style={{ marginTop: "1rem", color: "var(--text-medium, #666)", fontSize: "0.9375rem" }}>
                  {checkoutError}
                </p>
              )}

              {onNavigate && (
                <p style={{ marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-secondary" onClick={() => onNavigate("signin")}>
                    Back to sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

 return (
   <div className="page">
     <section className="section signup-section">
       <div className="signup-container">
         <div className="signup-wizard">
           <div className="wizard-header">
             <h1 className="section-title">Join dductly</h1>
             <p className="wizard-subtitle">
               {currentStep === 4
                 ? "Pick a plan, then finish creating your account"
                 : "Make managing your business effortless"}
             </p>
             
             {/* Progress Steps */}
             <div className="progress-steps">
               <div className={`step ${stepActive(1) ? 'active' : ''} ${stepCompleted(1) ? 'completed' : ''}`}>
                 <div className="step-number">1</div>
                 <div className="step-label">Business</div>
               </div>
               <div className={`step-line ${stepCompleted(1) ? 'completed' : ''}`}></div>
               <div className={`step ${stepActive(2) ? 'active' : ''} ${stepCompleted(2) ? 'completed' : ''}`}>
                 <div className="step-number">2</div>
                 <div className="step-label">Markets</div>
               </div>
               <div className={`step-line ${stepCompleted(2) ? 'completed' : ''}`}></div>
               <div className={`step ${stepActive(3) ? 'active' : ''} ${stepCompleted(3) ? 'completed' : ''}`}>
                 <div className="step-number">3</div>
                 <div className="step-label">Account</div>
               </div>
               <div className={`step-line ${stepCompleted(3) ? 'completed' : ''}`}></div>
               <div className={`step ${stepActive(4) ? 'active' : ''} ${stepCompleted(4) ? 'completed' : ''}`}>
                 <div className="step-number">4</div>
                 <div className="step-label">Plan</div>
               </div>
             </div>
           </div>

         {currentStep <= 3 ? (
         <form className="signup-form wizard-form" onSubmit={(e) => e.preventDefault()}>
           {error && (
             <div className="error-message">
               {error}
             </div>
           )}

           {/* Step 1: Business Info */}
           {currentStep === 1 && (
             <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-in' }}>
               <h2 className="step-title">Tell us about your business</h2>
               
               <div className="form-group">
                 <label>Business Name <span className="req">*</span></label>
                 <input
                   type="text"
                   placeholder="e.g. Bella's Nail Studio"
                   value={businessName}
                   onChange={(e) => setBusinessName(e.target.value)}
                   disabled={loading}
                   autoFocus
                 />
                 <small className="field-hint">What name do customers know you by?</small>
               </div>

               <div className="form-group">
                 <label>What Do You Sell or Offer? <span className="req">*</span></label>
                 <textarea
                   placeholder="e.g. nail services, jewelry, consulting, etc."
                   value={productsSold}
                   onChange={(e) => setProductsSold(e.target.value)}
                   disabled={loading}
                   rows={4}
                   className="textarea-input"
                 />
                 <small className="field-hint">Tell us about your products or services</small>
               </div>

               <div className="form-group">
                 <label>Where is your business based? <span className="req">*</span></label>
                 <input
                   type="text"
                   placeholder="e.g. United States, Canada, India, etc."
                   value={country}
                   onChange={(e) => setCountry(e.target.value)}
                   disabled={loading}
                   className="form-input"
                 />
                 <small className="field-hint">Type the country where you primarily operate.</small>
               </div>

              <div className="form-group">
                <label>Default currency <span className="req">*</span></label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  style={{
                    color: currency ? "var(--text-dark)" : "var(--text-light)",
                  }}
                >
                  <option value="">Select currency</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="JPY">Japanese Yen (JPY)</option>
                  <option value="GBP">Pound Sterling (GBP)</option>
                  <option value="AUD">Australian Dollar (AUD)</option>
                  <option value="CAD">Canadian Dollar (CAD)</option>
                  <option value="CHF">Swiss Franc (CHF)</option>
                  <option value="CNY">Chinese Yuan (CNY)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="OTHER">Other (type your own)</option>
                </select>
                 {currency === "OTHER" && (
                   <div style={{ marginTop: 10 }}>
                     <input
                       type="text"
                       placeholder="Enter your currency code or symbol"
                       value={customCurrency}
                       onChange={(e) => setCustomCurrency(e.target.value)}
                       disabled={loading}
                       className="form-input"
                     />
                   </div>
                 )}
                 <small className="field-hint">
                   We&apos;ll use this currency across your income, expenses, and tax insights. You can change it later in Settings.
                 </small>
               </div>
             </div>
           )}

           {/* Step 2: Markets */}
           {currentStep === 2 && (
             <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-in' }}>
               <h2 className="step-title">Where do you operate?</h2>
               
               <div className="form-group">
                 <label>Platforms or Websites <span className="req">*</span></label>
                 <textarea
                   placeholder="e.g. Instagram, Etsy, salon, home-based, etc."
                   value={farmersMarkets}
                   onChange={(e) => setFarmersMarkets(e.target.value)}
                   disabled={loading}
                   rows={4}
                   className="textarea-input"
                   autoFocus
                 />
                 <small className="field-hint">List where you regularly sell</small>
               </div>
             </div>
           )}

           {/* Step 3: Account Setup */}
           {currentStep === 3 && (
             <div className="wizard-step" style={{ animation: 'fadeIn 0.3s ease-in' }}>
               <h2 className="step-title">Create your account</h2>
               
               <div className="form-group">
                 <label>First Name <span className="req">*</span></label>
                 <input
                   type="text"
                   placeholder="Enter your first name"
                   value={firstName}
                   onChange={(e) => setFirstName(e.target.value)}
                   disabled={loading}
                   autoFocus
                 />
               </div>
              
               <div className="form-group">
                 <label>Last Name <span className="req">*</span></label>
                 <input
                   type="text"
                   placeholder="Enter your last name"
                   value={lastName}
                   onChange={(e) => setLastName(e.target.value)}
                   disabled={loading}
                 />
               </div>
              
               <div className="form-group">
                 <label>Email Address <span className="req">*</span></label>
                 <input
                   type="email"
                   placeholder="you@example.com"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   disabled={loading}
                 />
               </div>
              
               <div className="form-group">
                 <label>Password <span className="req">*</span></label>
                 <div className="password-input-wrapper">
                   <input
                     type={showPassword ? "text" : "password"}
                     placeholder="Create a strong password"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     disabled={loading}
                   />
                   <button
                     type="button"
                     className="password-toggle"
                     onClick={() => setShowPassword(!showPassword)}
                     aria-label={showPassword ? "Hide password" : "Show password"}
                   >
                     <img
                       src={showPassword ? openEyeIcon : closedEyeIcon}
                       alt={showPassword ? "Hide password" : "Show password"}
                       className="eye-icon"
                     />
                   </button>
                 </div>
                 {password.length > 0 && (
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
                 <label>Confirm Password <span className="req">*</span></label>
                 <div className="password-input-wrapper">
                   <input
                     type={showConfirmPassword ? "text" : "password"}
                     placeholder="Confirm your password"
                     value={confirmPassword}
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     disabled={loading}
                   />
                   <button
                     type="button"
                     className="password-toggle"
                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                     aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                   >
                     <img
                       src={showConfirmPassword ? openEyeIcon : closedEyeIcon}
                       alt={showConfirmPassword ? "Hide password" : "Show password"}
                       className="eye-icon"
                     />
                   </button>
                 </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <div className="password-mismatch-error" style={{ color: '#c33', fontSize: '0.875rem', marginTop: '8px' }}>
                    Passwords do not match
                  </div>
                )}
               </div>

               <div className="form-group">
                 <label className="checkbox-label">
                   <input 
                     type="checkbox" 
                     checked={agreedToTerms}
                     onChange={(e) => setAgreedToTerms(e.target.checked)}
                     disabled={loading} 
                   />
                   <span>I agree to the{' '}
                   <a
                     href="/terms"
                     onClick={(e) => {
                       e.preventDefault();
                       onNavigate?.('terms');
                     }}
                     className="link"
                   >
                     Terms of Service
                   </a>
                   {' '}and{' '}
                   <a
                     href="/privacy"
                     onClick={(e) => {
                       e.preventDefault();
                       onNavigate?.('privacy');
                     }}
                     className="link"
                   >
                     Privacy Policy
                   </a>
                   </span>
                 </label>
               </div>
             </div>
           )}
          
           {/* Navigation Buttons */}
           <div className="wizard-navigation">
             {currentStep > 1 && (
               <button 
                 type="button" 
                 className="btn btn-ghost btn-large" 
                 onClick={handleBack}
                 disabled={loading}
               >
                 Back
               </button>
             )}
             {currentStep < LAST_FORM_STEP ? (
               <button 
                 type="button" 
                 className="btn btn-primary btn-large" 
                 onClick={handleNext}
                 disabled={loading}
               >
                 Continue
               </button>
             ) : (
               <button 
                 type="button" 
                 className="btn btn-primary btn-large" 
                 onClick={handleNext}
                 disabled={loading || !canSubmit}
               >
                 Continue to plan
               </button>
             )}
           </div>
          
          <p className="signup-login">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('signin'); }} className="link">Log in here</a>
          </p>
         </form>
         ) : (
         <div className="signup-form wizard-form" style={{ paddingTop: "0.5rem" }}>
           {error && (
             <div className="error-message" style={{ marginBottom: "1rem" }}>
               {error}
             </div>
           )}
           {checkoutError && (
             <div className="error-message" style={{ marginBottom: "1rem" }}>
               {checkoutError}
             </div>
           )}

           {embeddedCheckoutClientSecret && stripePromise ? (
             <>
               <h2 className="step-title">Add payment method</h2>
               <p style={{ color: "var(--text-medium, #555)", marginBottom: "1.25rem" }}>
                 Your account is created. Enter your card below to start your{" "}
                 <strong>{DISPLAY_TRIAL_DAYS}-day free trial</strong>. You won&apos;t be charged until the trial ends;
                 cancel anytime before then in Settings.
               </p>
               <div
                 className="embedded-checkout-container"
                 style={{
                   marginBottom: "1.25rem",
                   borderRadius: "12px",
                   overflow: "hidden",
                   border: "1px solid var(--border-subtle, rgba(0,0,0,0.08))",
                   minHeight: "420px",
                 }}
               >
                 <EmbeddedCheckoutProvider
                   stripe={stripePromise}
                   options={{ clientSecret: embeddedCheckoutClientSecret }}
                 >
                   <EmbeddedCheckout />
                 </EmbeddedCheckoutProvider>
               </div>
               <div className="wizard-navigation" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                 <button type="button" className="btn btn-ghost btn-large" onClick={handleBack} disabled={loading}>
                   Back to plan
                 </button>
               </div>
             </>
           ) : (
             <>
               <h2 className="step-title">{SIGNUP_PLAN_STEP_SECTION.title}</h2>
               <p style={{ color: "var(--text-medium, #555)", marginBottom: "0.75rem", textAlign: "center" }}>
                 {SIGNUP_PLAN_STEP_SECTION.subtitle}
               </p>
               <p style={{ color: "var(--text-medium, #555)", marginBottom: "1.25rem", textAlign: "center" }}>
                 Choose your billing method to start your{" "}
                 <strong>{DISPLAY_TRIAL_DAYS === 14 ? "two-week" : `${DISPLAY_TRIAL_DAYS}-day`}</strong> free trial!
               </p>

               {billingLoading && <p className="settings-hint">Loading plan options…</p>}

               {billingLoadError && (
                 <p style={{ color: "var(--text-medium, #666)", marginBottom: "1rem" }}>{billingLoadError}</p>
               )}

               {billingInfo && !billingInfo.hasStripeConfig && (
                 <p style={{ color: "var(--text-medium, #555)", marginBottom: "1rem" }}>
                   Subscription checkout isn&apos;t fully configured yet. You can finish setup later in{" "}
                   <strong>Settings</strong>.
                 </p>
               )}

               {checkoutAvailable && (
                 <div className="signup-plan-picker">
                   <div
                     className="signup-plan-cards"
                     role="group"
                     aria-label={`${STANDARD_SUBSCRIPTION_CARD.title} billing options`}
                   >
                     {billingInfo!.availablePlans.monthly && (
                       <button
                         type="button"
                         className={`signup-plan-card${selectedPlan === "monthly" ? " is-selected" : ""}`}
                         onClick={() => setSelectedPlan("monthly")}
                         disabled={loading || billingLoading}
                         aria-pressed={selectedPlan === "monthly"}
                       >
                         <h3>{STANDARD_SUBSCRIPTION_CARD.monthly.cardTitle}</h3>
                         <div className="pricing-option">
                           <span className="price">{STANDARD_SUBSCRIPTION_CARD.monthly.price}</span>
                           <span className="price-period">{STANDARD_SUBSCRIPTION_CARD.monthly.period}</span>
                         </div>
                       </button>
                     )}
                     {billingInfo!.availablePlans.yearly && (
                       <button
                         type="button"
                         className={`signup-plan-card${selectedPlan === "yearly" ? " is-selected" : ""}`}
                         onClick={() => setSelectedPlan("yearly")}
                         disabled={loading || billingLoading}
                         aria-pressed={selectedPlan === "yearly"}
                       >
                         <h3>{STANDARD_SUBSCRIPTION_CARD.yearly.cardTitle}</h3>
                         <div className="pricing-option yearly">
                           <span className="price">{STANDARD_SUBSCRIPTION_CARD.yearly.price}</span>
                           <span className="price-period">{STANDARD_SUBSCRIPTION_CARD.yearly.period}</span>
                         </div>
                       </button>
                     )}
                   </div>
                   <p className="signup-plan-hint">
                     Tap a plan to select billing. Actual charge follows your trial.
                   </p>
                 </div>
               )}

               <div className="wizard-navigation" style={{ marginTop: "0.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                 <button
                   type="button"
                   className="btn btn-ghost btn-large"
                   onClick={handleBack}
                   disabled={loading}
                 >
                   Back
                 </button>
                 {checkoutAvailable && (
                   <button
                     type="button"
                     className="btn btn-primary btn-large"
                     disabled={loading || billingLoading || !selectedPlan}
                     onClick={() => void handleCompleteSignup({ skipCheckout: false })}
                     aria-label={
                       loading ? "Creating account" : SIGNUP_CONTINUE_TO_PAYMENT_LABEL
                     }
                   >
                     {loading ? "Creating account…" : SIGNUP_CONTINUE_TO_PAYMENT_LABEL}
                   </button>
                 )}
                 {!checkoutAvailable && !billingLoading && (
                  <p style={{ color: "var(--text-medium, #666)", margin: 0, lineHeight: 1.4 }}>
                    Embedded checkout isn&apos;t available yet. Please try again shortly.
                  </p>
                 )}
               </div>
             </>
           )}

           <p className="signup-login" style={{ marginTop: "1.5rem" }}>
             <button
               type="button"
               className="link"
               style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
               onClick={() => onNavigate?.("signin")}
             >
               Back to sign in
             </button>
           </p>
         </div>
         )}
         </div>
       </div>
     </section>

   </div>
 );
};


export default SignUp;