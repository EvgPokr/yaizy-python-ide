import nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'https://ide.yaizy.io'}/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"YaizY Python IDE" <noreply@yaizy.io>',
      to: email,
      subject: 'Password Reset - YaizY Python IDE',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6600 0%, #00A8FF 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">YaizY Python IDE</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              You requested to reset your password. Click the button below to set a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 14px 32px; background: #00A8FF; color: white; 
                        text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6;">
              Or copy this link to your browser:<br>
              <a href="${resetUrl}" style="color: #00A8FF; word-break: break-all;">${resetUrl}</a>
            </p>
            
            <p style="color: #999; font-size: 13px; margin-top: 30px;">
              This link will expire in 1 hour.<br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
            © 2026 YaizY. All rights reserved.
          </div>
        </div>
      `,
      text: `
Password Reset Request

You requested to reset your password. Use this link to set a new password:

${resetUrl}

This link will expire in 1 hour.
If you didn't request this, please ignore this email.

© 2026 YaizY
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
}

export const emailService = new EmailService();
