const { sendEmail } = require("../config/brevo");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Email Service
 * Handles all email communications including OTP and password-reset emails.
 */
class EmailService {
  /* ------------------------------------------------------------------ */
  /*  SHARED HELPERS                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Shared CSS injected into every email template.
   * Keeps the visual language consistent across all transactional mails.
   */
  static get _baseStyles() {
    return `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
        padding: 40px 20px;
        min-height: 100vh;
      }
      .container {
        max-width: 480px;
        margin: 0 auto;
        background: #1e1e2f;
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      }
      .content { padding: 40px 30px; }
      .greeting { color: #e2e8f0; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
      .message  { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 30px; }
      .otp-label {
        color: #94a3b8; font-size: 13px;
        text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;
      }
      .otp-code {
        font-size: 42px; font-weight: 800; letter-spacing: 12px;
        text-shadow: 0 0 20px rgba(212,175,55,0.45);
        font-family: 'Courier New', monospace;
      }
      .expiry {
        font-size: 14px; margin-top: 20px;
        display: flex; align-items: center; justify-content: center; gap: 6px;
        color: #f59e0b;
      }
      .divider { height: 1px; background: rgba(255,255,255,0.08); margin: 30px 0; }
      .warning { color: #64748b; font-size: 13px; line-height: 1.6; }
      .warning strong { color: #e2e8f0; }
      .footer { background: rgba(0,0,0,0.2); padding: 25px 30px; text-align: center; }
      .footer-text { color: #64748b; font-size: 12px; }
      .support { color: #475569; font-size: 12px; margin-top: 8px; }
      @media (max-width: 520px) {
        body { padding: 20px 10px; }
        .content { padding: 30px 20px; }
        .otp-code { font-size: 36px; letter-spacing: 8px; }
      }
    `;
  }

