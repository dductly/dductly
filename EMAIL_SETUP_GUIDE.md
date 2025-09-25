# 📧 Real Email Service Setup Guide

Your contact form is now configured to send real emails to admin@dductly.com! Follow these steps to get it working:

## 🚀 Quick Setup (5 minutes)

### Step 1: Set up Gmail App Password

1. **Go to your Google Account**: [myaccount.google.com](https://myaccount.google.com)
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → **Generate app password**
4. **Select app**: "Mail"
5. **Select device**: "Other (custom name)" → "dductly-backend"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Backend

1. **Create environment file**:
   ```bash
   cd backend
   echo "EMAIL_APP_PASSWORD=your_16_character_app_password_here" > .env
   echo "PORT=3001" >> .env
   ```

2. **Replace the password** in `.env` with your actual Gmail app password

### Step 3: Start Backend Server

```bash
cd backend
npm run dev
```

You should see: `Server is running on port 3001`

### Step 4: Test the Contact Form

1. **Start your frontend** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Fill out the contact form** and submit
3. **Check admin@dductly.com** for the email!

## 🔧 Alternative: Use Your Own Email

If you want to use a different email address:

1. **Update `backend/src/routes/contact.ts`**:
   ```typescript
   const transporter = nodemailer.createTransporter({
     service: 'gmail',
     auth: {
       user: 'your-email@gmail.com', // Your Gmail address
       pass: process.env.EMAIL_APP_PASSWORD, // Your app password
     },
   });
   ```

2. **Update the `from` and `to` fields** in the same file

## 📧 What the Email Looks Like

The emails will be professionally formatted with:
- ✅ Contact details (name, email, date)
- ✅ Full message content
- ✅ Reply-to functionality (you can reply directly)
- ✅ Professional styling matching your brand
- ✅ Timestamp and source information

## 🐛 Troubleshooting

### "Authentication failed" error:
- Make sure you're using an **App Password**, not your regular Gmail password
- Ensure 2-Step Verification is enabled on your Google account

### "Connection refused" error:
- Make sure the backend server is running (`npm run dev` in backend folder)
- Check that port 3001 is not blocked

### "Failed to send message" error:
- Check the backend console for detailed error messages
- Verify your Gmail app password is correct

## 🎉 Success!

Once set up, every contact form submission will:
1. ✅ Send a real email to admin@dductly.com
2. ✅ Include all contact details and message
3. ✅ Allow you to reply directly to the customer
4. ✅ Show success message to the user

## 📱 Testing

1. Fill out the contact form
2. Check your email (admin@dductly.com)
3. Reply to test the reply-to functionality
4. Check spam folder if email doesn't arrive

Your contact form is now production-ready! 🚀

