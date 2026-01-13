import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  buildEmailHtml,
  buildButton,
  buildLinkFallback,
  buildHeading,
  buildParagraph,
  buildHighlightBox,
  buildCodeBlock,
  buildBadge,
} from './email.template';

/**
 * Parameters for sending a generic email using the unified template.
 */
export interface SendEmailParams {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body content (can use template helpers) */
  body: string;
  /** Plain text body for fallback (optional - will be auto-generated if not provided) */
  textBody?: string;
  /** Preheader text shown in email preview */
  preheader?: string;
  /** Custom from name (optional - defaults to "RinkLink.ai") */
  fromName?: string;
  /** Reply-to email address (optional) */
  replyTo?: string;
}

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

/**
 * Parameters for welcome email with API key.
 */
export interface WelcomeEmailParams {
  to: string;
  apiKey: string;
  dashboardUrl: string;
}

/**
 * Parameters for magic link email.
 */
export interface MagicLinkEmailParams {
  to: string;
  magicLinkUrl: string;
  expiryMinutes?: number;
}

/**
 * Email Service
 *
 * Provides a unified email sending interface for all RinkLink.ai emails.
 * Uses a single branded HTML template for consistency across:
 * - Transactional emails (invitations, welcome, password reset)
 * - Marketing emails
 * - Support emails
 *
 * USAGE:
 * ```typescript
 * // Simple email
 * await emailService.sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to RinkLink.ai',
 *   body: buildParagraph('Thank you for joining!') + buildButton('Get Started', 'https://rinklink.ai'),
 * });
 *
 * // Invitation email (convenience method)
 * await emailService.sendInvitationEmail({
 *   to: 'user@example.com',
 *   invitationToken: 'abc123',
 *   associationName: 'Hockey League',
 *   role: 'Manager',
 * });
 * ```
 *
 * TEMPLATE HELPERS (exported from email.template.ts):
 * - buildButton(text, href, variant) - CTA buttons
 * - buildHeading(text, level) - Styled headings
 * - buildParagraph(text) - Styled paragraphs
 * - buildHighlightBox(content, variant) - Info/warning/success boxes
 * - buildCodeBlock(content) - Monospace code blocks
 * - buildBadge(text) - Inline badge/tag
 * - buildLinkFallback(href) - URL fallback for buttons
 */
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

  /**
   * Returns the nodemailer transporter instance.
   * Used internally and by other services that need direct access.
   */
  getTransporter(): nodemailer.Transporter {
    return this.transporter;
  }

  /**
   * Sends an email using the unified RinkLink.ai template.
   *
   * This is the primary method for sending any type of email.
   * Use the template helper functions to build the body content.
   *
   * @param params - Email parameters
   * @returns Promise resolving to true if sent successfully, false otherwise
   *
   * @example
   * ```typescript
   * // Simple notification
   * await emailService.sendEmail({
   *   to: 'user@example.com',
   *   subject: 'Your report is ready',
   *   body: buildParagraph('Your weekly report has been generated.') +
   *         buildButton('View Report', 'https://rinklink.ai/reports/123'),
   *   preheader: 'Weekly report for Jan 1-7',
   * });
   *
   * // With warning box
   * await emailService.sendEmail({
   *   to: 'user@example.com',
   *   subject: 'Action Required',
   *   body: buildHeading('Subscription Expiring') +
   *         buildHighlightBox('Your subscription will expire in 7 days.', 'warning') +
   *         buildButton('Renew Now', 'https://rinklink.ai/billing'),
   * });
   * ```
   */
  async sendEmail(params: SendEmailParams): Promise<boolean> {
    const { to, subject, body, textBody, preheader, fromName, replyTo } = params;

    const html = buildEmailHtml({
      subject,
      body,
      preheader,
    });

    // Auto-generate plain text if not provided
    const text = textBody || this.stripHtmlToText(body, subject);

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: `"${fromName || 'RinkLink.ai'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text,
      };

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Sends an invitation email to join an association.
   *
   * @param params - Invitation parameters
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendInvitationEmail(params: InvitationEmailParams): Promise<boolean> {
    const { to, invitationToken, associationName, inviterName, role } = params;
    const appUrl = process.env.APP_URL || 'http://localhost:4200';
    const inviteUrl = `${appUrl}/auth/invite-accept?token=${invitationToken}`;

    const body = `
      ${buildHeading("You're Invited!", 2)}
      ${buildParagraph(
        inviterName
          ? `<strong>${inviterName}</strong> has invited you to join <strong>${associationName}</strong> on RinkLink.ai.`
          : `You have been invited to join <strong>${associationName}</strong> on RinkLink.ai.`
      )}
      ${buildParagraph(`Your role: ${buildBadge(role)}`)}
      ${buildParagraph('Click the button below to accept the invitation and create your account:')}
      ${buildButton('Accept Invitation', inviteUrl)}
      ${buildHighlightBox(
        'This invitation will expire in 7 days. If you didn\'t expect this invitation, you can safely ignore this email.',
        'info'
      )}
      ${buildLinkFallback(inviteUrl)}
    `;

    const textBody = `
You're Invited!

${inviterName ? `${inviterName} has invited you` : 'You have been invited'} to join ${associationName} on RinkLink.ai.

Your role: ${role}

Click the link below to accept the invitation and create your account:
${inviteUrl}

This invitation will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.
    `.trim();

    return this.sendEmail({
      to,
      subject: `You're invited to join ${associationName} on RinkLink.ai`,
      body,
      textBody,
      preheader: `${inviterName || 'Someone'} invited you to join ${associationName}`,
      fromName: 'RinkLink.ai',
    });
  }

  /**
   * Sends a contact form submission to the admin.
   *
   * @param params - Contact form parameters
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendContactEmail(params: ContactEmailParams): Promise<boolean> {
    const { fromEmail, subject, message } = params;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable is not set');
      return false;
    }

    const body = `
      ${buildHeading('New Contact Message', 2)}
      ${buildParagraph(`<strong>From:</strong> ${fromEmail}`)}
      ${buildParagraph(`<strong>Subject:</strong> ${subject}`)}
      ${buildHighlightBox(`<strong>Message:</strong><br /><br />${message.replace(/\n/g, '<br />')}`, 'info')}
    `;

    const textBody = `
New Contact Message

From: ${fromEmail}
Subject: ${subject}

Message:
${message}

---
This message was sent via the RinkLink.ai contact form.
    `.trim();

    return this.sendEmail({
      to: adminEmail,
      subject: `[Contact Form] ${subject}`,
      body,
      textBody,
      preheader: `Contact form submission from ${fromEmail}`,
      fromName: 'RinkLink.ai Contact Form',
      replyTo: fromEmail,
    });
  }

  /**
   * Sends a welcome email with API key to new developer subscribers.
   *
   * @param params - Welcome email parameters
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendWelcomeEmail(params: WelcomeEmailParams): Promise<boolean> {
    const { to, apiKey, dashboardUrl } = params;

    const body = `
      ${buildHeading('Welcome to the RinkLink.ai API', 2)}
      ${buildParagraph('Thank you for subscribing to the RinkLink.ai Developer API. Here is your API key:')}
      ${buildCodeBlock(apiKey)}
      ${buildHighlightBox(
        '<strong>Important:</strong> This is the only time your full API key will be shown. Please store it securely. If you lose it, you\'ll need to generate a new one from your dashboard.',
        'warning'
      )}
      ${buildHeading('Quick Start', 3)}
      ${buildParagraph('Include your API key in the <code>x-api-key</code> header of your requests:')}
      ${buildCodeBlock(`curl -H "x-api-key: ${apiKey}" \\<br />&nbsp;&nbsp;https://api.rinklink.ai/v1/tournaments`)}
      ${buildButton('Go to Dashboard', dashboardUrl)}
      ${buildHeading('Pricing', 3)}
      ${buildParagraph('You are billed $0.05 per API request. View your usage and estimated costs in your dashboard.')}
    `;

    const textBody = `
Welcome to the RinkLink.ai API

Thank you for subscribing to the RinkLink.ai Developer API. Here is your API key:

${apiKey}

IMPORTANT: This is the only time your full API key will be shown. Please store it securely. If you lose it, you'll need to generate a new one from your dashboard.

Quick Start
-----------
Include your API key in the x-api-key header of your requests:

curl -H "x-api-key: ${apiKey}" \\
  https://api.rinklink.ai/v1/tournaments

Go to your dashboard: ${dashboardUrl}

Pricing
-------
You are billed $0.05 per API request. View your usage and estimated costs in your dashboard.
    `.trim();

    return this.sendEmail({
      to,
      subject: 'Welcome to RinkLink.ai API - Your API Key',
      body,
      textBody,
      preheader: 'Your API key is ready - start building!',
      fromName: 'RinkLink.ai Developer',
    });
  }

  /**
   * Sends a magic link email for passwordless authentication.
   *
   * @param params - Magic link email parameters
   * @returns Promise resolving to true if sent successfully, false otherwise
   */
  async sendMagicLinkEmail(params: MagicLinkEmailParams): Promise<boolean> {
    const { to, magicLinkUrl, expiryMinutes = 15 } = params;

    const body = `
      ${buildHeading('Sign In to Your Account', 2)}
      ${buildParagraph('Click the button below to sign in to your RinkLink.ai Developer Portal:')}
      ${buildButton('Sign In', magicLinkUrl)}
      ${buildHighlightBox(
        `This link will expire in ${expiryMinutes} minutes. If you didn't request this login link, you can safely ignore this email.`,
        'info'
      )}
      ${buildLinkFallback(magicLinkUrl)}
    `;

    const textBody = `
