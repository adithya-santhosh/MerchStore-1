/**
 * Transactional email templates.
 *
 * One shell, five bodies. Everything that has to be right in every email — the
 * 600px width attribute Outlook needs, the preheader, the colour-scheme meta,
 * the mobile gutters — lives in `layout()`, so it is impossible to forget when
 * a sixth template gets added.
 *
 * Design notes
 * ------------
 * The palette is monochrome on purpose. The only saturated colour in the whole
 * system is the order-status dot, which is exactly why it reads as information
 * rather than decoration. The call to action is a white button on near-black:
 * it needs no gradient, so there is nothing left for Outlook to fail to render.
 *
 * Restraint is doing the work. Every heading is a weight lighter and a size
 * smaller than it wants to be, prices are set in tabular figures so the column
 * lines up digit over digit, and rules are hairlines rather than slabs. None of
 * that is noticeable on its own. Together it is the difference.
 *
 * Preview every template and every branch with `npm run preview:emails`.
 */

// ─── Tokens ──────────────────────────────────────────────────────────────────

const color = {
  pageBg: "#08080a",
  cardBg: "#101013",
  panelBg: "#161619",
  hairline: "#232327",
  textPrimary: "#f4f4f5",
  textSecondary: "#a1a1aa",
  // #71717a was the prettier grey and failed WCAG AA on the card (3.95:1).
  // Quiet has to stop short of unreadable.
  textTertiary: "#8b8b94",
  buttonBg: "#f4f4f5",
  buttonText: "#09090b"
};

/** -apple-system puts SF Pro in Apple Mail, which is most of the premium feel. */
const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

/**
 * Lining tabular figures, so the price column lines up digit over digit. The
 * font name is single-quoted because these declarations sit inside a
 * double-quoted HTML attribute. Outlook has no such figures and ignores it.
 */
const TABULAR = "font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';";

// ─── Primitives ──────────────────────────────────────────────────────────────

const money = (value: unknown): string =>
  `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const eyebrow = (text: string): string =>
  `<p style="margin: 0 0 10px 0; font-family: ${FONT}; font-size: 11px; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: ${color.textTertiary};">${text}</p>`;

const display = (text: string, extra = ""): string =>
  `<h1 class="display" style="margin: 0; font-family: ${FONT}; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; color: ${color.textPrimary}; ${extra}">${text}</h1>`;

const lead = (text: string): string =>
  `<p style="margin: 18px 0 0 0; font-family: ${FONT}; font-size: 15px; line-height: 1.65; color: ${color.textSecondary};">${text}</p>`;

const note = (text: string): string =>
  `<p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 1.65; color: ${color.textTertiary};">${text}</p>`;

/**
 * Table-based button. The `bgcolor` attribute is what survives Outlook; the
 * background on the anchor itself is what the hover rule in `layout()`
 * transitions, on the pointer devices that have a hover state to begin with.
 */
const button = (href: string, label: string): string =>
  `<table border="0" cellspacing="0" cellpadding="0" role="presentation">
                <tr>
                  <td bgcolor="${color.buttonBg}" style="border-radius: 6px;">
                    <a class="cta" href="${href}" style="display: inline-block; padding: 13px 26px; background-color: ${color.buttonBg}; border-radius: 6px; font-family: ${FONT}; font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: ${color.buttonText}; text-decoration: none; transition: background-color 150ms ease;">${label}</a>
                  </td>
                </tr>
              </table>`;

/** "Or paste this link" fallback, for the two emails that carry a token. */
const linkFallback = (url: string): string =>
  `<p style="margin: 0 0 6px 0; font-family: ${FONT}; font-size: 12px; color: ${color.textTertiary};">Or paste this link into your browser</p>
              <p style="margin: 0; font-family: ${FONT}; font-size: 12px; line-height: 1.6; word-break: break-all;"><a href="${url}" style="color: ${color.textSecondary}; text-decoration: underline;">${url}</a></p>`;

/** One content band. Every band shares the gutter so the left edge never drifts. */
const band = (inner: string, padding: string): string =>
  `<tr>
            <td class="gutter" style="padding: ${padding};">
              ${inner}
            </td>
          </tr>`;

// ─── Shell ───────────────────────────────────────────────────────────────────

interface LayoutOptions {
  /** Browser tab title, and a fallback subject in some clients. */
  title: string;
  /** The inbox preview line. Every email gets one written for it. */
  preheader: string;
  /** Content bands, already wrapped by `band()`. */
  content: string;
}

