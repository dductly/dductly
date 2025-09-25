import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'admin@dductly.com', // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD, // Gmail App Password (not regular password)
  },
});

export const sendContactEmail = async (req: Request, res: Response) => {
  try {
    console.log('Contact form submission received');
    console.log('Environment check:');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***hidden***' : 'NOT SET');
    
    const { firstName, lastName, email, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    // Email content
    const mailOptions = {
      from: 'admin@dductly.com',
      to: 'admin@dductly.com',
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #556C77; padding-bottom: 10px;">
            New Contact Form Submission - dductly
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #556C77; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #556C77;">${email}</a></p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h3 style="color: #556C77; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p><em>This message was sent from the dductly contact form at ${req.headers.origin || 'your website'}.</em></p>
            <p><em>You can reply directly to this email to respond to ${firstName}.</em></p>
          </div>
        </div>
      `,
      replyTo: email,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully' 
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email' 
    });
  }
};
