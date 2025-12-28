const MSG91_ENABLED = process.env.MSG91_ENABLED !== 'false';
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'YOURID'; // 6 character sender ID
const MSG91_ROUTE = process.env.MSG91_ROUTE || '4'; // 4 for transactional, 1 for promotional

/**
 * Format phone number for MSG91 (10-digit Indian number)
 * @param {string} phoneNumber - Phone number to format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
function formatPhoneNumber(phoneNumber) {
  if (!phoneNumber || !phoneNumber.trim()) {
    return null;
  }

  // Remove all non-digit characters
  let cleaned = phoneNumber.trim().replace(/\D/g, '');
  
  // Remove country code if present
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // Remove leading 0 if present
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  
  // Validate: should be 10 digits
  if (cleaned.length !== 10) {
    return null;
  }
  
  return cleaned;
}

/**
 * Send SMS via MSG91 API (using sendhttp.php - simple method)
 * @param {string} phoneNumber - Recipient phone number (10-digit Indian number)
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMS(phoneNumber, message) {
  // Validate phone number
  if (!phoneNumber || !phoneNumber.trim()) {
    return { success: false, error: 'Phone number is required' };
  }

  const formattedNumber = formatPhoneNumber(phoneNumber);
  if (!formattedNumber) {
    return { success: false, error: 'Invalid phone number format. Please provide a 10-digit Indian mobile number.' };
  }

  // Validate message
  if (!message || !message.trim()) {
    return { success: false, error: 'Message is required' };
  }

  // If MSG91 is disabled or not configured, log and return success (for development)
  if (!MSG91_ENABLED || !MSG91_AUTH_KEY) {
    console.log(`📱 [MSG91 Mock] Would send to ${formattedNumber}: ${message}`);
    return { 
      success: true, 
      messageId: 'mock-' + Date.now(),
      note: 'MSG91 service not configured. Message logged only.'
    };
  }

  try {
    const https = require('https');
    const querystring = require('querystring');

    // MSG91 sendhttp API (simple and reliable)
    const params = querystring.stringify({
      authkey: MSG91_AUTH_KEY,
      mobiles: `91${formattedNumber}`, // Add country code
      message: message.trim(),
      sender: MSG91_SENDER_ID,
      route: MSG91_ROUTE,
      country: '91'
    });

    const url = `https://api.msg91.com/api/sendhttp.php?${params}`;

    return new Promise((resolve) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // MSG91 returns request ID on success (numeric string like "1234567890123456")
          // Error messages are descriptive strings
          const responseData = data.toString().trim();
          
          // Check if response is a numeric request ID (success)
          if (responseData && !isNaN(responseData) && responseData.length > 5) {
            console.log(`✅ MSG91 SMS sent successfully to ${formattedNumber}. Request ID: ${responseData}`);
            resolve({ 
              success: true, 
              messageId: 'msg91-' + responseData
            });
          } else if (responseData.includes('success') || responseData.includes('sent')) {
            console.log(`✅ MSG91 SMS sent successfully to ${formattedNumber}`);
            resolve({ 
              success: true, 
              messageId: 'msg91-' + Date.now()
            });
          } else {
            console.error('❌ MSG91 SMS failed:', responseData);
            resolve({ 
              success: false, 
              error: responseData || 'Failed to send SMS via MSG91'
            });
          }
        });
      }).on('error', (error) => {
        console.error('❌ MSG91 SMS sending failed:', error.message);
        resolve({ 
          success: false, 
          error: error.message 
        });
      });
    });

  } catch (error) {
    console.error('❌ MSG91 SMS error:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Send SMS using MSG91 API v2 (for template-based messages with DLT)
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - Message to send
 * @param {string} templateId - DLT template ID (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
async function sendSMSV2(phoneNumber, message, templateId = null) {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  if (!formattedNumber) {
    return { success: false, error: 'Invalid phone number format' };
  }

  if (!MSG91_ENABLED || !MSG91_AUTH_KEY) {
    console.log(`📱 [MSG91 Mock] Would send to ${formattedNumber}: ${message}`);
    return { 
      success: true, 
      messageId: 'mock-' + Date.now(),
      note: 'MSG91 service not configured. Message logged only.'
    };
  }

  try {
    const https = require('https');
    
    // MSG91 API v2 endpoint
    const postData = JSON.stringify({
      sender: MSG91_SENDER_ID,
      route: MSG91_ROUTE,
      country: '91',
      sms: [{
        message: message.trim(),
        to: [`91${formattedNumber}`]
      }]
    });

    const options = {
      hostname: 'api.msg91.com',
      path: '/api/v2/sendsms',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'authkey': MSG91_AUTH_KEY
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.type === 'success' || res.statusCode === 200) {
              console.log(`✅ MSG91 SMS sent successfully to ${formattedNumber}`);
              resolve({ 
                success: true, 
                messageId: response.request_id || 'msg91-' + Date.now()
              });
            } else {
              console.error('❌ MSG91 SMS failed:', response.message || JSON.stringify(response));
              // Fallback to simple API
              resolve(sendSMS(phoneNumber, message));
            }
          } catch (error) {
            // Fallback to simple API if v2 fails
            resolve(sendSMS(phoneNumber, message));
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ MSG91 request error:', error.message);
        // Fallback to simple API
        resolve(sendSMS(phoneNumber, message));
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('❌ MSG91 SMS error:', error.message);
    // Fallback to simple API
    return sendSMS(phoneNumber, message);
  }
}

module.exports = {
  sendSMS,
  sendSMSV2,
  formatPhoneNumber
};
