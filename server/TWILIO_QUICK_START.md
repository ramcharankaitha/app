# Twilio WhatsApp Quick Start Guide

## ✅ Step 1: Verify Your Credentials

Make sure you have these in your `server/.env` file:

```env
WHATSAPP_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

**Where to find these:**
1. Go to https://console.twilio.com/
2. **Account SID**: Found on the dashboard homepage
3. **Auth Token**: Click "Show" next to Auth Token on the dashboard (keep this secret!)
4. **WhatsApp Number**: For testing, use `whatsapp:+14155238886` (Twilio Sandbox)

## 🔧 Step 2: Test Your Setup

### Option A: Test with Twilio WhatsApp Sandbox (Recommended for Testing)

1. **Join the Sandbox:**
   - Open WhatsApp on your phone
   - Send a message to: `+1 415 523 8886`
   - Send the join code shown in your Twilio Console (under WhatsApp > Sandbox)
   - You'll receive a confirmation message

2. **Test the Application:**
   - Create a customer in your application with YOUR phone number (the one you joined the sandbox with)
   - You should receive a WhatsApp message: "Thanks for visiting the store, [Name]!..."

### Option B: Check Server Logs

1. Start your server:
   ```bash
   cd server
   npm start
   ```

2. Create a customer with a phone number

3. Check the server console. You should see:
   - `✅ Twilio WhatsApp service initialized` (on server start)
   - `✅ Welcome WhatsApp message sent to [Name] ([Phone])` (after customer creation)

## 📱 How It Works

### For Testing (Sandbox Mode):

1. **Customer joins sandbox first:**
   - Customer sends WhatsApp message to `+1 415 523 8886`
   - Customer sends the join code (e.g., "join [code]")
   - Customer receives confirmation

2. **Application sends message:**
   - When customer is created, system sends WhatsApp message
   - Message goes through Twilio to customer's WhatsApp
   - Customer receives: "Thanks for visiting the store, [Name]!..."

### For Production:

1. **Apply for WhatsApp Business Account:**
   - Go to Twilio Console > WhatsApp > Senders
   - Apply for WhatsApp Business API access
   - Wait for approval (can take a few days)

2. **Get verified WhatsApp Business number:**
   - Once approved, you'll get a WhatsApp Business number
   - Update `TWILIO_WHATSAPP_NUMBER` in `.env` to your verified number

3. **Use message templates:**
   - WhatsApp requires pre-approved templates for business messages
   - Create templates in Twilio Console > Messaging > WhatsApp Templates
   - Templates must be approved by WhatsApp before use

## 🐛 Troubleshooting

### Issue: "WhatsApp service not configured"
**Solution:** Check that:
- `WHATSAPP_ENABLED=true` in `.env`
- `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are set
- Restart your server after changing `.env`

### Issue: "Message not received"
**Solution:**
- For Sandbox: Customer must join sandbox first (send message to +1 415 523 8886)
- Check phone number format (should be +91XXXXXXXXXX for India)
- Check Twilio Console > Monitor > Logs for errors
- Verify account has credits/balance

### Issue: "Invalid phone number"
**Solution:**
- Phone number must include country code (e.g., +91 for India)
- Format: +[country code][number] (e.g., +911234567890)
- System auto-formats 10-digit Indian numbers to +91

### Issue: "Twilio error: [error message]"
**Solution:**
- Check Twilio Console for specific error details
- Verify Account SID and Auth Token are correct
- Check if account has sufficient balance
- For Sandbox: Ensure customer joined the sandbox

## 📊 Check Twilio Console

1. **Monitor Messages:**
   - Go to https://console.twilio.com/us1/monitor/logs/messaging
   - See all sent messages and their status

2. **Check Account Balance:**
   - Dashboard shows account balance
   - WhatsApp messages cost ~$0.005 per message (very cheap!)

3. **View WhatsApp Sandbox:**
   - Go to https://console.twilio.com/us1/develop/sms/sandbox
   - See sandbox number and join code
   - View sandbox participants

## 🧪 Testing Checklist

- [ ] Credentials added to `.env` file
- [ ] Server restarted after adding credentials
- [ ] See "✅ Twilio WhatsApp service initialized" in server logs
- [ ] Customer phone number is in correct format
- [ ] For Sandbox: Customer joined the sandbox
- [ ] Created a test customer
- [ ] Checked server logs for success message
- [ ] Received WhatsApp message on customer's phone

## 💡 Tips

1. **Development Mode:**
   - Set `WHATSAPP_ENABLED=false` to test without sending real messages
   - Messages will be logged to console only

2. **Phone Number Format:**
   - System auto-formats: `9876543210` → `+919876543210`
   - Always include country code

3. **Message Content:**
   - Current message: "Thanks for visiting the store, [Name]! We appreciate your business and look forward to serving you again."
   - Can be customized in `server/services/smsService.js`

4. **Error Handling:**
   - If WhatsApp fails, customer creation still succeeds
   - Errors are logged but don't block the process

## 🚀 Next Steps

1. **Test with Sandbox:** Join sandbox and test with your own number
2. **Test with Real Customer:** Have a customer join sandbox and test
3. **Production Setup:** Apply for WhatsApp Business API when ready
4. **Customize Messages:** Update message content as needed

## 📞 Need Help?

- **Twilio Docs:** https://www.twilio.com/docs/whatsapp
- **Twilio Support:** https://support.twilio.com/
- **Console:** https://console.twilio.com/

