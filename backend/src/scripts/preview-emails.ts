/// <reference types="node" />
/**
 * Renders every transactional email to backend/.preview/*.html so they can be
 * opened in a browser during development. No API key, no sending, no network.
 *
 *   npm run preview:emails
 *
 * Each branch that changes the layout gets its own file — order totals with and
 * without the optional discount/tax/shipping rows, and every order status badge.
 * Those are the variants that break without anyone noticing.
 */
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import {
  getWelcomeEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  getPasswordResetEmailHtml,
  getEmailVerificationHtml
} from "../services/emailTemplates";

const OUT_DIR = path.join(__dirname, "..", "..", ".preview");
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const fullOrder = {
  id: "ord_9f3a1c7e",
  orderNumber: "MS-2026-0417",
  subtotal: 24990,
  discountAmount: 2500,
  taxAmount: 4048.2,
  shippingCost: 299,
  totalAmount: 26837.2,
  items: [
    { productName: "Brembo Front Brake Pad Set — Ceramic", quantity: 1, totalPrice: 12490 },
    { productName: "K&N High-Flow Air Filter (Drop-in)", quantity: 2, totalPrice: 8500 },
    { productName: "MerchStore Pit Crew Tee — Charcoal", quantity: 1, totalPrice: 4000 }
  ],
  shippingAddress: {
    addressLine1: "Flat 12B, Sunrise Residency",
    addressLine2: "Nandavanam Road",
    city: "Thiruvananthapuram",
    state: "Kerala",
    postalCode: "695014"
  }
};

// Exercises the other branch: every optional total row is absent, one item only.
const minimalOrder = {
  id: "ord_2b8d4a01",
  orderNumber: "MS-2026-0418",
  subtotal: 1499,
  discountAmount: 0,
  taxAmount: 0,
  shippingCost: 0,
  totalAmount: 1499,
  items: [{ productName: "Microfibre Detailing Cloth (Pack of 3)", quantity: 1, totalPrice: 1499 }],
  shippingAddress: null
};

const STATUSES = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const pages: Array<{ file: string; label: string; html: string }> = [
  {
    file: "welcome.html",
    label: "Welcome",
    html: getWelcomeEmailHtml("Adithya", FRONTEND_URL)
  },
  {
    file: "order-confirmation.html",
    label: "Order confirmation — discount, tax and shipping",
    html: getOrderConfirmationEmailHtml(fullOrder, FRONTEND_URL)
  },
  {
    file: "order-confirmation-minimal.html",
    label: "Order confirmation — no optional rows, address on file",
    html: getOrderConfirmationEmailHtml(minimalOrder, FRONTEND_URL)
  },
  ...STATUSES.map((status) => ({
    file: `order-status-${status.toLowerCase()}.html`,
    label: `Order status — ${status}`,
    html: getOrderStatusEmailHtml(fullOrder, status, FRONTEND_URL)
  })),
  {
    file: "password-reset.html",
    label: "Password reset",
    html: getPasswordResetEmailHtml("Adithya", `${FRONTEND_URL}/reset-password?token=preview-token-abc123`)
  },
  {
    file: "email-verification.html",
    label: "Email verification",
    html: getEmailVerificationHtml("Adithya", `${FRONTEND_URL}/verify-email?token=preview-token-xyz789`)
  }
];

const indexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>MerchStore email previews</title>
  <style>
    body { margin: 0; padding: 48px 24px; background: #0f172a; color: #e2e8f0;
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    main { max-width: 640px; margin: 0 auto; }
    h1 { margin: 0 0 4px; font-size: 20px; }
    p.meta { margin: 0 0 32px; color: #64748b; font-size: 13px; }
    ul { list-style: none; margin: 0; padding: 0; }
    li + li { margin-top: 4px; }
    a { display: block; padding: 12px 16px; border-radius: 8px; color: #e2e8f0;
        text-decoration: none; background: #1e293b; border: 1px solid #334155;
        font-size: 14px; transition: background-color 150ms ease, border-color 150ms ease; }
    a:hover { background: #243349; border-color: #475569; }
    a span { display: block; color: #64748b; font-size: 12px; margin-top: 2px; }
  </style>
</head>
<body>
  <main>
    <h1>MerchStore email previews</h1>
    <p class="meta">Generated ${new Date().toLocaleString("en-IN")} · ${pages.length} templates · re-run <code>npm run preview:emails</code> after editing.</p>
    <ul>
      ${pages.map((p) => `<li><a href="./${p.file}">${p.label}<span>${p.file}</span></a></li>`).join("\n      ")}
    </ul>
  </main>
</body>
</html>`;

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const page of pages) {
  fs.writeFileSync(path.join(OUT_DIR, page.file), page.html, "utf8");
}
fs.writeFileSync(path.join(OUT_DIR, "index.html"), indexHtml, "utf8");

const indexPath = path.join(OUT_DIR, "index.html");
console.log(`Rendered ${pages.length} templates to ${OUT_DIR}`);
console.log(`Open: ${pathToFileURL(indexPath).href}`);
