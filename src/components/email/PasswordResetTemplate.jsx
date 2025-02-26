export const getPasswordResetTemplate = (resetUrl) => {
  return `
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

      <p style="font-size: 14px; color: #666; margin-top: 40px; text-align: center;">
        This link will expire in 24 hours.
      </p>
    </div>
  `;
};