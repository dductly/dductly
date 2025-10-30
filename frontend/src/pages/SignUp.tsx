import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface SignUpProps {
  onNavigate?: (page: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onNavigate }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showModal, setShowModal] = useState<'tos' | 'privacy' | null>(null);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, firstName, lastName);
  
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Navigate to confirmation page after a short delay
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('confirm-email');
        }
      }, 2000);
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
             <p>We've sent you a confirmation link. Please check your email and click the link to verify your account.</p>
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
         <div className="signup-left">
           <h1 className="section-title">Create Your Account</h1>
           <p>Join dductly today and make managing your business effortless, so you can focus on what truly matters.</p>
         </div>


         <form className="signup-form" onSubmit={handleSubmit}>
           {error && (
             <div className="error-message">
               {error}
             </div>
           )}
          
           <div className="form-group">
             <label>First Name <span className="req">(required)</span></label>
             <input
               type="text"
               placeholder="Enter your first name"
               value={firstName}
               onChange={(e) => setFirstName(e.target.value)}
               required
               disabled={loading}
             />
           </div>
          
           <div className="form-group">
             <label>Last Name <span className="req">(required)</span></label>
             <input
               type="text"
               placeholder="Enter your last name"
               value={lastName}
               onChange={(e) => setLastName(e.target.value)}
               required
               disabled={loading}
             />
           </div>
          
           <div className="form-group">
             <label>Email Address <span className="req">(required)</span></label>
             <input
               type="email"
               placeholder="you@example.com"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               required
               disabled={loading}
             />
           </div>
          
           <div className="form-group">
             <label>Password <span className="req">(required)</span></label>
             <input
               type="password"
               placeholder="Create a strong password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               required
               disabled={loading}
             />
           </div>
          
           <div className="form-group">
             <label>Confirm Password <span className="req">(required)</span></label>
             <input
               type="password"
               placeholder="Confirm your password"
               value={confirmPassword}
               onChange={(e) => setConfirmPassword(e.target.value)}
               required
               disabled={loading}
             />
           </div>
        
           <div className="form-group">
             <label>
               <input type="checkbox" required disabled={loading} />
               I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowModal('tos'); }} className="link">Terms of Service</a> and <a href="#" onClick={(e) => { e.preventDefault(); setShowModal('privacy'); }} className="link">Privacy Policy</a>
             </label>
           </div>
          
           <button className="btn btn-primary btn-large" type="submit" disabled={loading}>
             {loading ? "Creating Account..." : "Create Account"}
           </button>
          
          <p className="signup-login">
            Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('signin'); }} className="link">Sign in here</a>
          </p>
         </form>
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
             <p>dductly provides expense tracking and financial management tools for farmers market vendors. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>

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