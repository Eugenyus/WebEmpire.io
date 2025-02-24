export const getWelcomeEmailTemplate = (fullName, confirmationCode) => {
  return {
    subject: 'Welcome to Web Empire - Please Confirm Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1b2e; text-align: center;">Welcome to Web Empire!</h1>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Dear ${fullName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Thank you for joining Web Empire! We're excited to have you on board and help you build your passive income streams.
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #333; margin: 0;">
            Your confirmation code is:
          </p>
          <p style="font-size: 24px; font-weight: bold; color: #1a1b2e; text-align: center; margin: 10px 0;">
            ${confirmationCode}
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Please use this code to verify your account and start your journey with us.
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Best regards,<br>
          The Web Empire Team
        </p>
      </div>
    `
  };
};

export const getPasswordResetTemplate = (fullName) => {
  return {
    subject: 'Reset Your Web Empire Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1b2e; text-align: center;">Password Reset Request</h1>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Dear ${fullName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          We received a request to reset your Web Empire password. Click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{ .ConfirmationURL }}" 
             style="background-color: #1a1b2e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Best regards,<br>
          The Web Empire Team
        </p>
      </div>
    `
  };
};