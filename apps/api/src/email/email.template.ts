/**
 * RinkLink.ai Unified Email Template
 *
 * This module provides a single, reusable HTML email template for all email types:
 * - Marketing emails
 * - Transactional emails (invitations, welcome, etc.)
 * - Support emails
 *
 * BRAND COLORS:
 * - Primary: #0c4066 (dark blue - header background)
 * - Secondary: #f0622b (orange - buttons, accents)
 *
 * USAGE:
 * ```typescript
 * import { buildEmailHtml, buildEmailText } from './email.template';
 *
 * const html = buildEmailHtml({
 *   subject: 'Welcome to RinkLink.ai',
 *   body: '<p>Thank you for signing up!</p><p>Click the button below to get started.</p>',
 *   preheader: 'Get started with RinkLink.ai today',
 * });
 *
 * const text = buildEmailText({
 *   subject: 'Welcome to RinkLink.ai',
 *   body: 'Thank you for signing up!\n\nClick the link below to get started.',
 * });
 * ```
 *
 * ADDING BUTTONS IN THE BODY:
 * Use the `buildButton` helper to create styled buttons:
 * ```typescript
 * import { buildButton } from './email.template';
 *
 * const buttonHtml = buildButton('Get Started', 'https://rinklink.ai/dashboard');
 * const body = `<p>Welcome!</p>${buttonHtml}`;
 * ```
 *
 * ADDING SECONDARY/OUTLINE BUTTONS:
 * ```typescript
 * const outlineButton = buildButton('Learn More', 'https://rinklink.ai/docs', 'outline');
 * ```
 */

// Brand colors
const COLORS = {
  primary: '#0c4066',
  secondary: '#f0622b',
  white: '#ffffff',
  lightGray: '#f5f5f5',
  mediumGray: '#718096',
  darkGray: '#333333',
  borderGray: '#e2e8f0',
} as const;

// Font stack for maximum email client compatibility
const FONT_STACK = "'Space Grotesk', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const BODY_FONT_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

export interface EmailTemplateParams {
  /** The email subject (also displayed in header area) */
  subject: string;
  /** HTML-safe body content - can include paragraphs, lists, buttons, etc. */
  body: string;
  /** Optional preheader text shown in email preview (before opening) */
  preheader?: string;
  /** Optional footer text to override default */
  footerText?: string;
  /** Optional: hide the header (for minimal emails) */
  hideHeader?: boolean;
}

export interface TextEmailParams {
  /** The email subject */
  subject: string;
  /** Plain text body content */
  body: string;
}

/**
 * Builds a styled CTA button for use in email body.
 *
 * @param text - Button text
 * @param href - Button link URL
 * @param variant - 'primary' (solid orange) or 'outline' (bordered)
 * @returns HTML string for the button
 *
 * @example
 * ```typescript
 * // Primary button (default)
 * buildButton('Accept Invitation', 'https://rinklink.ai/invite?token=abc123');
 *
 * // Outline button
 * buildButton('View Documentation', 'https://docs.rinklink.ai', 'outline');
 * ```
 */
export function buildButton(
  text: string,
  href: string,
  variant: 'primary' | 'outline' = 'primary',
): string {
  const isPrimary = variant === 'primary';

  const styles = isPrimary
    ? `background-color: ${COLORS.secondary}; color: ${COLORS.white}; border: 2px solid ${COLORS.secondary};`
    : `background-color: ${COLORS.white}; color: ${COLORS.secondary}; border: 2px solid ${COLORS.secondary};`;

  // Use table-based button for maximum email client compatibility
  return `
    <!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="10%" ${isPrimary ? `fillcolor="${COLORS.secondary}"` : 'fill="false"'} ${isPrimary ? '' : `strokecolor="${COLORS.secondary}"`} strokeweight="2px">
      <w:anchorlock/>
      <center style="color:${isPrimary ? COLORS.white : COLORS.secondary};font-family:${BODY_FONT_STACK};font-size:16px;font-weight:600;">${text}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 24px auto;">
      <tr>
        <td style="border-radius: 6px; ${styles}">
          <a href="${href}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: ${BODY_FONT_STACK}; font-size: 16px; font-weight: 600; text-decoration: none; ${styles} border-radius: 6px; text-align: center;">${text}</a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->
  `.trim();
}

