import React from 'react';

export const getTestEmailTemplate = () => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1b2e; text-align: center;">Test Email</h1>
      <p style="font-size: 16px; line-height: 1.5; color: #333;">
        This is a test email to verify that the email service is working correctly.
      </p>
      <p style="font-size: 16px; line-height: 1.5; color: #333;">
        If you received this email, it means the email service is configured and working properly.
      </p>
      <p style="font-size: 16px; line-height: 1.5; color: #666; margin-top: 20px;">
        Sent at: ${new Date().toLocaleString()}
      </p>
    </div>
  `;
};