import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

interface InvitationEmailParams {
  to: string;
  invitationToken: string;
  associationName: string;
  inviterName?: string;
  role: string;
}

interface ContactEmailParams {
  fromEmail: string;
  subject: string;
  message: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  private createTransporter(): nodemailer.Transporter {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'false', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInvitationEmail(params: InvitationEmailParams): Promise<boolean> {
    const { to, invitationToken, associationName, inviterName, role } = params;
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const inviteUrl = `${appUrl}/auth/invite-accept?token=${invitationToken}`;

    const html = this.buildInvitationHtml({
      associationName,
      inviterName,
      role,
      inviteUrl,
    });

    try {
      await this.transporter.sendMail({
        from: `"Welcome to RinkLink.ai" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject: `You're invited to join ${associationName} on RinkLink.ai`,
        html,
        text: this.buildInvitationText({
          associationName,
          inviterName,
          role,
          inviteUrl,
        }),
      });
      return true;
    } catch (error) {
      console.error('Error sending invitation email:', error);
      return false;
    }
  }

  private buildInvitationHtml(params: {
    associationName: string;
    inviterName?: string;
    role: string;
    inviteUrl: string;
  }): string {
    const { associationName, inviterName, role, inviteUrl } = params;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .content h2 {
              color: #1a365d;
              margin-top: 0;
            }
            .button { 
              display: inline-block; 
              background: #3182ce; 
              color: white !important; 
              padding: 14px 28px; 
              text-decoration: none; 
              border-radius: 6px; 
              font-weight: 600; 
              margin: 20px 0; 
            }
            .role-badge { 
              display: inline-block; 
              background: #e2e8f0; 
              padding: 4px 12px; 
              border-radius: 4px; 
              font-size: 14px;
              font-weight: 500;
              color: #4a5568;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #718096; 
              font-size: 12px; 
            }
            .link-fallback {
              word-break: break-all;
              color: #718096;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏒 RinkLink.ai</h1>
            </div>
            <div class="content">
              <h2>You're Invited!</h2>
              <p>
                ${inviterName ? `<strong>${inviterName}</strong> has invited you` : 'You have been invited'} 
                to join <strong>${associationName}</strong> on RinkLink.ai.
              </p>
              <p>
                Your role: <span class="role-badge">${role}</span>
              </p>
              <p>Click the button below to accept the invitation and create your account:</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #718096; font-size: 14px;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p class="link-fallback">
                If the button doesn't work, copy and paste this link into your browser:<br>
                ${inviteUrl}
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} RinkLink.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private buildInvitationText(params: {
    associationName: string;
    inviterName?: string;
    role: string;
    inviteUrl: string;
  }): string {
    const { associationName, inviterName, role, inviteUrl } = params;

    return `
RinkLink.ai - You're Invited!

${inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join ${associationName} on RinkLink.ai.

Your role: ${role}

Click the link below to accept the invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} RinkLink.ai. All rights reserved.
    `.trim();
  }

  // Verify SMTP connection on startup
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }

  async sendContactEmail(params: ContactEmailParams): Promise<boolean> {
    const { fromEmail, subject, message } = params;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set');
      return false;
    }

    const html = this.buildContactHtml({ fromEmail, subject, message });

    try {
      await this.transporter.sendMail({
        from: `"RinkLink.ai Contact Form" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: adminEmail,
        replyTo: fromEmail,
        subject: `[Contact Form] ${subject}`,
        html,
        text: this.buildContactText({ fromEmail, subject, message }),
      });
      return true;
    } catch (error) {
      console.error('Error sending contact email:', error);
      return false;
    }
  }

  private buildContactHtml(params: {
    fromEmail: string;
    subject: string;
    message: string;
  }): string {
    const { fromEmail, subject, message } = params;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content { 
              background: white; 
              padding: 30px; 
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .content h2 {
              color: #1a365d;
              margin-top: 0;
            }
            .field-label {
              font-weight: 600;
              color: #4a5568;
              margin-bottom: 4px;
            }
            .field-value {
              background: #f7fafc;
              padding: 12px;
              border-radius: 4px;
              margin-bottom: 16px;
              border-left: 3px solid #3182ce;
            }
            .message-content {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
            .footer { 
              text-align: center; 
              margin-top: 20px; 
              color: #718096; 
              font-size: 12px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏒 RinkLink.ai Contact Form</h1>
            </div>
            <div class="content">
              <h2>New Contact Message</h2>
              
              <div class="field-label">From:</div>
              <div class="field-value">${fromEmail}</div>
              
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
              
              <div class="field-label">Message:</div>
              <div class="field-value message-content">${message}</div>
            </div>
            <div class="footer">
              <p>This message was sent via the RinkLink.ai contact form.</p>
              <p>© ${new Date().getFullYear()} RinkLink.ai. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private buildContactText(params: {
    fromEmail: string;
    subject: string;
    message: string;
  }): string {
    const { fromEmail, subject, message } = params;

    return `
RinkLink.ai Contact Form - New Message

From: ${fromEmail}
Subject: ${subject}

Message:
${message}

---
This message was sent via the RinkLink.ai contact form.
© ${new Date().getFullYear()} RinkLink.ai. All rights reserved.
    `.trim();
  }
}
