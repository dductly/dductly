import React from "react";

const SignUp: React.FC = () => (
  <div className="page">
    <section className="section">
      <div className="signup-container">
        <div className="signup-left">
          <h1 className="section-title">Create Your Account</h1>
          <p>Join dductly today and start maximizing your tax savings through better donation tracking.</p>
        </div>

        <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label>First Name <span className="req">(required)</span></label>
            <input type="text" placeholder="Enter your first name" required />
          </div>
          
          <div className="form-group">
            <label>Last Name <span className="req">(required)</span></label>
            <input type="text" placeholder="Enter your last name" required />
          </div>
          
          <div className="form-group">
            <label>Email Address <span className="req">(required)</span></label>
            <input type="email" placeholder="you@example.com" required />
          </div>
          
          <div className="form-group">
            <label>Password <span className="req">(required)</span></label>
            <input type="password" placeholder="Create a strong password" required />
          </div>
          
          <div className="form-group">
            <label>Confirm Password <span className="req">(required)</span></label>
            <input type="password" placeholder="Confirm your password" required />
          </div>
          
          <div className="form-group">
            <label>
              <input type="checkbox" required />
              I agree to the <a href="#" className="link">Terms of Service</a> and <a href="#" className="link">Privacy Policy</a>
            </label>
          </div>
          
          <button className="btn btn-primary btn-large" type="submit">
            Create Account
          </button>
          
          <p className="signup-login">
            Already have an account? <a href="#" className="link">Sign in here</a>
          </p>
        </form>
      </div>
    </section>
  </div>
);

export default SignUp;