  /* ------------------------------------------------------------------ */
  /*  SIGNUP OTP EMAIL                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Generate HTML for the signup OTP email (gold-accent palette).
   */
  static generateOtpTemplate({ name, otp, expiryMinutes = 5 }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Cine Script AI</title>
  <style>
    ${EmailService._baseStyles}
    .header {
      background: linear-gradient(135deg, #e94560 0%, #ff6b6b 100%);
      padding: 40px 30px; text-align: center;
    }
    .logo { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .logo span { font-size: 32px; }
    .tagline { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 6px; letter-spacing: 0.5px; }
    .otp-container {
      background: linear-gradient(135deg, rgba(233,69,96,0.15) 0%, rgba(255,107,107,0.1) 100%);
      border: 1px solid rgba(233,69,96,0.3);
      border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;
    }
    .otp-code { color: #e94560; }
    .footer-brand { color: #e94560; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span>&#127909;</span> Cine Script AI</div>
      <div class="tagline">TRANSFORM MOMENTS INTO CINEMA</div>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${name}!</div>
      <div class="message">
        Welcome to Cine Script AI, where everyday moments become blockbuster scripts.
        Use the verification code below to complete your signup.
      </div>
      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">
          <span>&#9203;</span>
          <span>Expires in ${expiryMinutes} minutes</span>
        </div>
      </div>
      <div class="divider"></div>
      <div class="warning">
        <strong>Security Notice:</strong> Never share this code with anyone.
        Our team will never ask for your OTP. If you didn't request this code,
        please ignore this email.
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">
        Crafted with <span style="color:#e94560;">&#9829;</span> by
        <span class="footer-brand">Cine Script AI</span>
      </div>
      <div class="support">Need help? Contact our support team</div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Send OTP verification email (signup).
   */
  static async sendOtpEmail({ to, name, otp, expiryMinutes = 5 }) {
    try {
      const htmlContent = this.generateOtpTemplate({
        name,
        otp,
        expiryMinutes,
      });
      const textContent = `
Cine Script AI - Email Verification

Hello, ${name}!

Your verification code is: ${otp}

This code will expire in ${expiryMinutes} minutes.

If you didn't request this code, please ignore this email.

---
Cine Script AI - Transform Moments Into Cinema
      `.trim();

      const result = await sendEmail({
        to,
        toName: name,
        subject: `${otp} - Your Cine Script AI Verification Code`,
        htmlContent,
        textContent,
      });

      logger.info("OTP email sent successfully", {
        email: to,
        messageId: result.messageId,
      });
      return result;
    } catch (error) {
      logger.error("Failed to send OTP email", {
        email: to,
        error: error.message,
      });
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  FORGOT-PASSWORD OTP EMAIL                                          */
  /* ------------------------------------------------------------------ */

  /**
   * Generate HTML for the password-reset OTP email (gold/amber palette).
   * Intentionally different header colour from signup so users can tell
   * the two apart at a glance.
   */
  static generateForgotPasswordOtpTemplate({ name, otp, expiryMinutes = 5 }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Cine Script AI</title>
  <style>
    ${EmailService._baseStyles}
    /* Gold/amber accent — distinct from the signup red */
    .header {
      background: linear-gradient(135deg, #b8860b 0%, #d4af37 60%, #f5c842 100%);
      padding: 40px 30px; text-align: center;
    }
    .logo { font-size: 28px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; }
    .logo span { font-size: 32px; }
    .tagline { color: rgba(26,26,46,0.75); font-size: 13px; margin-top: 6px; letter-spacing: 0.5px; }
    /* Gold OTP box */
    .otp-container {
      background: linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(245,200,66,0.08) 100%);
      border: 1px solid rgba(212,175,55,0.35);
      border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;
    }
    .otp-code { color: #d4af37; }
    /* Lock icon badge */
    .badge {
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #d4af37, #f5c842);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px; font-size: 28px;
    }
    .footer-brand { color: #d4af37; font-weight: 600; }
    /* Urgent notice strip */
    .urgent-notice {
      background: rgba(212,175,55,0.08);
      border-left: 3px solid #d4af37;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-bottom: 20px;
      color: #d4af37;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo"><span>&#127909;</span> Cine Script AI</div>
      <div class="tagline">PASSWORD RESET REQUEST</div>
    </div>

    <!-- Content -->
    <div class="content">
      <!-- Lock icon -->
      <div class="badge">&#128274;</div>

      <div class="greeting">Hey ${name},</div>
      <div class="message">
        We received a request to reset the password on your Cine Script AI account.
        Enter the code below to continue. The code is valid for ${expiryMinutes} minutes.
      </div>

      <!-- Urgent notice -->
      <div class="urgent-notice">
        &#9888;&nbsp; This code expires in ${expiryMinutes} minutes — act quickly.
      </div>

      <!-- OTP Code -->
      <div class="otp-container">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${otp}</div>
        <div class="expiry">
          <span>&#9203;</span>
          <span>Expires in ${expiryMinutes} minutes</span>
        </div>
      </div>

      <div class="divider"></div>

      <div class="warning">
        <strong>Didn't request this?</strong> Your password has
        <em>not</em> been changed. You can safely ignore this email — no further action
        is needed. If you keep receiving these, please contact our support team.
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-text">
        Sent by <span class="footer-brand">Cine Script AI</span>
        &nbsp;&middot;&nbsp; This is an automated email, please do not reply.
      </div>
      <div class="support">Need help? Contact our support team</div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Send password-reset OTP email.
   *
   * @param {Object} params
   * @param {string} params.to            - Recipient email
   * @param {string} params.name          - Recipient name
   * @param {string} params.otp           - 6-digit OTP
   * @param {number} [params.expiryMinutes=5]
   */
  static async sendForgotPasswordOtpEmail({
    to,
    name,
    otp,
    expiryMinutes = 5,
  }) {
    try {
      const htmlContent = this.generateForgotPasswordOtpTemplate({
        name,
        otp,
        expiryMinutes,
      });
      const textContent = `
Cine Script AI - Password Reset

Hey ${name},

We received a request to reset your Cine Script AI password.

Your reset code is: ${otp}

This code will expire in ${expiryMinutes} minutes.

If you did NOT request a password reset, please ignore this email.
Your password has not been changed.

---
Cine Script AI - Transform Moments Into Cinema
      `.trim();

      const result = await sendEmail({
        to,
        toName: name,
        subject: `${otp} - Reset your Cine Script AI password`,
        htmlContent,
        textContent,
      });

      logger.info("Password-reset OTP email sent", {
        email: to,
        messageId: result.messageId,
      });
      return result;
    } catch (error) {
      logger.error("Failed to send password-reset OTP email", {
        email: to,
        error: error.message,
      });
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  WELCOME EMAIL                                                       */
  /* ------------------------------------------------------------------ */

  static async sendWelcomeEmail({ to, name }) {
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #1a1a2e; padding: 40px 20px; }
    .container { max-width: 480px; margin: 0 auto; background: #1e1e2f; border-radius: 12px; padding: 40px; }
    h1 { color: #e94560; }
    p { color: #94a3b8; line-height: 1.6; }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #e94560, #ff6b6b);
      color: white; padding: 14px 32px;
      border-radius: 8px; text-decoration: none;
      font-weight: 600; margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Cine Script AI! &#127881;</h1>
    <p>Hey ${name},</p>
    <p>
      Your account is now verified and ready to go! Start transforming everyday
      situations into dramatic movie scripts powered by AI.
    </p>
    <a href="${env.clientUrl}" class="btn">Start Creating Scripts</a>
    <p style="margin-top:30px;font-size:12px;color:#64748b;">
      If the button doesn't work, visit: ${env.clientUrl}
    </p>
  </div>
</body>
</html>`;

      const result = await sendEmail({
        to,
        toName: name,
        subject: "Welcome to Cine Script AI!",
        htmlContent,
      });

      logger.info("Welcome email sent", { email: to });
      return result;
    } catch (error) {
      logger.error("Failed to send welcome email", {
        email: to,
        error: error.message,
      });
      // Non-critical — do not rethrow
    }
  }
}

module.exports = EmailService;
