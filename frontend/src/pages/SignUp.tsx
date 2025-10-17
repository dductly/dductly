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
           <p>Join dductly today and start maximizing your tax savings through better donation tracking.</p>
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
               I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
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
   </div>
 );
};


export default SignUp;