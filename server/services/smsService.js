/**
 * SMS and WhatsApp Service
 * Sends SMS and WhatsApp messages using Twilio
 */

// For development/testing without Twilio, set WHATSAPP_ENABLED=false in .env
const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED !== 'false';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default Twilio Sandbox number

let twilioClient = null;

// Initialize Twilio client if credentials are available
if (WHATSAPP_ENABLED && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio WhatsApp service initialized');
  } catch (error) {
    console.warn('⚠️  Twilio not installed. Run: npm install twilio');
    console.warn('   WhatsApp functionality will be disabled.');
  }
}

/**
 * Format phone number to E.164 format
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} - Formatted phone number
 */
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || !phoneNumber.trim()) {
    return null;
  }

  // Clean phone number (remove spaces, dashes, etc.)
  let cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  
  // Add country code if not present (assuming India +91)
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Add India country code if it's a 10-digit number
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Send WhatsApp message to a phone number
 * @param {string} to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendWhatsApp(to, message) {
  // Validate phone number
  if (!to || !to.trim()) {
    return { success: false, error: 'Phone number is required' };
  }

  const phoneNumber = formatPhoneNumber(to);
  if (!phoneNumber) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // Format for WhatsApp (whatsapp:+1234567890)
  const whatsappNumber = `whatsapp:${phoneNumber}`;

  // If WhatsApp is disabled or Twilio is not configured, log and return success (for development)
  if (!WHATSAPP_ENABLED || !twilioClient) {
    console.log(`💬 [WhatsApp Mock] Would send to ${whatsappNumber}: ${message}`);
    return { 
      success: true, 
      messageId: 'mock-' + Date.now(),
      note: 'WhatsApp service not configured. Message logged only.'
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber
    });

    console.log(`✅ WhatsApp message sent successfully to ${whatsappNumber}. SID: ${result.sid}`);
    return { 
      success: true, 
      messageId: result.sid 
    };
  } catch (error) {
    console.error('❌ WhatsApp sending failed:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Send welcome/thank you message to customer via WhatsApp
 * @param {string} customerName - Customer's name
 * @param {string} phoneNumber - Customer's phone number
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendCustomerWelcomeMessage(customerName, phoneNumber) {
  const message = `Thanks for visiting the store, ${customerName}! We appreciate your business and look forward to serving you again.`;
  
  return await sendWhatsApp(phoneNumber, message);
}

module.exports = {
  sendWhatsApp,
  sendCustomerWelcomeMessage,
  formatPhoneNumber
};

