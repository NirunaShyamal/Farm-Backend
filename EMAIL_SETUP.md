# Email Setup Guide for Contact Form

## 📧 Email Configuration

The contact form system is now fully implemented and ready to use! You just need to configure your email credentials.

### 🔧 Setup Steps

#### 1. Choose Your Email Provider

**Option A: Gmail (Recommended)**
- Most reliable and widely used
- Requires App Password (not regular password)

**Option B: Outlook/Hotmail**
- Good alternative to Gmail
- Also requires App Password

**Option C: Other Providers**
- Yahoo, iCloud, etc.
- Check provider's SMTP settings

#### 2. Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Turn on 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Enter "Farm Management System"
   - Copy the generated 16-character password

3. **Update Environment Variables**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   FARM_EMAIL=abeyrathne.enterprises@gmail.com
   ```

#### 3. Outlook Setup

1. **Enable 2-Factor Authentication**
2. **Generate App Password**
   - Go to Microsoft Account Security
   - Create new app password
3. **Update Environment Variables**
   ```env
   EMAIL_USER=your-email@outlook.com
   EMAIL_PASS=your-app-password
   FARM_EMAIL=abeyrathne.enterprises@gmail.com
   ```

### 🧪 Testing

After setting up credentials, test the email system:

1. **Test Email Configuration**
   ```bash
   curl http://localhost:5000/api/contact/test
   ```

2. **Test Contact Form**
   - Go to http://localhost:5173/contact
   - Fill out and submit the form
   - Check both your inbox and the farm email

### 📋 Features

✅ **Dual Email System**
- Notification email sent to farm owner
- Auto-reply email sent to customer

✅ **Professional Templates**
- HTML formatted emails
- Farm branding and contact info
- Customer's original message included

✅ **Error Handling**
- Graceful failure handling
- User-friendly error messages
- Detailed logging for debugging

✅ **Security**
- Environment variable protection
- App password authentication
- Input validation and sanitization

### 🔍 Troubleshooting

**Common Issues:**

1. **"Invalid login" Error**
   - Make sure you're using App Password, not regular password
   - Verify 2FA is enabled
   - Check email address is correct

2. **"Connection timeout" Error**
   - Check internet connection
   - Verify firewall settings
   - Try different email provider

3. **"Authentication failed" Error**
   - Regenerate App Password
   - Wait 5-10 minutes after creating App Password
   - Check for typos in credentials

### 📞 Support

If you need help with email setup:
1. Check the error logs in the terminal
2. Verify your email provider's SMTP settings
3. Test with a different email provider

### 🚀 Ready to Use!

Once configured, the contact form will:
- Send professional notifications to farm staff
- Provide instant confirmation to customers
- Maintain a record of all inquiries
- Handle errors gracefully

The system is production-ready and will scale with your business needs!








