export const getWelcomeEmailTemplate = (fullName, confirmationCode) => {
  return {
    from: 'WebEmpire <onboarding@resend.dev>',
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

export const getRegistrationEmailTemplate = (fullName, email, password, confirmationCode) => {
  return {
    from: 'WebEmpire <onboarding@resend.dev>',
    subject: 'Welcome to Web Empire - Your Account Details',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1a1b2e; text-align: center;">Welcome to Web Empire!</h1>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Dear ${fullName},
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Thank you for registering with Web Empire! Your account has been created successfully. Here are your login credentials:
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #333; margin: 0;">
            <strong>Email:</strong> ${email}<br>
            <strong>Password:</strong> ${password}
          </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 16px; color: #333; margin: 0;">
            Your confirmation code is:
          </p>
          <p style="font-size: 24px; font-weight: bold; color: #1a1b2e; text-align: center; margin: 10px 0;">
            ${confirmationCode}
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Please use this code to verify your account. For security reasons, we recommend changing your password after your first login.
        </p>

        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeeba;">
          <p style="font-size: 16px; color: #856404; margin: 0;">
            <strong>Important:</strong> Keep this information secure and do not share it with anyone.
          </p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5; color: #333;">
          Best regards,<br>
          The Web Empire Team
        </p>
      </div>
    `
  };
};

const getPasswordResetTemplate = (resetUrl) => {
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

const getTestEmailTemplate = () => {
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

export { getPasswordResetTemplate, getTestEmailTemplate };