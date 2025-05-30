const API_URL = 'https://genisys.ro/smtp/';

import { getTestEmailTemplate } from '../components/email/TestEmailTemplate';
import { getPasswordResetTemplate } from '../components/email/PasswordResetTemplate';
import { getRegistrationEmailTemplate } from '../components/email/RegistrationTemplate';
import { createPasswordResetToken } from '../utils/passwordReset';

export const sendEmail = async ({ name, email, html_message, subject }) => {
  try {
    if (!email || !html_message || !subject) {
      throw new Error('Missing required email fields');
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        subject,
        message: html_message
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to send email');
    }
    
    return { 
      success: true, 
      data: data.data 
    };
  } catch (error) {
    console.error('Email sending error:', error.message);
    return { 
      success: false, 
      error: error.message || 'Failed to send email'
    };
  }
};

export const sendTestEmail = async (email) => {
  return sendEmail({
    name: 'WebEmpire Test',
    email,
    subject: 'Test Email from WebEmpire',
    html_message: getTestEmailTemplate()
  });
};

export const sendPasswordResetEmail = async (email) => {
  try {
    // Create a reset token and store it in the database
    const { success, token, error } = await createPasswordResetToken(email);
    
    if (!success || !token) {
      throw new Error(error || 'Failed to create reset token');
    }
    
    // Generate reset URL with the token
    const resetUrl = `${window.location.origin}/reset-password?token=${token}`;

    // Send the email with the reset link
    const emailResult = await sendEmail({
      name: 'WebEmpire Password Reset',
      email,
      subject: 'Reset Your WebEmpire Password',
      html_message: getPasswordResetTemplate(resetUrl)
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send password reset email');
    }

    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendRegistrationEmail = async (fullName, email, password, confirmationCode) => {
  try {
    const emailResult = await sendEmail({
      name: 'WebEmpire Registration',
      email,
      subject: 'Welcome to Web Empire - Your Account Details',
      html_message: getRegistrationEmailTemplate(fullName, email, password, confirmationCode)
    });

    if (!emailResult.success) {
      throw new Error(emailResult.error || 'Failed to send registration email');
    }

    return { success: true };
  } catch (error) {
    console.error('Registration email error:', error);
    return { success: false, error: error.message };
  }
};