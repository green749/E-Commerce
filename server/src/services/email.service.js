import { logger } from '../config/logger.js';

/**
 * Pluggable email service interface.
 * Can be swapped with SendGrid, Resend, Nodemailer, AWS SES, etc.
 */
class EmailService {
  /**
   * Sends password reset email
   * @param {Object} params
   * @param {string} params.to
   * @param {string} params.name
   * @param {string} params.token
   * @param {string} params.resetUrl
   * @returns {Promise<boolean>}
   */
  async sendPasswordResetEmail({ to, name, token, resetUrl }) {
    // Current dev implementation: log the reset link to console
    logger.info(
      {
        to,
        token,
        resetUrl,
      },
      `📧 [EMAIL SERVICE] Password reset requested for ${to}`
    );

    console.log('\n' + '='.repeat(60));
    console.log('📧 [EMAIL SERVICE] PASSWORD RESET LINK');
    console.log(`Recipient : ${name} <${to}>`);
    console.log(`Reset URL : ${resetUrl}`);
    console.log(`Token     : ${token}`);
    console.log('Valid for : 1 hour');
    console.log('='.repeat(60) + '\n');

    return true;
  }
}

export const emailService = new EmailService();
