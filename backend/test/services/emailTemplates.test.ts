import { describe, it, expect } from "vitest";
import {
  getWelcomeEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  getPasswordResetEmailHtml,
  getEmailVerificationHtml,
} from "../../src/services/emailTemplates";

const FRONTEND = "https://shop.example.com";

const order = (over: Record<string, any> = {}) => ({
  id: 42,
  orderNumber: "ORD-2026-00042",
  subtotal: 1000,
  discountAmount: 0,
  taxAmount: 0,
  shippingCost: 0,
  totalAmount: 1000,
  items: [{ productName: "Roof Rack", quantity: 2, totalPrice: 1000 }],
  shippingAddress: {
    addressLine1: "221B Baker Street",
    addressLine2: null,
    city: "Bengaluru",
    state: "KA",
    postalCode: "560001",
  },
  ...over,
});

describe("getWelcomeEmailHtml", () => {
  it("greets the recipient by name", () => {
    const html = getWelcomeEmailHtml("Ada Lovelace", FRONTEND);

    expect(html).toContain("Ada Lovelace");
  });

  it("links to the configured storefront, not a hard-coded localhost", () => {
    const html = getWelcomeEmailHtml("Ada", FRONTEND);

    expect(html).toContain(`href="${FRONTEND}"`);
    expect(html).not.toContain("localhost");
  });

  it("produces a complete HTML document", () => {
    const html = getWelcomeEmailHtml("Ada", FRONTEND);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain('<meta charset="utf-8">');
  });

  it("stamps the current year in the footer", () => {
    const html = getWelcomeEmailHtml("Ada", FRONTEND);

    expect(html).toContain(String(new Date().getFullYear()));
  });
});

describe("getOrderConfirmationEmailHtml", () => {
  it("shows the order number in the subject heading and body", () => {
    const html = getOrderConfirmationEmailHtml(order(), FRONTEND);

    expect(html).toContain("ORD-2026-00042");
  });

  it("renders a row for each line item", () => {
    const html = getOrderConfirmationEmailHtml(
      order({
        items: [
          { productName: "Roof Rack", quantity: 1, totalPrice: 500 },
          { productName: "Recovery Strap", quantity: 2, totalPrice: 500 },
        ],
      }),
      FRONTEND
    );

    expect(html).toContain("Roof Rack");
    expect(html).toContain("Recovery Strap");
  });

  it("formats money in Indian digit grouping", () => {
    const html = getOrderConfirmationEmailHtml(
      order({ subtotal: 150000, totalAmount: 150000, items: [] }),
      FRONTEND
    );

    // en-IN groups as 1,50,000.00 rather than 150,000.00
    expect(html).toContain("1,50,000.00");
  });

  it("hides the discount row when nothing was discounted", () => {
    const html = getOrderConfirmationEmailHtml(order({ discountAmount: 0 }), FRONTEND);

    expect(html).not.toContain("Discount:");
  });

  it("shows the discount row when a coupon was applied", () => {
    const html = getOrderConfirmationEmailHtml(order({ discountAmount: 100 }), FRONTEND);

    expect(html).toContain("Discount:");
    expect(html).toContain("-₹100.00");
  });

  it("hides the tax row when no tax was charged", () => {
    const html = getOrderConfirmationEmailHtml(order({ taxAmount: 0 }), FRONTEND);

    expect(html).not.toContain("Tax:");
  });

  it("shows the tax row when tax was charged", () => {
    const html = getOrderConfirmationEmailHtml(order({ taxAmount: 180 }), FRONTEND);

    expect(html).toContain("Tax:");
  });

  it("hides the shipping row for a free-shipping order", () => {
    const html = getOrderConfirmationEmailHtml(order({ shippingCost: 0 }), FRONTEND);

    expect(html).not.toContain("Shipping:");
  });

  it("always shows the grand total", () => {
    const html = getOrderConfirmationEmailHtml(order({ totalAmount: 1234.5 }), FRONTEND);

    expect(html).toContain("Grand Total:");
    expect(html).toContain("1,234.50");
  });

  it("assembles a single-line shipping address", () => {
    const html = getOrderConfirmationEmailHtml(order(), FRONTEND);

    expect(html).toContain("221B Baker Street, Bengaluru, KA - 560001");
  });

  it("includes the second address line when there is one", () => {
    const html = getOrderConfirmationEmailHtml(
      order({
        shippingAddress: {
          addressLine1: "221B Baker Street",
          addressLine2: "Near the park",
          city: "Bengaluru",
          state: "KA",
          postalCode: "560001",
        },
      }),
      FRONTEND
    );

    expect(html).toContain("221B Baker Street, Near the park, Bengaluru, KA - 560001");
  });

  it("falls back gracefully when no address is attached", () => {
    const html = getOrderConfirmationEmailHtml(order({ shippingAddress: null }), FRONTEND);

    expect(html).toContain("Address on file");
    expect(html).not.toContain("undefined");
  });

  it("survives an order with no items", () => {
    const html = getOrderConfirmationEmailHtml(order({ items: [] }), FRONTEND);

    expect(html).toContain("ORD-2026-00042");
    expect(html).not.toContain("undefined");
  });

  it("survives an order whose items key is missing entirely", () => {
    const html = getOrderConfirmationEmailHtml(order({ items: undefined }), FRONTEND);

    expect(html).toContain("Grand Total:");
  });

  it("deep-links to the order on the storefront", () => {
    const html = getOrderConfirmationEmailHtml(order(), FRONTEND);

    expect(html).toContain(`${FRONTEND}/orders/42`);
  });

  it("handles Decimal-style string amounts without printing NaN", () => {
    const html = getOrderConfirmationEmailHtml(
      order({ subtotal: "1000.00", totalAmount: "1000.00" }),
      FRONTEND
    );

    expect(html).not.toContain("NaN");
  });
});

