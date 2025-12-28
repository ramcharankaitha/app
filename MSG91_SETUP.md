# MSG91 SMS Integration Setup Guide

This guide will help you set up MSG91 SMS API for your application.

## Step 1: Create MSG91 Account

1. Go to https://msg91.com/
2. Sign up for a free account
3. Verify your email and phone number
4. Complete KYC verification (required for production)

## Step 2: Get Your Credentials

1. Login to MSG91 dashboard
2. Go to **API** section
3. Copy your **Auth Key** (API Key)
4. Go to **Sender ID** section and create/note your Sender ID (6 characters, e.g., "YOURID")

## Step 3: Configure Environment Variables

Add the following to your `server/.env` file:

```env
# SMS Configuration
SMS_ENABLED=true
SMS_PROVIDER=msg91

# MSG91 Configuration
MSG91_ENABLED=true
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=YOURID
MSG91_ROUTE=4
```

**Configuration Details:**
- `MSG91_AUTH_KEY`: Your MSG91 API authentication key
- `MSG91_SENDER_ID`: Your 6-character sender ID (must be approved by MSG91)
- `MSG91_ROUTE`: 
  - `4` = Transactional SMS (recommended for OTPs, alerts, confirmations)
  - `1` = Promotional SMS (for marketing messages)

## Step 4: DLT Registration (Required for India)

For sending SMS in India, you need to register your templates with DLT (Distributed Ledger Technology):

1. Go to MSG91 dashboard → **DLT** section
2. Register your sender ID
3. Register your message templates
4. Get template IDs for registered templates

**Note:** For testing, you can use unregistered messages, but for production, DLT registration is mandatory.

## Step 5: Test SMS

You can test SMS sending using the API:

```javascript
// Frontend
import { smsAPI } from '../services/api';

const response = await smsAPI.send('9876543210', 'Test message from MSG91');
```

## SMS Templates Available

The following templates are pre-configured:

1. **customerWelcome** - Welcome message for new customers
2. **orderConfirmation** - Order confirmation with order ID and amount
3. **stockIn** - Stock added notification
4. **stockOut** - Stock dispatched notification
5. **lowStockAlert** - Low stock warning
6. **serviceConfirmation** - Service request confirmation
7. **serviceCompletion** - Service completion notification
8. **paymentReminder** - Payment due reminder
9. **paymentConfirmation** - Payment received confirmation
10. **chitPlanEnrollment** - Chit plan enrollment confirmation
11. **dispatchNotification** - Order dispatch notification
12. **deliveryConfirmation** - Delivery confirmation
13. **supplierTransaction** - Supplier transaction notification
14. **salesOrderConfirmation** - Sales order confirmation

## Usage Examples

### Using Templates

```javascript
// Frontend
import { smsAPI } from '../services/api';

// Send welcome SMS
await smsAPI.sendTemplate('customerWelcome', '9876543210', {
  customerName: 'John Doe'
});

// Send order confirmation
await smsAPI.sendTemplate('orderConfirmation', '9876543210', {
  customerName: 'John Doe',
  orderId: 'ORD123',
  amount: '5000'
});
```

### Custom Messages

```javascript
// Send custom SMS
await smsAPI.send('9876543210', 'Your custom message here');
```

## Pricing

MSG91 offers competitive pricing for Indian SMS:
- **Transactional SMS**: ~₹0.15 - ₹0.25 per SMS
- **Promotional SMS**: ~₹0.10 - ₹0.20 per SMS
- Free credits available for testing

## Phone Number Format

- Input: 10-digit Indian mobile number (e.g., `9876543210`)
- The system automatically formats it for MSG91 API
- Country code (+91) is added automatically

## Troubleshooting

1. **SMS not sending**: 
   - Check if `MSG91_ENABLED=true` and `MSG91_AUTH_KEY` is set
   - Verify sender ID is approved
   - Check MSG91 dashboard for account balance

2. **Invalid phone number**:
   - Ensure phone number is 10 digits
   - Remove country code if present
   - Remove leading 0 if present

3. **DLT errors**:
   - Register your templates with DLT
   - Use approved sender ID
   - For production, all templates must be DLT registered

4. **API errors**:
   - Check MSG91 dashboard for API status
   - Verify auth key is correct
   - Check route parameter (4 for transactional, 1 for promotional)

## Support

- MSG91 Documentation: https://docs.msg91.com/
- MSG91 Support: support@msg91.com
- Dashboard: https://control.msg91.com/