/**
 * Builds a link fallback section for accessibility.
 * Shows the raw URL below a button for users who can't click buttons.
 *
 * @param href - The URL to display
 * @returns HTML string for the fallback link
 */
export function buildLinkFallback(href: string): string {
  return `
    <p style="margin: 16px 0 0 0; padding: 0; font-family: ${BODY_FONT_STACK}; font-size: 12px; line-height: 1.5; color: ${COLORS.mediumGray}; word-break: break-all;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${href}" style="color: ${COLORS.mediumGray};">${href}</a>
    </p>
  `.trim();
}

/**
 * Builds the complete HTML email using the unified RinkLink.ai template.
 *
 * Features:
 * - Table-based layout for maximum email client compatibility
 * - Inline critical styles
 * - Responsive design for mobile and desktop
 * - Branded header with RinkLink.ai logo treatment
 * - Accessible contrast ratios
 *
 * @param params - Email template parameters
 * @returns Complete HTML email string
 */
export function buildEmailHtml(params: EmailTemplateParams): string {
  const {
    subject,
    body,
    preheader = '',
    footerText,
    hideHeader = false,
  } = params;

  const currentYear = new Date().getFullYear();
  const defaultFooterText = `&copy; ${currentYear} RinkLink.ai. All rights reserved.`;

  // Preheader: hidden text that appears in email client preview
  const preheaderHtml = preheader
    ? `<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
       <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : '';

  // Header section with branded logo treatment
  const headerHtml = hideHeader
    ? ''
    : `
    <!--[if mso]>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.primary};">
      <tr>
        <td align="center" style="padding: 30px 20px;">
          <span style="font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: ${COLORS.white};">RinkLink</span><span style="font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: ${COLORS.secondary};">.ai</span>
        </td>
      </tr>
    </table>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.primary}; border-radius: 8px 8px 0 0;">
      <tr>
        <td align="center" style="padding: 30px 20px;">
          <span style="font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: ${COLORS.white};">RinkLink</span><span style="font-family: ${FONT_STACK}; font-size: 28px; font-weight: 700; color: ${COLORS.secondary};">.ai</span>
        </td>
      </tr>
    </table>
    <!--<![endif]-->
  `;

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no">
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    table { border-collapse: collapse; }
    td, th, div, p, a, h1, h2, h3, h4, h5, h6 { font-family: ${BODY_FONT_STACK}; }
  </style>
  <![endif]-->
  <style>
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      height: 100% !important;
    }
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .content-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #1a1a1a !important;
      }
      .email-container {
        background-color: #2d2d2d !important;
      }
      .email-content {
        background-color: #2d2d2d !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.lightGray}; font-family: ${BODY_FONT_STACK};">
  ${preheaderHtml}

  <!-- Email wrapper table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.lightGray};" class="email-body">
    <tr>
      <td align="center" style="padding: 20px 10px;">

        <!-- Main container -->
        <!--[if mso]>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center">
        <tr>
        <td>
        <![endif]-->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;" class="container email-container">

          <!-- Header -->
          <tr>
            <td>
              ${headerHtml}
            </td>
          </tr>

          <!-- Content area -->
          <tr>
            <td>
              <!--[if mso]>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.white};">
                <tr>
                  <td style="padding: 30px 40px;">
              <![endif]-->
              <!--[if !mso]><!-->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.white}; ${hideHeader ? 'border-radius: 8px;' : 'border-radius: 0 0 8px 8px;'}" class="email-content">
                <tr>
                  <td style="padding: 30px 40px;" class="content-padding">
              <!--<![endif]-->

                    <!-- Email body content -->
                    <div style="font-family: ${BODY_FONT_STACK}; font-size: 16px; line-height: 1.6; color: ${COLORS.darkGray};">
                      ${body}
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center;">
              <p style="margin: 0; padding: 0; font-family: ${BODY_FONT_STACK}; font-size: 12px; line-height: 1.5; color: ${COLORS.mediumGray};">
                ${footerText || defaultFooterText}
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Builds a plain text version of the email for accessibility and fallback.
 *
 * @param params - Text email parameters
 * @returns Plain text email string
 */
export function buildEmailText(params: TextEmailParams): string {
  const { subject, body } = params;
  const currentYear = new Date().getFullYear();

  return `
