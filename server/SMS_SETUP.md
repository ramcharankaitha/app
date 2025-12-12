# WhatsApp Setup Guide

This application sends WhatsApp messages to customers after they are created. The WhatsApp service uses Twilio's WhatsApp API.

## Setup Instructions

### 1. Install Twilio Package

The Twilio package is already added to `package.json`. Install it by running:

```bash
cd server
npm install
```

### 2. Get Twilio Credentials

1. Sign up for a Twilio account at https://www.twilio.com/try-twilio
2. Get your Account SID and Auth Token from the Twilio Console
3. Get a Twilio phone number (you'll get a trial number for testing)

### 3. Configure Environment Variables

Add the following to your `server/.env` file:

```env
# WhatsApp Configuration
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Example:**
```env
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Note:** 
- For testing, use Twilio's WhatsApp Sandbox number: `whatsapp:+14155238886`
- For production, you'll need a verified WhatsApp Business number from Twilio
- The format must be `whatsapp:+[country code][number]`

### 4. Phone Number Format

- Customer phone numbers will be automatically formatted
- If a number starts with 0, it will be removed
- 10-digit Indian numbers will automatically get +91 prefix
- Numbers should be in E.164 format (e.g., +911234567890)

### 5. Testing Without Twilio

If you want to test without Twilio (development mode), set:

```env
WHATSAPP_ENABLED=false
```

The system will log WhatsApp messages to the console instead of sending them.

## Message Content

When a customer is created successfully, they will receive a WhatsApp message with the following message:

```
Thanks for visiting the store, [Customer Name]! We appreciate your business and look forward to serving you again.
```

## Troubleshooting

- **WhatsApp not sending**: Check that `WHATSAPP_ENABLED=true` and all Twilio credentials are correct
- **Invalid phone number**: Ensure customer phone numbers are valid
- **Twilio errors**: Check Twilio console for account status and balance
- **Development mode**: Set `WHATSAPP_ENABLED=false` to disable WhatsApp and log messages instead
- **Sandbox limitations**: In Twilio Sandbox, customers must join the sandbox first by sending a message to the Twilio number

## Notes

- WhatsApp sending is non-blocking - if WhatsApp fails, customer creation will still succeed
- WhatsApp is only sent if the customer has a phone number
- The system automatically handles phone number formatting
- For production use, you need to apply for a WhatsApp Business Account through Twilio
- WhatsApp requires pre-approved message templates for business-initiated conversations

