import type { Metadata } from "next";
import PolicyPage, { PolicySection, PolicyList } from "@/components/PolicyPage";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: `Shipping & Delivery Policy | ${siteConfig.brandName}`,
  description: `Dispatch times, delivery estimates, and tracking for orders placed with ${siteConfig.brandName}.`,
};

export default function ShippingPolicyPage() {
  return (
    <PolicyPage
      title="Shipping & Delivery Policy"
      intro="How quickly we dispatch your order, what delivery costs, and what to do if something goes wrong in transit."
    >
      <PolicySection heading="1. Shipping Charges">
        <p>
          <strong>Delivery is free on every order, with no minimum purchase.</strong>{" "}
          The price shown on the product page is the total you pay — we do not
          add shipping charges at checkout.
        </p>
      </PolicySection>

      <PolicySection heading="2. Dispatch Time">
        <p>
          Orders are processed and handed to our delivery partner within{" "}
          <strong>{siteConfig.dispatchDays}</strong> of payment confirmation.
          Orders placed on a Sunday or a public holiday are processed on the next
          working day.
        </p>
      </PolicySection>

      <PolicySection heading="3. Delivery Estimates">
        <p>
          Once dispatched, orders typically arrive within{" "}
          <strong>{siteConfig.deliveryEstimate}</strong>, depending on your
          location. Remote and non-metro PIN codes can take longer.
        </p>
        <p>
          These are estimates, not guarantees. Delivery can be delayed by weather,
          strikes, regional restrictions, or other events outside our control. We
          will keep you informed if we become aware of a delay affecting your
          order.
        </p>
      </PolicySection>

      <PolicySection heading="4. Serviceable Areas">
        <p>
          We currently ship across India. A small number of PIN codes are not
          serviceable by our delivery partners; if yours is one of them, we will
          contact you and refund the order in full.
        </p>
      </PolicySection>

      <PolicySection heading="5. Tracking Your Order">
        <p>
          You can see the current status of every order under{" "}
          <a href="/dashboard">My Orders</a> in your account. Once a shipment is
          handed over, the carrier name and tracking number appear there, and we
          email you when the status changes.
        </p>
      </PolicySection>

      <PolicySection heading="6. Delivery Attempts & Incorrect Addresses">
        <PolicyList
          items={[
            "Our delivery partners normally make up to three attempts before returning a parcel to us.",
            "Please make sure your address and phone number are accurate and complete — an unreachable phone number is the most common cause of failed delivery.",
            "If a parcel is returned to us because the address was incorrect or nobody was available, we will contact you to arrange redelivery.",
          ]}
        />
      </PolicySection>

      <PolicySection heading="7. Damaged or Missing Shipments">
        <p>
          Inspect your parcel on arrival. If the outer packaging is visibly
          damaged, we recommend refusing the delivery. If you discover damage
          after opening, report it within <strong>48 hours</strong> with
          photographs — see our{" "}
          <a href="/refund-policy">Cancellation &amp; Refund Policy</a> for how
          replacements and refunds are handled.
        </p>
        <p>
          If tracking shows an order as delivered but you have not received it,
          contact us within 48 hours so we can raise it with the carrier.
        </p>
      </PolicySection>

      <PolicySection heading="8. Contact">
        <p>
          For any delivery question, email{" "}
          <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>{" "}
          or call {siteConfig.supportPhone} ({siteConfig.supportHours}).
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
