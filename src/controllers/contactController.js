const nodemailer = require('nodemailer');

// Email configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'abeyrathne.enterprises@gmail.com',
      pass: 'ctqdmewwmrgxcypm' // Gmail App Password
    }
  });
};

// @desc    Send contact form email
// @route   POST /api/contact
// @access  Public
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and message'
      });
    }

    // Create transporter
    const transporter = createTransporter();

    // Email to farm owner (notification)
    const ownerMailOptions = {
      from: 'abeyrathne.enterprises@gmail.com',
      to: 'abeyrathne.enterprises@gmail.com',
      subject: `New Contact Form Submission - ${subject || 'General Inquiry'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E40AF;">New Contact Form Submission</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Details:</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This message was sent from the Abeyrathne Enterprises Farm Management System contact form.
          </p>
        </div>
      `
    };

    // Auto-reply email to customer
    const customerMailOptions = {
      from: 'abeyrathne.enterprises@gmail.com',
      to: email,
      subject: 'Thank you for contacting Abeyrathne Enterprises',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1E40AF; margin: 0;">Abeyrathne Enterprises</h1>
            <p style="color: #6b7280; margin: 5px 0;">Farm Management System</p>
          </div>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1E40AF; margin-top: 0;">Thank you for your message!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you as soon as possible. Our team typically responds within 24 hours.</p>
          </div>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Your Message:</h3>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #1E40AF;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #166534; margin-top: 0;">Contact Information</h3>
            <p><strong>Address:</strong> No,222,Glahitiyawa,Kuliyapitiya</p>
            <p><strong>Email:</strong> abeyrathne.enterprises@gmail.com</p>
            <p><strong>Business Hours:</strong> Monday - Friday, 8:00 AM - 6:00 PM</p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated response. Please do not reply to this email.
            </p>
            <p style="color: #6b7280; font-size: 12px;">
              © 2024 Abeyrathne Enterprises. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(ownerMailOptions),
      transporter.sendMail(customerMailOptions)
    ]);

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! We have sent you a confirmation email and will get back to you soon.'
    });

  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: error.message
    });
  }
};

// @desc    Test email configuration
// @route   GET /api/contact/test
// @access  Public
const testEmailConfig = async (req, res) => {
  try {
    const transporter = createTransporter();
    
    // Test email
    const testMailOptions = {
      from: 'abeyrathne.enterprises@gmail.com',
      to: 'abeyrathne.enterprises@gmail.com',
      subject: 'Email Configuration Test - Abeyrathne Enterprises',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1E40AF;">Email Configuration Test</h2>
          <p>This is a test email to verify that the email configuration is working correctly.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Server:</strong> Abeyrathne Enterprises Farm Management System</p>
        </div>
      `
    };

    await transporter.sendMail(testMailOptions);

    res.status(200).json({
      success: true,
      message: 'Email configuration test successful! Check your inbox for the test email.'
    });

  } catch (error) {
    console.error('Error testing email configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Email configuration test failed. Please check your email settings.',
      error: error.message
    });
  }
};

module.exports = {
  sendContactEmail,
  testEmailConfig
};
