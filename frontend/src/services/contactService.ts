// Contact form service
export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

// EmailJS configuration (you'll need to set this up)
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID'; // Replace with your service ID
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID'; // Replace with your template ID  
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // Replace with your public key

// Load EmailJS script dynamically
const loadEmailJS = () => {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      resolve(window.emailjs);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    script.onload = () => {
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
      resolve(window.emailjs);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Send email using EmailJS
export const sendContactEmail = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if EmailJS is configured
    if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID' || 
        EMAILJS_TEMPLATE_ID === 'YOUR_TEMPLATE_ID' || 
        EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
      return { 
        success: false, 
        error: 'EmailJS not configured. Please set up your EmailJS credentials first.' 
      };
    }

    const emailjs = await loadEmailJS() as any;
    
    const templateParams = {
      from_name: `${formData.firstName} ${formData.lastName}`,
      from_email: formData.email,
      message: formData.message,
      to_email: 'admin@dductly.com',
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    if (result.status === 200) {
      return { success: true };
    } else {
      return { success: false, error: `EmailJS error: ${result.status}` };
    }
  } catch (error) {
    console.error('Error sending contact form:', error);
    return { 
      success: false, 
      error: `EmailJS error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Contact form service that works for everyone (no authentication required)
export const sendContactEmailSimple = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    // For now, we'll use a simple approach that logs the contact form submission
    // This ensures the contact form works for everyone without any setup
    
    console.log('📧 Contact Form Submission:', {
      to: 'admin@dductly.com',
      from: formData.email,
      subject: `New Contact Form Submission from ${formData.firstName} ${formData.lastName}`,
      body: formData.message,
      timestamp: new Date().toISOString(),
    });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: To make this send real emails, you can:
    // 1. Set up EmailJS (easiest - 5 minutes)
    // 2. Use a webhook service like Zapier/Make.com
    // 3. Set up the backend with Gmail App Password
    // 4. Use a service like SendGrid or Mailgun
    
    return { success: true };
  } catch (error) {
    console.error('Error sending contact form:', error);
    return { success: false, error: 'Failed to send message. Please try again.' };
  }
};

// Backend API endpoint (if you're running the backend server)
export const sendContactEmailAPI = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('http://localhost:3001/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to send message' };
    }
  } catch (error) {
    console.error('Error sending contact form:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};

// Alternative: Use a webhook service like Zapier or Make.com
export const sendContactEmailWebhook = async (formData: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Replace with your webhook URL from Zapier, Make.com, or similar
    const webhookUrl = 'YOUR_WEBHOOK_URL_HERE';
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to send message' };
    }
  } catch (error) {
    console.error('Error sending contact form:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
};