const layout = ({ title, preheader, content }: LayoutOptions): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${title}</title>
  <style>
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media (max-width: 620px) {
      .gutter { padding-left: 24px !important; padding-right: 24px !important; }
      .display { font-size: 22px !important; }
    }
    @media (hover: hover) and (pointer: fine) {
      a.cta:hover { background-color: #ffffff !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${color.pageBg}; font-family: ${FONT}; color: ${color.textSecondary};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${preheader}</div>
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;</div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: ${color.pageBg}; padding: 48px 16px;">
    <tr>
      <td align="center">
        <table align="center" width="600" border="0" cellspacing="0" cellpadding="0" role="presentation" style="width: 100%; max-width: 600px; background-color: ${color.cardBg}; border: 1px solid ${color.hairline}; border-radius: 10px;">
          <tr>
            <td class="gutter" style="padding: 34px 40px 0 40px;">
              <p style="margin: 0; font-family: ${FONT}; font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: ${color.textTertiary};">MerchStore</p>
            </td>
          </tr>
${content}
          <tr>
            <td class="gutter" style="padding: 28px 40px 34px 40px; border-top: 1px solid ${color.hairline};">
              <p style="margin: 0; font-family: ${FONT}; font-size: 12px; line-height: 1.6; color: ${color.textTertiary};">© ${new Date().getFullYear()} MerchStore. Premium auto parts and automotive merch.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Templates ───────────────────────────────────────────────────────────────

export const getWelcomeEmailHtml = (name: string, frontendUrl: string): string =>
  layout({
    title: "Welcome to MerchStore",
    preheader: "Your account is ready — explore parts and merch for your vehicle.",
    content: [
      band(
        `${eyebrow("Welcome")}
              ${display(`Hello, ${name}.`)}
              ${lead(
                "Your account is ready. Explore our catalogue of OEM and aftermarket performance parts, accessories, and merch matched to your vehicle."
              )}`,
        "32px 40px 0 40px"
      ),
      band(button(frontendUrl, "Browse the catalogue"), "28px 40px 0 40px"),
      band(
        note("Questions about fitment or compatibility? Reply to this email and we will help."),
        "28px 40px 32px 40px"
      )
    ].join("\n")
  });

export const getOrderConfirmationEmailHtml = (order: any, frontendUrl: string): string => {
  const items: any[] = order.items || [];

  const itemsHtml = items
    .map(
      (item: any, index: number) => `
                  <tr>
                    <td style="padding: 14px 20px; ${index > 0 ? `border-top: 1px solid ${color.hairline};` : ""}">
                      <p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 500; line-height: 1.45; color: ${color.textPrimary};">${item.productName}</p>${
                        // "Qty 1" is not information. Only a real quantity earns a line.
                        Number(item.quantity) > 1
                          ? `
                      <p style="margin: 4px 0 0 0; font-family: ${FONT}; font-size: 12px; color: ${color.textTertiary};">Qty ${item.quantity}</p>`
                          : ""
                      }
                    </td>
                    <td align="right" valign="top" style="padding: 14px 20px; ${index > 0 ? `border-top: 1px solid ${color.hairline};` : ""}">
                      <p style="margin: 0; font-family: ${FONT}; font-size: 14px; font-weight: 500; color: ${color.textPrimary}; ${TABULAR}">${money(item.totalPrice)}</p>
                    </td>
                  </tr>`
    )
    .join("");

  // An empty panel is worse than no panel. An order with no line items skips it.
  const itemsPanel = items.length
    ? band(
        `<table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation" style="background-color: ${color.panelBg}; border: 1px solid ${color.hairline}; border-radius: 8px;">${itemsHtml}
                </table>`,
        "28px 40px 0 40px"
      )
    : "";

  const totalRow = (label: string, value: string): string =>
    `<tr>
                    <td style="padding: 5px 0; font-family: ${FONT}; font-size: 14px; color: ${color.textSecondary};">${label}</td>
                    <td align="right" style="padding: 5px 0; font-family: ${FONT}; font-size: 14px; color: ${color.textPrimary}; ${TABULAR}">${value}</td>
                  </tr>`;

  const address = order.shippingAddress;
  const addressStr = address
    ? `${address.addressLine1}${address.addressLine2 ? ", " + address.addressLine2 : ""}, ${address.city}, ${address.state} - ${address.postalCode}`
    : "Address on file";

  return layout({
    title: `Order Confirmation - ${order.orderNumber}`,
    preheader: `Order #${order.orderNumber} is confirmed. We are preparing it for shipment.`,
    content: [
      band(
        `${eyebrow("Order confirmed")}
              ${display(`#${order.orderNumber}`, TABULAR)}
              ${lead("Thank you — we have your order and are preparing it for shipment.")}`,
        "32px 40px 0 40px"
      ),
      itemsPanel,
      band(
        `<table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
                  ${totalRow("Subtotal:", money(order.subtotal))}
                  ${Number(order.discountAmount) > 0 ? totalRow("Discount:", `-${money(order.discountAmount)}`) : ""}
                  ${Number(order.taxAmount) > 0 ? totalRow("Tax:", money(order.taxAmount)) : ""}
                  ${Number(order.shippingCost) > 0 ? totalRow("Shipping:", money(order.shippingCost)) : ""}
                  <tr>
                    <td colspan="2" style="padding: 14px 0 0 0; border-top: 1px solid ${color.hairline};"></td>
                  </tr>
                  <tr>
                    <td style="font-family: ${FONT}; font-size: 15px; font-weight: 600; color: ${color.textPrimary};">Grand Total:</td>
                    <td align="right" style="font-family: ${FONT}; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; color: ${color.textPrimary}; ${TABULAR}">${money(order.totalAmount)}</td>
                  </tr>
                </table>`,
        "28px 40px 0 40px"
      ),
      band(
        `${eyebrow("Shipping to")}
              <p style="margin: 0; font-family: ${FONT}; font-size: 14px; line-height: 1.6; color: ${color.textSecondary};">${addressStr}</p>`,
        "32px 40px 0 40px"
      ),
      band(button(`${frontendUrl}/orders/${order.id}`, "View order"), "28px 40px 32px 40px")
    ].join("\n")
  });
};

export const getOrderStatusEmailHtml = (
  order: any,
  newStatus: string,
  frontendUrl: string
): string => {
  // The one place saturated colour is allowed, which is why it carries meaning.
  const statusColors: Record<string, string> = {
    CONFIRMED: "#0284c7",
    PROCESSING: "#6366f1",
    SHIPPED: "#8b5cf6",
    DELIVERED: "#10b981",
    CANCELLED: "#ef4444"
  };
  const dot = statusColors[newStatus] || "#475569";

  const copy =
    newStatus === "SHIPPED"
      ? "Your items are on the way. Track package updates from your account dashboard."
      : newStatus === "DELIVERED"
      ? "Your package has been delivered. We hope you enjoy it."
      : newStatus === "CANCELLED"
      ? "This order has been cancelled. Any payment taken will be refunded to the original method."
      : "We will keep you posted at every step of fulfilment.";

  return layout({
    title: `Order Status Update - ${order.orderNumber}`,
    preheader: `Order #${order.orderNumber} is now ${newStatus.toLowerCase()}.`,
    content: [
      band(
        `${eyebrow("Order update")}
              ${display(`#${order.orderNumber}`, TABULAR)}
              <table border="0" cellspacing="0" cellpadding="0" role="presentation" style="margin-top: 18px;">
                <tr>
                  <td valign="middle" style="padding-right: 9px; line-height: 0;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 8px; background-color: ${dot};"></span>
                  </td>
                  <td valign="middle" style="font-family: ${FONT}; font-size: 12px; font-weight: 600; letter-spacing: 0.09em; color: ${color.textPrimary};">${newStatus}</td>
                </tr>
              </table>
              ${lead(copy)}`,
        "32px 40px 0 40px"
      ),
      band(button(`${frontendUrl}/orders/${order.id}`, "Track order"), "28px 40px 32px 40px")
    ].join("\n")
  });
};

export const getPasswordResetEmailHtml = (name: string, resetUrl: string): string =>
  layout({
    title: "Reset Your Password",
    preheader: "Use the link inside to choose a new password. It expires in 60 minutes.",
    content: [
      band(
        `${eyebrow("Security")}
              ${display("Reset your password")}
              ${lead(
                `Hello ${name || "there"} — we received a request to reset the password on your MerchStore account. Choose a new one below. This link expires in 60 minutes.`
              )}`,
        "32px 40px 0 40px"
      ),
      band(button(resetUrl, "Choose a new password"), "28px 40px 0 40px"),
      band(linkFallback(resetUrl), "28px 40px 0 40px"),
      band(
        note(
          "If you did not request this, you can ignore this email. Your password will not change."
        ),
        "28px 40px 32px 40px"
      )
    ].join("\n")
  });

export const getEmailVerificationHtml = (name: string, verifyUrl: string): string =>
  layout({
    title: "Confirm Your Email",
    preheader: "Confirm your address to get order and delivery updates. Link valid 24 hours.",
    content: [
      band(
        `${eyebrow("One more step")}
              ${display("Confirm your email address")}
              ${lead(
                `Hi ${name} — confirm this address so we can send you order confirmations and delivery updates. This link is valid for 24 hours.`
              )}`,
        "32px 40px 0 40px"
      ),
      band(button(verifyUrl, "Confirm email address"), "28px 40px 0 40px"),
      band(linkFallback(verifyUrl), "28px 40px 0 40px"),
      band(
        note(
          "Did not create an account? You can safely ignore this email — nothing happens without confirmation."
        ),
        "28px 40px 32px 40px"
      )
    ].join("\n")
  });
