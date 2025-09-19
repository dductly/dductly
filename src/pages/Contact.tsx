import React from "react";

const Contact: React.FC = () => (
  <section id="contact" className="section contact">
    <div className="contact-left">
      <h2 className="section-title">Contact Us</h2>
      <p>Interested in using our service? 
        <br />Fill out some info and we will be in touch shortly. We can’t wait to hear from you!</p>
    </div>

    <form className="contact-form" onSubmit={(e)=>e.preventDefault()}>
      <label>Name <span className="req">(required)</span></label>
      <div className="row">
        <input placeholder="First Name" required />
        <input placeholder="Last Name" required />
      </div>
      <label>Email <span className="req">(required)</span></label>
      <input type="email" placeholder="you@example.com" required />
      <label>Message <span className="req">(required)</span></label>
      <textarea rows={6} placeholder="How can we help?" required />
      <button className="btn btn-primary" type="submit">Send</button>
    </form>
  </section>
);

export default Contact;