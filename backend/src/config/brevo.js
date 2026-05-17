const SibApiV3Sdk = require('sib-api-v3-sdk');
const env = require('./env');

/**
 * Brevo (SendInBlue) Email Client
 * Handles OTP emails and transactional emails
 */
let brevoClient = null;
let brevoApiInstance = null;

/**
 * Initialize Brevo client
 */
const getBrevoClient = () => {
  if (!brevoClient) {
    if (!env.brevoApiKey) {
      throw new Error('Brevo API key is not configured');
    }

    brevoClient = SibApiV3Sdk.ApiClient.instance;
    const apiKey = brevoClient.authentications['api-key'];
    apiKey.apiKey = env.brevoApiKey;

    brevoApiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    console.log('📧 Brevo Email Client initialized');
  }

  return { brevoClient, brevoApiInstance };
};

/**
 * Send email via Brevo
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {string} params.subject - Email subject
 * @param {string} params.htmlContent - HTML content
 * @param {string} params.textContent - Plain text content
 */
const sendEmail = async ({ to, toName, subject, htmlContent, textContent }) => {
  try {
    const { brevoApiInstance } = getBrevoClient();

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.sender = {
      email: env.fromEmail,
      name: env.fromName,
    };
    sendSmtpEmail.to = [{ email: to, name: toName || to }];
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    if (textContent) {
      sendSmtpEmail.textContent = textContent;
    }

    const response = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);

    return {
      success: true,
      messageId: response.messageId,
    };
  } catch (error) {
    console.error('Brevo Email Error:', error.message);
    throw error;
  }
};

/**
 * Verify Brevo API key is valid
 */
const testBrevoConnection = async () => {
  try {
    const { brevoApiInstance } = getBrevoClient();

    // Test by getting account info (lightweight call)
    const accountApi = new SibApiV3Sdk.AccountApi();
    await accountApi.getAccount();

    console.log('✅ Brevo API Connection Verified');
    return true;
  } catch (error) {
    console.error('❌ Brevo API Connection Failed:', error.message);
    return false;
  }
};

module.exports = {
  getBrevoClient,
  sendEmail,
  testBrevoConnection,
};
