const WHATSAPP_ENABLED = process.env.WHATSAPP_ENABLED !== 'false';
const SMS_ENABLED = process.env.SMS_ENABLED !== 'false';
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'msg91'; // 'msg91' or 'twilio'
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// MSG91 configuration
const MSG91_ENABLED = process.env.MSG91_ENABLED !== 'false';
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'YOURID';
const MSG91_ROUTE = process.env.MSG91_ROUTE || '4'; // 4 for transactional, 1 for promotional

let twilioClient = null;

if ((WHATSAPP_ENABLED || SMS_ENABLED) && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  try {
    const twilio = require('twilio');
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    if (WHATSAPP_ENABLED) {
      console.log('✅ Twilio WhatsApp service initialized');
    }
    if (SMS_ENABLED) {
      console.log('✅ Twilio SMS service initialized');
    }
  } catch (error) {
    console.warn('⚠️  Twilio not installed. Run: npm install twilio');
    console.warn('   WhatsApp/SMS functionality will be disabled.');
  }
}

function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || !phoneNumber.trim()) {
    return null;
  }

  let cleaned = phoneNumber.trim().replace(/[\s\-\(\)]/g, '');
  
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
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
 * Send SMS message to a phone number
 * Supports both MSG91 and Twilio based on SMS_PROVIDER env variable
 * @param {string} to - Recipient phone number
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMS(to, message) {
  // Validate phone number
  if (!to || !to.trim()) {
    return { success: false, error: 'Phone number is required' };
  }

  if (!message || !message.trim()) {
    return { success: false, error: 'Message is required' };
  }

  // Use MSG91 if configured
  if (SMS_PROVIDER === 'msg91' && MSG91_ENABLED) {
    const msg91Service = require('./msg91Service');
    return await msg91Service.sendSMS(to, message.trim());
  }

  // Fallback to Twilio
  const phoneNumber = formatPhoneNumber(to);
  if (!phoneNumber) {
    return { success: false, error: 'Invalid phone number format' };
  }

  // If SMS is disabled or Twilio is not configured, log and return success (for development)
  if (!SMS_ENABLED || !twilioClient || !TWILIO_PHONE_NUMBER) {
    console.log(`📱 [SMS Mock] Would send to ${phoneNumber}: ${message}`);
    return { 
      success: true, 
      messageId: 'mock-' + Date.now(),
      note: 'SMS service not configured. Message logged only.'
    };
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`✅ SMS sent successfully to ${phoneNumber}. SID: ${result.sid}`);
    return { 
      success: true, 
      messageId: result.sid 
    };
  } catch (error) {
    console.error('❌ SMS sending failed:', error.message);
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

/**
 * Generic function to send SMS with custom message
 * This can be called from anywhere in the application
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Custom message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendCustomSMS(phoneNumber, message) {
  return await sendSMS(phoneNumber, message);
}

module.exports = {
  sendWhatsApp,
  sendSMS,
  sendCustomerWelcomeMessage,
  sendCustomSMS,
  formatPhoneNumber
};

