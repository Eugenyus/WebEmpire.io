import React from 'react';

export const getConfirmationCodeEmailTemplate = (fullName, confirmationCode) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1a1b2e; text-align: center;">Welcome to Web Empire!</h1>
      
      <p style="font-size: 16px; line-height: 1.5; color: #333;">
        Dear ${fullName},
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
  `;
};

export default getConfirmationCodeEmailTemplate;