describe("getOrderStatusEmailHtml", () => {
  it("names the new status", () => {
    const html = getOrderStatusEmailHtml(order(), "SHIPPED", FRONTEND);

    expect(html).toContain("SHIPPED");
  });

  it("gives each known status its own badge colour", () => {
    const shipped = getOrderStatusEmailHtml(order(), "SHIPPED", FRONTEND);
    const delivered = getOrderStatusEmailHtml(order(), "DELIVERED", FRONTEND);

    expect(shipped).toContain("#8b5cf6");
    expect(delivered).toContain("#10b981");
  });

  it("falls back to a neutral badge for an unmapped status", () => {
    const html = getOrderStatusEmailHtml(order(), "PENDING", FRONTEND);

    expect(html).toContain("#475569");
  });

  it("uses the cancellation colour for a cancelled order", () => {
    const html = getOrderStatusEmailHtml(order(), "CANCELLED", FRONTEND);

    expect(html).toContain("#ef4444");
  });

  it("includes the order number", () => {
    const html = getOrderStatusEmailHtml(order(), "SHIPPED", FRONTEND);

    expect(html).toContain("ORD-2026-00042");
  });
});

describe("getPasswordResetEmailHtml", () => {
  it("embeds the reset link exactly as given", () => {
    const resetUrl = `${FRONTEND}/reset-password?token=abc123`;
    const html = getPasswordResetEmailHtml("Ada", resetUrl);

    expect(html).toContain(resetUrl);
  });

  it("addresses the recipient by name", () => {
    const html = getPasswordResetEmailHtml("Ada", `${FRONTEND}/reset-password?token=x`);

    expect(html).toContain("Ada");
  });

  it("produces a complete HTML document", () => {
    const html = getPasswordResetEmailHtml("Ada", `${FRONTEND}/reset-password?token=x`);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
  });
});

describe("getEmailVerificationHtml", () => {
  it("embeds the verification link", () => {
    const verifyUrl = `${FRONTEND}/verify-email?token=abc123`;
    const html = getEmailVerificationHtml("Ada", verifyUrl);

    expect(html).toContain(verifyUrl);
  });

  it("addresses the recipient by name", () => {
    const html = getEmailVerificationHtml("Ada", `${FRONTEND}/verify-email?token=x`);

    expect(html).toContain("Ada");
  });
});

// ─── Hardening note, characterised so a fix shows up as a failing test ────────
//
// None of the templates escape interpolated values, and several of those values
// are customer-controlled (display name, product name, address lines). The
// blast radius is small — an order confirmation goes to the customer whose own
// data it is — but a forwarded mail, or a name chosen by one user appearing in
// an admin-facing mail, would render the injected markup. Worth an escape
// helper if templates ever carry data from one user to another.
describe("template escaping", () => {
  it("KNOWN GAP: a name containing markup is interpolated raw", () => {
    const html = getWelcomeEmailHtml('<img src=x onerror="alert(1)">', FRONTEND);

    expect(html).toContain('<img src=x onerror="alert(1)">');
    expect(html).not.toContain("&lt;img");
  });

  it("KNOWN GAP: a product name containing markup is interpolated raw", () => {
    const html = getOrderConfirmationEmailHtml(
      order({ items: [{ productName: "<b>Rack</b>", quantity: 1, totalPrice: 1 }] }),
      FRONTEND
    );

    expect(html).toContain("<b>Rack</b>");
  });

  it("KNOWN GAP: an address line containing markup is interpolated raw", () => {
    const html = getOrderConfirmationEmailHtml(
      order({
        shippingAddress: {
          addressLine1: "<script>x</script>",
          addressLine2: null,
          city: "Bengaluru",
          state: "KA",
          postalCode: "560001",
        },
      }),
      FRONTEND
    );

    expect(html).toContain("<script>x</script>");
  });
});
