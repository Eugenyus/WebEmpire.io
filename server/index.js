import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Resend } from 'resend';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend
const resend = new Resend('re_4AMAiag5_AowayDcVYAnMJNq3C32KHW2q');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../dist')));

// Password reset endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, resetUrl } = req.body;

    if (!email || !resetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'WebEmpire <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a1b2e; text-align: center;">Password Reset Request</h1>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            We received a request to reset your WebEmpire password. Click the button below to reset your password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1a1b2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            If you didn't request this password reset, you can safely ignore this email.
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Best regards,<br>
            The WebEmpire Team
          </p>
        </div>
      `
    });

    if (error) {
      throw new Error(error.message);
    }

    res.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Password reset email failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send password reset email'
    });
  }
});

// Email sending endpoint
app.post('/api/email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'WebEmpire <onboarding@resend.dev>',
      to,
      subject,
      html
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('Email sent successfully:', data.id);
    res.json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send email'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});