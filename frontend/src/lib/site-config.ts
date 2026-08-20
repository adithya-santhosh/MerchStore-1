/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BUSINESS DETAILS — FILL THESE IN BEFORE GOING LIVE
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Every legal/policy page reads from this file, so you only need to edit here.
 *
 * Razorpay checks these details during live-account activation, and the
 * addresses/contacts shown on your policy pages must match what you submit to
 * them. Anything still wrapped in [square brackets] is a placeholder and will
 * render literally on the public site — search this file for "[" before launch.
 *
 * Required before launch:
 *   1. legalName        — the registered entity that receives the money
 *   2. address          — full registered/operating address with PIN code
 *   3. supportEmail     — a mailbox you actually monitor
 *   4. supportPhone     — a reachable number (Razorpay expects one)
 *   5. grievanceOfficer — required under India's DPDP Act 2023 / IT Rules
 *   6. gstin            — if GST-registered; otherwise set to null
 *   7. domain           — your live GoDaddy domain
 *   8. policyLastUpdated— bump whenever you revise any policy text
 */

export const siteConfig = {
  /** Customer-facing brand name. */
  brandName: "MerchStore",

  /** Registered legal entity — e.g. "Acme Retail Private Limited" or the
   *  proprietor's name for a sole proprietorship. Must match your bank and
   *  Razorpay records. */
  legalName: "[Your Registered Business Name]",

  /** e.g. "Private Limited Company", "Sole Proprietorship", "LLP" */
  entityType: "[Sole Proprietorship / Private Limited]",

  /** Live site URL, used in policy text and (later) SEO metadata. */
  domain: "[https://yourdomain.com]",

  address: {
    line1: "[Building / Street]",
    line2: "[Area / Landmark]",
    city: "[City]",
    state: "[State]",
    postalCode: "[PIN Code]",
    country: "India",
  },

  supportEmail: "[support@yourdomain.com]",
  supportPhone: "[+91 XXXXX XXXXX]",

  /** Business hours shown on the contact page. */
  supportHours: "Monday to Saturday, 10:00 AM – 6:00 PM IST",

  /** Required by the DPDP Act 2023 and the IT (Intermediary Guidelines) Rules.
   *  Can be the founder for a small business. */
  grievanceOfficer: {
    name: "[Officer Name]",
    email: "[grievance@yourdomain.com]",
  },

  /** GST identification number, or null if you are not GST-registered. */
  gstin: "[Your GSTIN]" as string | null,

  /** Courts of this city get exclusive jurisdiction under the Terms. */
  jurisdictionCity: "[City]",

  /** Effective date shown on every policy page. Bump on each revision. */
  policyLastUpdated: "20 August 2026",

  // ── Commercial policy values ───────────────────────────────────────────────
  // These are stated in the policy text. Keep them in sync with how the store
  // actually behaves, and with the admin Settings Panel.

  /** Days after delivery a customer may request a return. */
  returnWindowDays: 7,

  /** Business days for a refund to reach the original payment method.
   *  Razorpay typically settles refunds in 5–7 business days. */
  refundProcessingDays: "5–7 business days",

  /** Business days to dispatch an order after payment. */
  dispatchDays: "1–2 business days",

  /** Typical delivery window after dispatch. */
  deliveryEstimate: "3–7 business days",
} as const;

/** Single-line address, e.g. for inline mentions in policy copy. */
export const formattedAddress = [
  siteConfig.address.line1,
  siteConfig.address.line2,
  siteConfig.address.city,
  siteConfig.address.state,
  siteConfig.address.postalCode,
  siteConfig.address.country,
]
  .filter(Boolean)
  .join(", ");
