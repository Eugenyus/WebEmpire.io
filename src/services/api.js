const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3000';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await fetch(`${API_URL}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        to, 
        subject, 
        html
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to send email');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error.message || 'Network error occurred'
    };
  }
};