# Privacy Policy for Google Play Store

## Overview
A comprehensive Privacy Policy page has been created for your application. This is required for Google Play Store submission.

## Privacy Policy URL

Once your application is deployed, your privacy policy will be accessible at:

**Primary URL:**
```
https://your-domain.com/privacy-policy
```

**Alternative URL:**
```
https://your-domain.com/privacy
```

Both URLs work and point to the same privacy policy page.

## For Vercel Deployment

If your app is deployed on Vercel (e.g., `https://auto-ashy-five.vercel.app`), your privacy policy URL will be:

```
https://auto-ashy-five.vercel.app/privacy-policy
```

## What's Included

The privacy policy covers all required sections for Play Store compliance:

✅ **Information Collection** - What data is collected
✅ **Data Usage** - How data is used
✅ **Data Storage & Security** - Security measures
✅ **Data Sharing** - When and how data is shared
✅ **Data Retention** - How long data is kept
✅ **User Rights** - User rights and choices
✅ **Children's Privacy** - COPPA compliance (required if targeting children)
✅ **International Transfers** - Data transfer information
✅ **Contact Information** - How to reach you
✅ **GDPR & CCPA Compliance** - Legal compliance

## Important: Update Contact Information

**Before submitting to Play Store, you MUST update the contact information in the Privacy Policy:**

1. Open `src/components/PrivacyPolicy.jsx`
2. Find the "Contact Us" section (Section 12)
3. Update the following with your actual information:
   - Email address
   - Phone number
   - Business address

**Current placeholder:**
```jsx
<p>Email: <a href="mailto:privacy@anithastores.com">privacy@anithastores.com</a></p>
<p>Phone: [Your Contact Phone Number]</p>
<p>Address: [Your Business Address]</p>
```

## How to Use in Play Store Console

1. **Go to Google Play Console**
2. **Navigate to:** App Content → Privacy Policy
3. **Enter your Privacy Policy URL:**
   ```
   https://your-domain.com/privacy-policy
   ```
4. **Save and continue**

## Testing the Privacy Policy

### Local Testing
1. Start your development server: `npm start`
2. Visit: `http://localhost:3000/privacy-policy`
3. Verify all sections are displayed correctly

### Production Testing
1. Deploy your application
2. Visit: `https://your-domain.com/privacy-policy`
3. Ensure the page loads correctly
4. Test on mobile devices to verify mobile responsiveness

## Mobile Responsive

The privacy policy page is fully responsive and will display correctly on:
- Desktop browsers
- Mobile browsers
- Tablet devices
- Within the mobile app (if using WebView)

## Customization

You can customize the privacy policy by editing:
- **Content:** `src/components/PrivacyPolicy.jsx`
- **Styling:** `src/components/privacyPolicy.css`

### Common Customizations

1. **Update Business Name:**
   - Search for "Anitha Stores" and replace with your business name

2. **Add Specific Data Collection Details:**
   - Modify Section 2 to include specific data your app collects

3. **Update Data Usage:**
   - Modify Section 3 to reflect how you specifically use data

4. **Add Third-Party Services:**
   - List any third-party services you use (analytics, payment processors, etc.)

## Legal Compliance

The privacy policy template includes:
- **GDPR compliance** (for EU users)
- **CCPA compliance** (for California users)
- **COPPA compliance** (for children's privacy)

**Important:** Review the privacy policy with a legal professional to ensure it accurately reflects your data practices and complies with all applicable laws in your jurisdiction.

## Verification Checklist

Before submitting to Play Store:

- [ ] Privacy policy is accessible at the provided URL
- [ ] Contact information is updated with real details
- [ ] Business name is correct throughout the document
- [ ] All sections are relevant to your application
- [ ] Privacy policy is mobile-responsive
- [ ] Page loads quickly and displays correctly
- [ ] No placeholder text remains
- [ ] Legal review completed (recommended)

## Troubleshooting

### Privacy Policy Not Loading
- Check that the route is added in `App.js`
- Verify the component is imported correctly
- Check browser console for errors

### Styling Issues
- Ensure `privacyPolicy.css` is imported
- Check CSS variables are defined in your theme

### Mobile Display Issues
- Test on actual mobile device
- Check viewport meta tag in `public/index.html`
- Verify responsive CSS media queries

## Support

If you need help customizing the privacy policy or have questions about Play Store requirements, refer to:
- [Google Play Privacy Policy Requirements](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)

---

**Note:** This privacy policy is a template. You must customize it to accurately reflect your application's data collection and usage practices. It's recommended to have a legal professional review your privacy policy before publishing.

