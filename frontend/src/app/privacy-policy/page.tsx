import type { Metadata } from "next";
import PolicyPage, { PolicySection, PolicyList } from "@/components/PolicyPage";
import { siteConfig, formattedAddress } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.brandName}`,
  description: `How ${siteConfig.brandName} collects, uses, and protects your personal information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      intro={`This policy explains what personal information ${siteConfig.legalName} ("${siteConfig.brandName}", "we", "us") collects when you use ${siteConfig.domain}, why we collect it, and the choices you have.`}
    >
      <PolicySection heading="1. Information We Collect">
        <p>We collect only what we need to run the store and fulfil your orders:</p>
        <PolicyList
          items={[
            <><strong>Account details</strong> — your name, email address, and (optionally) phone number when you register.</>,
            <><strong>Order and delivery details</strong> — the shipping address you provide at checkout, along with your order history.</>,
            <><strong>Payment information</strong> — processed entirely by our payment gateway. We receive only a transaction reference and payment status. <strong>We never see or store your full card number, UPI PIN, CVV, or net-banking credentials.</strong></>,
            <><strong>Content you submit</strong> — product reviews, wishlist items, and any message you send our support team.</>,
            <><strong>Technical data</strong> — IP address and basic request information, recorded in our server logs for security and debugging.</>,
          ]}
        />
      </PolicySection>

      <PolicySection heading="2. How We Use Your Information">
        <PolicyList
          items={[
            "To process, fulfil, and deliver your orders.",
            "To send transactional emails — order confirmations, status updates, and password resets.",
            "To provide customer support and respond to your enquiries.",
            "To detect, prevent, and investigate fraud or abuse of the service.",
            "To meet our legal, tax, and accounting obligations.",
          ]}
        />
        <p>
          We do not sell your personal information, and we do not share it with
          third parties for their own marketing purposes.
        </p>
      </PolicySection>

      <PolicySection heading="3. Service Providers We Share Data With">
        <p>
          We share the minimum necessary data with the providers that operate
          parts of our service:
        </p>
        <PolicyList
          items={[
            <><strong>Razorpay</strong> — payment processing. Your payment details go directly to Razorpay and are handled under their own privacy policy and PCI-DSS compliance.</>,
            <><strong>Email delivery provider</strong> — to send transactional email such as order confirmations and password resets.</>,
            <><strong>Hosting and database providers</strong> — to host the website and securely store order and account records.</>,
            <><strong>Delivery partners</strong> — your name, address, and phone number, so your order can be delivered.</>,
          ]}
        />
      </PolicySection>

      <PolicySection heading="4. Cookies">
        <p>
          We use a small number of strictly necessary cookies. The most important
          is an authentication cookie that keeps you signed in; it is
          <strong> HttpOnly</strong>, meaning scripts running in your browser
          cannot read it. We also store a temporary identifier so that a guest
          shopping cart survives between visits. Blocking these cookies will
          prevent sign-in and checkout from working.
        </p>
      </PolicySection>

      <PolicySection heading="5. How We Protect Your Data">
        <PolicyList
          items={[
            "Passwords are stored only as salted bcrypt hashes — never in plain text, and never recoverable by us.",
            "Traffic between your browser and our servers is encrypted with HTTPS.",
            "Payment credentials never touch our servers; they go directly to Razorpay.",
            "Access to production data is limited to those who need it to operate the store.",
          ]}
        />
        <p>
          No system can be guaranteed perfectly secure, but we take reasonable
          technical and organisational measures to protect your information.
        </p>
      </PolicySection>

      <PolicySection heading="6. Data Retention">
        <p>
          We keep your account information for as long as your account is active.
          Order, invoice, and payment records are retained for as long as
          required by Indian tax and accounting law, even if you later close your
          account.
        </p>
      </PolicySection>

      <PolicySection heading="7. Your Rights">
        <p>
          Subject to applicable law, including the Digital Personal Data
          Protection Act, 2023, you may:
        </p>
        <PolicyList
          items={[
            "Access the personal data we hold about you.",
            "Ask us to correct information that is inaccurate or incomplete.",
            "Ask us to delete your account and associated personal data, except records we must retain by law.",
            "Withdraw consent for non-essential communications at any time.",
          ]}
        />
        <p>
          To exercise any of these rights, write to us at{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
        </p>
      </PolicySection>

      <PolicySection heading="8. Children">
        <p>
          Our store is not directed at children under 18. We do not knowingly
          collect personal information from children. If you believe a child has
          provided us information, please contact us and we will delete it.
        </p>
      </PolicySection>

      <PolicySection heading="9. Changes to This Policy">
        <p>
          We may update this policy from time to time. The revision date at the
          top of this page always reflects the current version, and material
          changes will be notified on this page.
        </p>
      </PolicySection>

      <PolicySection heading="10. Grievance Officer & Contact">
        <p>
          In accordance with the Information Technology Act, 2000 and the rules
          made thereunder, and the Digital Personal Data Protection Act, 2023,
          the contact details of our Grievance Officer are:
        </p>
        <p>
          <strong>{siteConfig.grievanceOfficer.name}</strong>
          <br />
          {siteConfig.legalName}
          <br />
          {formattedAddress}
          <br />
          Email:{" "}
          <a href={`mailto:${siteConfig.grievanceOfficer.email}`}>
            {siteConfig.grievanceOfficer.email}
          </a>
          <br />
          Phone: {siteConfig.supportPhone}
        </p>
        <p>We aim to acknowledge every grievance within 48 hours.</p>
      </PolicySection>
    </PolicyPage>
  );
}