${subject}

${body}

---
(c) ${currentYear} RinkLink.ai. All rights reserved.
  `.trim();
}

/**
 * Helper to wrap text in a styled heading.
 *
 * @param text - Heading text
 * @param level - Heading level (1-3)
 * @returns HTML string for the heading
 */
export function buildHeading(text: string, level: 1 | 2 | 3 = 2): string {
  const sizes = { 1: '24px', 2: '20px', 3: '18px' };
  const margins = { 1: '0 0 20px 0', 2: '24px 0 16px 0', 3: '20px 0 12px 0' };

  return `<h${level} style="margin: ${margins[level]}; padding: 0; font-family: ${BODY_FONT_STACK}; font-size: ${sizes[level]}; font-weight: 600; color: ${COLORS.primary}; line-height: 1.3;">${text}</h${level}>`;
}

/**
 * Helper to wrap text in a styled paragraph.
 *
 * @param text - Paragraph text (can include HTML)
 * @returns HTML string for the paragraph
 */
export function buildParagraph(text: string): string {
  return `<p style="margin: 0 0 16px 0; padding: 0; font-family: ${BODY_FONT_STACK}; font-size: 16px; line-height: 1.6; color: ${COLORS.darkGray};">${text}</p>`;
}

/**
 * Helper to create a highlighted box (for warnings, info, etc.)
 *
 * @param content - Box content (can include HTML)
 * @param variant - 'info' (blue), 'warning' (yellow), or 'success' (green)
 * @returns HTML string for the box
 */
export function buildHighlightBox(
  content: string,
  variant: 'info' | 'warning' | 'success' = 'info',
): string {
  const colors = {
    info: { bg: '#e8f4fd', border: COLORS.primary },
    warning: { bg: '#fef3c7', border: '#f59e0b' },
    success: { bg: '#d1fae5', border: '#10b981' },
  };

  const { bg, border } = colors[variant];

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${bg}; border-left: 4px solid ${border}; border-radius: 0 4px 4px 0;">
          <div style="font-family: ${BODY_FONT_STACK}; font-size: 14px; line-height: 1.5; color: ${COLORS.darkGray};">
            ${content}
          </div>
        </td>
      </tr>
    </table>
  `.trim();
}

/**
 * Helper to create a code/monospace block (for API keys, etc.)
 *
 * @param content - Code content
 * @returns HTML string for the code block
 */
export function buildCodeBlock(content: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
      <tr>
        <td style="padding: 16px; background-color: ${COLORS.lightGray}; border: 1px solid ${COLORS.borderGray}; border-radius: 8px;">
          <code style="font-family: 'Monaco', 'Menlo', 'Courier New', monospace; font-size: 14px; line-height: 1.5; color: ${COLORS.darkGray}; word-break: break-all;">${content}</code>
        </td>
      </tr>
    </table>
  `.trim();
}

/**
 * Helper to create a badge/tag element.
 *
 * @param text - Badge text
 * @returns HTML string for the badge
 */
export function buildBadge(text: string): string {
  return `<span style="display: inline-block; padding: 4px 12px; background-color: ${COLORS.borderGray}; border-radius: 4px; font-family: ${BODY_FONT_STACK}; font-size: 14px; font-weight: 500; color: #4a5568;">${text}</span>`;
}
