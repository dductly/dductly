# Contact Form Setup Guide

The contact form is now set up and ready to send emails to admin@dductly.com. Here are the different options to make it work:

## Option 1: EmailJS (Recommended - Easiest)

1. Go to [EmailJS.com](https://www.emailjs.com/) and create a free account
2. Create a new service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{from_name}}` - Sender's full name
   - `{{from_email}}` - Sender's email
   - `{{message}}` - Message content
   - `{{to_email}}` - admin@dductly.com
4. Get your Service ID, Template ID, and Public Key
5. Update the constants in `frontend/src/services/contactService.ts`:
   ```typescript
   const EMAILJS_SERVICE_ID = 'your_service_id';
   const EMAILJS_TEMPLATE_ID = 'your_template_id';
   const EMAILJS_PUBLIC_KEY = 'your_public_key';
   ```
6. Change the import in `Contact.tsx` from `sendContactEmailSimple` to `sendContactEmail`

## Option 2: Webhook Service (Zapier/Make.com)

1. Create a Zapier or Make.com account
2. Set up a webhook trigger
3. Connect it to Gmail to send emails
4. Update the webhook URL in `contactService.ts`
5. Use `sendContactEmailWebhook` function

## Option 3: Backend API (Most Control)

1. Set up the backend server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. Configure email credentials in environment variables
3. Update the frontend to call your API endpoint

## Option 4: Supabase Edge Functions

1. Create a Supabase Edge Function for email sending
2. Use Supabase's email service or integrate with SendGrid/Mailgun
3. Call the function from the frontend

## Current Status

The contact form is currently using the demo version (`sendContactEmailSimple`) which:
- ✅ Shows success/error messages
- ✅ Validates form inputs
- ✅ Handles loading states
- ✅ Resets form after successful submission
- ⚠️ Only logs to console (doesn't actually send emails)

## Testing

1. Fill out the contact form
2. Check the browser console to see the logged email data
3. Once you set up a real email service, emails will be sent to admin@dductly.com

## Form Features

- **Real-time validation** - All fields are required
- **Loading states** - Button shows "Sending..." during submission
- **Success feedback** - Green success message after sending
- **Error handling** - Red error message if something goes wrong
- **Form reset** - Clears form after successful submission
- **Responsive design** - Works on all devices
