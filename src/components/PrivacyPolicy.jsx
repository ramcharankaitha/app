import React from 'react';
import './privacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-content">
        <header className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </header>

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Anitha Stores ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Store Management System mobile application and web application (collectively, the "Service").
          </p>
          <p>
            Please read this Privacy Policy carefully. By using our Service, you agree to the collection and use of information in accordance with this policy.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We may collect the following types of personal information:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, username, and password</li>
            <li><strong>Business Information:</strong> Store name, business address, tax identification numbers</li>
            <li><strong>Employee Information:</strong> Staff names, contact details, roles, and permissions</li>
            <li><strong>Customer Information:</strong> Customer names, addresses, phone numbers, purchase history</li>
            <li><strong>Supplier Information:</strong> Supplier names, contact details, transaction records</li>
          </ul>

          <h3>2.2 Usage Data</h3>
          <p>We automatically collect information about how you use our Service, including:</p>
          <ul>
            <li>Device information (device type, operating system, unique device identifiers)</li>
            <li>Log data (IP address, access times, pages viewed, features used)</li>
            <li>Location data (if you grant location permissions)</li>
            <li>App performance and error reports</li>
          </ul>

          <h3>2.3 Financial Data</h3>
          <p>We collect financial information related to your business operations, including:</p>
          <ul>
            <li>Sales transactions and revenue data</li>
            <li>Purchase orders and supplier payments</li>
            <li>Inventory valuations</li>
            <li>Payment records and invoices</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the collected information for the following purposes:</p>
          <ul>
            <li><strong>Service Provision:</strong> To provide, maintain, and improve our Service</li>
            <li><strong>Account Management:</strong> To create and manage user accounts, authenticate users, and control access</li>
            <li><strong>Business Operations:</strong> To process transactions, manage inventory, generate reports, and handle customer orders</li>
            <li><strong>Communication:</strong> To send notifications, updates, and respond to your inquiries</li>
            <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security threats</li>
            <li><strong>Compliance:</strong> To comply with legal obligations and enforce our terms of service</li>
            <li><strong>Analytics:</strong> To analyze usage patterns and improve user experience</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Data Storage and Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication and access controls</li>
            <li>Regular security assessments and updates</li>
            <li>Restricted access to personal information on a need-to-know basis</li>
            <li>Secure cloud infrastructure with industry-standard protections</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </section>

        <section className="privacy-section">
          <h2>5. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Service Providers:</strong> With third-party service providers who assist us in operating our Service (e.g., cloud hosting, database management, payment processing)</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government regulation</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
            <li><strong>With Your Consent:</strong> When you have given explicit consent for sharing</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information, except where we are required to retain it for legal or business purposes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request a copy of your data in a portable format</li>
            <li><strong>Objection:</strong> Object to processing of your personal information</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the contact information provided below.
          </p>
        </section>

        <section className="privacy-section">
          <h2>8. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately. If we discover that we have collected information from a child under 13, we will delete that information promptly.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
          </p>
        </section>

        <section className="privacy-section">
          <h2>10. Third-Party Services</h2>
          <p>
            Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of any third-party services you access.
          </p>
        </section>

        <section className="privacy-section">
          <h2>11. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="privacy-section">
          <h2>12. Contact Us</h2>
          <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
          <div className="contact-info">
            <p><strong>Anitha Stores</strong></p>
            <p>Email: <a href="mailto:privacy@anithastores.com">privacy@anithastores.com</a></p>
            <p>Phone: [Your Contact Phone Number]</p>
            <p>Address: [Your Business Address]</p>
          </div>
        </section>

        <section className="privacy-section">
          <h2>13. Compliance</h2>
          <p>
            This Privacy Policy is designed to comply with applicable data protection laws, including but not limited to:
          </p>
          <ul>
            <li>General Data Protection Regulation (GDPR) - for users in the European Union</li>
            <li>California Consumer Privacy Act (CCPA) - for users in California, USA</li>
            <li>Personal Data Protection Act - for applicable jurisdictions</li>
          </ul>
        </section>

        <footer className="privacy-footer">
          <p>© {new Date().getFullYear()} Anitha Stores. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

