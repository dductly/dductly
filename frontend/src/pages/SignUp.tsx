import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import openEyeIcon from "../img/open-eye.svg";
import closedEyeIcon from "../img/closed-eye.svg";

interface SignUpProps {
  onNavigate?: (page: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [productsSold, setProductsSold] = useState("");
  const [farmersMarkets, setFarmersMarkets] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState<'tos' | 'privacy' | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const { signUp } = useAuth();

  const totalSteps = 3;

  // Password validation checks
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);

  const canProceedToStep2 = businessName && productsSold;
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
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!canSubmit) {
      setError("Please complete all required fields");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, firstName, lastName, businessName, productsSold, farmersMarkets);

    if (error) {
      // Replace the long password requirements message with a friendly one
      if (error.message.includes('Password should contain at least one character')) {
        setError('Please Choose a Stronger Password!');
      } else {
        setError(error.message);
      }
    } else {
      localStorage.setItem("pendingSignUpEmail", email);
      setSuccess(true);
    }
    setLoading(false);
  };


 if (success) {
   return (
     <div className="page">
       <section className="section">
         <div className="signup-container">
           <div className="success-message">
             <h1 className="section-title">Check Your Email</h1>
             <p>
                We've sent a confirmation link to <strong>{email}</strong>.
                Please check your inbox and click the link to verify your account.
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
       <div className="signup-container">
         <div className="signup-wizard">
           <div className="wizard-header">
             <h1 className="section-title">Join dductly</h1>
             <p className="wizard-subtitle">Make managing your business effortless</p>
             
             {/* Progress Steps */}
             <div className="progress-steps">
               <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
                 <div className="step-number">1</div>
                 <div className="step-label">Business</div>
               </div>
               <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`}></div>
               <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
                 <div className="step-number">2</div>
                 <div className="step-label">Markets</div>
               </div>
               <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`}></div>
               <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                 <div className="step-number">3</div>
                 <div className="step-label">Account</div>
               </div>
             </div>
           </div>

         <form className="signup-form wizard-form" onSubmit={handleSubmit}>
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
                   <span>I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowModal('tos'); }} className="link">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowModal('privacy'); }} className="link">Privacy Policy</a></span>
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
             {currentStep < totalSteps ? (
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
                 type="submit" 
                 className="btn btn-primary btn-large" 
                 disabled={loading || !canSubmit}
               >
                 {loading ? "Creating Account..." : "Create Account"}
               </button>
             )}
           </div>
          
          <p className="signup-login">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('signin'); }} className="link">Sign in here</a>
          </p>
         </form>
         </div>
       </div>
     </section>

     {/* Terms of Service Modal */}
     {showModal === 'tos' && (
       <div className="modal-overlay" onClick={() => setShowModal(null)}>
         <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
           <button className="modal-close" onClick={() => setShowModal(null)} aria-label="Close">×</button>
           <h2 className="modal-title">Terms of Service</h2>
           <div className="modal-body">
             <p><strong>Last Updated:</strong> October 28, 2025</p>

             <h3>1. Acceptance of Terms</h3>
             <p>By accessing and using dductly, you accept and agree to be bound by the terms and provisions of this agreement.</p>

             <h3>2. Use of Service</h3>
             <p>dductly provides expense tracking and financial management tools for small businesses. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>

             <h3>3. User Accounts</h3>
             <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>

             <h3>4. Data and Privacy</h3>
             <p>Your use of dductly is also governed by our Privacy Policy. We collect and use your data to provide and improve our services.</p>

             <h3>5. Intellectual Property</h3>
             <p>The service and its original content, features, and functionality are owned by dductly and are protected by international copyright, trademark, and other intellectual property laws.</p>
             <p>Free icons from <a href="https://www.streamlinehq.com/" target="_blank" rel="noopener noreferrer" className="link">Streamline</a>.</p>

             <h3>6. Limitation of Liability</h3>
             <p>dductly shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>

             <h3>7. Changes to Terms</h3>
             <p>We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.</p>

             <h3>8. Contact Information</h3>
             <p>If you have any questions about these Terms, please contact us through our contact form.</p>
           </div>
         </div>
       </div>
     )}

     {/* Privacy Policy Modal */}
     {showModal === 'privacy' && (
       <div className="modal-overlay" onClick={() => setShowModal(null)}>
         <div className="modal-content modal-legal" onClick={(e) => e.stopPropagation()}>
           <button className="modal-close" onClick={() => setShowModal(null)} aria-label="Close">×</button>
           <h2 className="modal-title">Privacy Policy</h2>
           <div className="modal-body">
             <p><strong>Last Updated:</strong> October 28, 2025</p>

             <h3>1. Information We Collect</h3>
             <p>We collect information you provide directly to us, including your name, email address, phone number, and business expense data that you choose to track through our service.</p>

             <h3>2. How We Use Your Information</h3>
             <p>We use the information we collect to:</p>
             <ul>
               <li>Provide, maintain, and improve our services</li>
               <li>Process and complete transactions</li>
               <li>Send you technical notices and support messages</li>
               <li>Respond to your comments and questions</li>
               <li>Analyze usage patterns to improve user experience</li>
             </ul>

             <h3>3. Information Sharing</h3>
             <p>We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:</p>
             <ul>
               <li>With your consent</li>
               <li>To comply with legal obligations</li>
               <li>To protect our rights and prevent fraud</li>
             </ul>

             <h3>4. Data Security</h3>
             <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing and accidental loss, destruction, or damage.</p>

             <h3>5. Your Rights</h3>
             <p>You have the right to access, update, or delete your personal information at any time through your account settings or by contacting us.</p>

             <h3>6. Cookies and Tracking</h3>
             <p>We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve and analyze our service.</p>

             <h3>7. Children's Privacy</h3>
             <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.</p>

             <h3>8. Changes to Privacy Policy</h3>
             <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

             <h3>9. Contact Us</h3>
             <p>If you have any questions about this Privacy Policy, please contact us through our contact form.</p>
           </div>
         </div>
       </div>
     )}
   </div>
 );
};


export default SignUp;