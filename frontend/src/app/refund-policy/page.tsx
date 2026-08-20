import type { Metadata } from "next";
import PolicyPage, { PolicySection, PolicyList } from "@/components/PolicyPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Cancellation & Refund Policy | ${siteConfig.brandName}`,
  description: `How to cancel an order, return an item, and how refunds are processed at ${siteConfig.brandName}.`,
};

export default function RefundPolicyPage() {
  return (
    <PolicyPage
      title="Cancellation & Refund Policy"
      intro="We want you to be satisfied with your purchase. This page explains how to cancel an order, when you can return an item, and how quickly refunds reach you."
    >
      <PolicySection heading="1. Cancelling an Order">
        <PolicyList
          items={[
            <><strong>Before dispatch</strong> — you may cancel free of charge. Contact us as soon as possible at{" "}
              <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a> with your order number. If the order was prepaid, we refund the full amount.</>,
            <><strong>After dispatch</strong> — the order can no longer be cancelled. You may refuse delivery or request a return once it arrives, subject to the conditions below.</>,
          ]}
        />
      </PolicySection>

      <PolicySection heading="2. Returns">
        <p>
          You may request a return within{" "}
          <strong>{siteConfig.returnWindowDays} days of delivery</strong>,
          provided the item is:
        </p>
        <PolicyList
          items={[
            "Unused, unfitted, and in the same condition in which you received it.",
            "In its original packaging, with all tags, manuals, fittings, and accessories included.",
            "Accompanied by the order number or invoice.",
          ]}
        />
        <p>
          To start a return, email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          with your order number and — where the item is damaged or incorrect —
          photographs of the item and its packaging.
        </p>
      </PolicySection>

      <PolicySection heading="3. Items We Cannot Accept Back">
        <PolicyList
          items={[
            "Items that have been fitted, installed, drilled, cut, painted, or otherwise modified.",
            "Items showing signs of use, road wear, or installation marks.",
            "Products returned without their original packaging or with missing components.",
            "Made-to-order, custom-configured, or personalised items.",
            "Requests raised after the return window has closed.",
          ]}
        />
        <p>
          These exclusions do not affect your rights where an item is defective,
          damaged in transit, or not as described.
        </p>
      </PolicySection>

      <PolicySection heading="4. Damaged, Defective, or Incorrect Items">
        <p>
          If your order arrives damaged, defective, or is not what you ordered,
          tell us within <strong>48 hours of delivery</strong> with photographs.
          We will arrange a replacement or a full refund, including any return
          shipping cost, at no charge to you.
        </p>
        <p>
          Where possible, please inspect the parcel before accepting delivery. If
          the outer packaging is visibly damaged, refusing the delivery makes the
          claim considerably easier to resolve.
        </p>
      </PolicySection>

      <PolicySection heading="5. Refunds">
        <PolicyList
          items={[
            "Once we receive and inspect a returned item, we notify you whether the refund is approved.",
            <>Approved refunds are issued to the <strong>original payment method</strong> and typically appear within <strong>{siteConfig.refundProcessingDays}</strong>, depending on your bank or card issuer.</>,
            "Online payments are refunded through Razorpay to the source account.",
            "For Cash on Delivery orders, we collect your bank details securely in order to process the refund by transfer.",
            "Because delivery is free on all orders, no shipping charge is deducted from your refund.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="6. Failed or Duplicate Payments">
        <p>
          If money is debited but your order does not confirm, the amount is
          normally reversed automatically by your bank within{" "}
          {siteConfig.refundProcessingDays}. If it has not appeared after that,
          contact us with your transaction reference and we will trace it with
          Razorpay.
        </p>
      </PolicySection>

      <PolicySection heading="7. Contact Us">
        <p>
          Questions about a cancellation, return, or refund? Email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          or call {siteConfig.supportPhone} ({siteConfig.supportHours}). Quoting
          your order number helps us resolve things faster.
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
