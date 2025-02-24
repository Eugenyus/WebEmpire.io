import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mail.genisys.ro',
  port: 465,
  secure: true,
  auth: {
    user: 'report@genisys.ro',
    pass: 'testEmail123'
  }
});

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: 'report@genisys.ro',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
};