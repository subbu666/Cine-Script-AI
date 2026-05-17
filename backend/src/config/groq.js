const Groq = require('groq-sdk');
const env = require('./env');

/**
 * Groq AI Client
 * Singleton instance for making AI generation requests
 */
let groqClient = null;

/**
 * Initialize and get Groq client
 */
const getGroqClient = () => {
  if (!groqClient) {
    if (!env.groqApiKey) {
      throw new Error('Groq API key is not configured');
    }

    groqClient = new Groq({
      apiKey: env.groqApiKey,
    });

    console.log('🤖 Groq AI Client initialized');
  }

  return groqClient;
};

/**
 * Test Groq connection
 */
const testGroqConnection = async () => {
  try {
    const client = getGroqClient();
    const response = await client.chat.completions.create({
      model: env.groqModel,
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    if (response.choices && response.choices.length > 0) {
      console.log('✅ Groq API Connection Verified');
      return true;
    }

    return false;
  } catch (error) {
    console.error('❌ Groq API Connection Failed:', error.message);
    return false;
  }
};

module.exports = {
  getGroqClient,
  testGroqConnection,
};
