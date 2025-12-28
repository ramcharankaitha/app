# SMS API Usage Guide

The SMS API has been integrated into the application. You can now send SMS messages from anywhere in the application.

## Setup

### Environment Variables

Add the following to your `server/.env` file:

```env
# SMS Configuration
SMS_ENABLED=true
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number
```

**Note:** If `SMS_ENABLED=false` or Twilio is not configured, SMS will be logged to console instead of being sent (useful for development).

## Frontend Usage

### Import the SMS API

```javascript
import { smsAPI } from '../services/api';
```

### Send SMS

```javascript
// Basic usage
const response = await smsAPI.send(phoneNumber, message);

if (response.success) {
  console.log('SMS sent successfully!', response.messageId);
} else {
  console.error('Failed to send SMS:', response.error);
}
```

### Example: Send SMS after customer creation

```javascript
// In your customer creation function
const createCustomer = async (customerData) => {
  try {
    const response = await customersAPI.create(customerData);
    
    if (response.success) {
      // Send welcome SMS
      const smsMessage = `Welcome ${customerData.name}! Thank you for registering with us.`;
      await smsAPI.send(customerData.phone, smsMessage);
      
      // Continue with success handling...
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## Backend Usage

### Direct Service Call

```javascript
const { sendSMS } = require('../services/smsService');

// Send SMS
const result = await sendSMS(phoneNumber, message);

if (result.success) {
  console.log('SMS sent:', result.messageId);
} else {
  console.error('SMS failed:', result.error);
}
```

### Example: Send SMS in route handler

```javascript
const { sendSMS } = require('../services/smsService');

router.post('/some-action', async (req, res) => {
  try {
    // Your business logic here
    const result = await doSomething();
    
    // Send SMS notification
    if (result.success && result.phoneNumber) {
      await sendSMS(result.phoneNumber, 'Your action was successful!');
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Common Use Cases

### 1. Customer Registration SMS
```javascript
const message = `Welcome ${customerName}! Thank you for registering. Your account has been created successfully.`;
await smsAPI.send(phoneNumber, message);
```

### 2. Order Confirmation SMS
```javascript
const message = `Hi ${customerName}, your order #${orderId} has been confirmed. Total: ₹${amount}. Thank you!`;
await smsAPI.send(phoneNumber, message);
```

### 3. Stock Alert SMS
```javascript
const message = `Alert: ${productName} is running low. Current stock: ${quantity}. Please restock soon.`;
await smsAPI.send(phoneNumber, message);
```

### 4. Payment Reminder SMS
```javascript
const message = `Reminder: Your payment of ₹${amount} for ${planName} is due on ${dueDate}. Please make the payment.`;
await smsAPI.send(phoneNumber, message);
```

### 5. Service Update SMS
```javascript
const message = `Your service request #${serviceId} has been updated. Status: ${status}. We'll keep you informed.`;
await smsAPI.send(phoneNumber, message);
```

## Phone Number Format

Phone numbers are automatically formatted:
- 10-digit Indian numbers get `+91` prefix
- Numbers starting with `0` have the `0` removed
- Numbers should be in E.164 format (e.g., `+911234567890`)

## Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await smsAPI.send(phoneNumber, message);
  if (response.success) {
    // SMS sent successfully
  } else {
    // SMS failed, but don't block the main operation
    console.warn('SMS failed:', response.error);
  }
} catch (error) {
  // Network or other errors
  console.error('SMS API error:', error);
  // Continue with your main operation
}
```

## Notes

- SMS sending is non-blocking - if SMS fails, your main operation will still succeed
- SMS is only sent if the phone number is valid
- The system automatically handles phone number formatting
- In development mode (SMS_ENABLED=false), messages are logged to console
- For production, ensure Twilio credentials are properly configured

## Next Steps

You can now integrate SMS sending into any part of your application. Just tell me:
1. **Where** you want to send SMS (e.g., after customer creation, order confirmation, etc.)
2. **What message** should be sent for each event
3. **To whom** the SMS should be sent (phone number source)

I'll help you integrate it!

