import type { Metadata } from "next";
import PolicyPage, { PolicySection, PolicyList } from "@/components/PolicyPage";
import { siteConfig, formattedAddress } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Terms & Conditions | ${siteConfig.brandName}`,
  description: `The terms that govern your use of ${siteConfig.brandName} and any purchase you make from us.`,
};

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      intro={`These terms govern your use of ${siteConfig.domain} and any purchase you make from ${siteConfig.legalName}. By using the site or placing an order, you agree to them.`}
    >
      <PolicySection heading="1. Who We Are">
        <p>
          This website is operated by <strong>{siteConfig.legalName}</strong>, a{" "}
          {siteConfig.entityType} registered in India at {formattedAddress}
          {siteConfig.gstin ? <>, GSTIN {siteConfig.gstin}</> : null}. References
          to &quot;we&quot;, &quot;us&quot;, and &quot;{siteConfig.brandName}&quot; mean this entity.
        </p>
      </PolicySection>

      <PolicySection heading="2. Eligibility">
        <p>
          You must be at least 18 years old and capable of entering into a
          binding contract under the Indian Contract Act, 1872 to purchase from
          us. By placing an order you confirm that you meet these requirements.
        </p>
      </PolicySection>

      <PolicySection heading="3. Your Account">
        <PolicyList
          items={[
            "You are responsible for keeping your password confidential and for all activity that occurs under your account.",
            "You agree to provide accurate and current information, particularly your delivery address and contact details.",
            "Notify us immediately if you suspect unauthorised use of your account.",
            "We may suspend or close accounts involved in fraud, abuse, or breach of these terms.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="4. Products, Pricing & Availability">
        <PolicyList
          items={[
            <>All prices are listed in Indian Rupees (INR) and are <strong>inclusive of all applicable taxes</strong>. The price shown on the product page is the price you pay.</>,
            <>We currently charge <strong>no separate shipping fee</strong> — delivery is free on every order. See our Shipping Policy for details.</>,
            "Product images and descriptions are provided as accurately as possible, but minor variation in colour or finish may occur.",
            "All items are subject to availability. Stock levels shown are indicative and can change between browsing and checkout.",
            "We may correct pricing or description errors, and may change prices at any time before you place an order.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="5. Orders & Acceptance">
        <p>
          Your order is an offer to buy. A confirmation email acknowledges that
          we received your order; it does not by itself constitute acceptance.
          The contract is formed when we dispatch the item.
        </p>
        <p>
          We may decline or cancel an order — with a full refund — where the item
          is out of stock, where there was a pricing or listing error, where the
          delivery address is outside our serviceable area, or where we suspect
          fraud.
        </p>
      </PolicySection>

      <PolicySection heading="6. Payment">
        <p>
          Online payments are processed by <strong>Razorpay</strong>. We do not
          receive or store your card, UPI, or net-banking credentials. Cash on
          Delivery may be offered on eligible orders. If a payment fails or is
          reversed, we may cancel the corresponding order.
        </p>
      </PolicySection>

      <PolicySection heading="7. Cancellations, Returns & Refunds">
        <p>
          Cancellation and refund terms are set out in our{" "}
          <a href="/refund-policy">Cancellation &amp; Refund Policy</a>, which
          forms part of these terms.
        </p>
      </PolicySection>

      <PolicySection heading="8. Fitment & Intended Use">
        <p>
          Vehicle-compatibility information is provided as guidance only. It is
          your responsibility to confirm that a part suits your vehicle&apos;s exact
          make, model, variant, and year before purchase and before fitting.
        </p>
        <p>
          Certain accessories are intended for off-road or track use and may not
          be street-legal in every jurisdiction. You are responsible for ensuring
          that any part you fit complies with applicable motor-vehicle
          regulations. Professional installation is strongly recommended;
          improper fitting can void warranties and compromise safety.
        </p>
      </PolicySection>

      <PolicySection heading="9. Reviews & User Content">
        <p>
          You retain ownership of reviews and other content you submit, and grant
          us a non-exclusive, royalty-free licence to display it on the site. Do
          not post content that is unlawful, misleading, defamatory, obscene, or
          infringes someone else&apos;s rights. We may moderate or remove content at
          our discretion.
        </p>
      </PolicySection>

      <PolicySection heading="10. Intellectual Property">
        <p>
          All site content — including text, layout, graphics, and logos — is
          owned by {siteConfig.legalName} or its licensors and is protected by
          applicable intellectual-property law. You may not copy, reproduce, or
          redistribute it commercially without our prior written permission.
        </p>
      </PolicySection>

      <PolicySection heading="11. Limitation of Liability">
        <p>
          To the fullest extent permitted by law, our total liability arising out
          of or relating to any order is limited to the amount you paid for that
          order. We are not liable for indirect or consequential losses,
          including loss of profit or vehicle downtime. Nothing in these terms
          excludes liability that cannot lawfully be excluded, including under
          the Consumer Protection Act, 2019.
        </p>
      </PolicySection>

      <PolicySection heading="12. Governing Law & Jurisdiction">
        <p>
          These terms are governed by the laws of India. The courts at{" "}
          {siteConfig.jurisdictionCity} shall have exclusive jurisdiction over
          any dispute, subject to any right you have to approach a consumer forum
          under applicable consumer-protection law.
        </p>
      </PolicySection>

      <PolicySection heading="13. Changes to These Terms">
        <p>
          We may revise these terms from time to time. The version in force at
          the moment you place an order is the version that applies to that
          order.
        </p>
      </PolicySection>

      <PolicySection heading="14. Contact">
        <p>
          {siteConfig.legalName}
          <br />
          {formattedAddress}
          <br />
          Email: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
          <br />
          Phone: {siteConfig.supportPhone}
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