Sign In to Your Account

Click the link below to sign in to your RinkLink.ai Developer Portal:

${magicLinkUrl}

This link will expire in ${expiryMinutes} minutes.

If you didn't request this login link, you can safely ignore this email.
    `.trim();

    return this.sendEmail({
      to,
      subject: 'Sign in to RinkLink.ai Developer Portal',
      body,
      textBody,
      preheader: 'Your secure login link',
      fromName: 'RinkLink.ai Developer',
    });
  }

  /**
   * Verifies the SMTP connection on startup.
   *
   * @returns Promise resolving to true if connection is valid, false otherwise
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('SMTP connection verified');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }

  /**
   * Strips HTML tags and converts to plain text.
   * Used for auto-generating text versions of emails.
   *
   * @param html - HTML content
   * @param subject - Email subject for header
   * @returns Plain text version
   */
  private stripHtmlToText(html: string, subject: string): string {
    return `${subject}\n\n${html
      // Replace <br> and </p> with newlines
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      // Replace buttons/links with their href
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$2: $1')
      // Remove all other HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&copy;/g, '(c)')
      // Clean up whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()}`;
  }
}

// Re-export template helpers for convenience
export {
  buildButton,
  buildLinkFallback,
  buildHeading,
  buildParagraph,
  buildHighlightBox,
  buildCodeBlock,
  buildBadge,
  buildEmailHtml,
  buildEmailText,
} from './email.template';
