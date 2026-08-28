import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const send = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
    constructor(public apiKey: string) {}
  },
}));

import {
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "../../src/services/email.service";

const order = {
  id: 42,
  orderNumber: "ORD-2026-00042",
  subtotal: 1000,
  discountAmount: 0,
  taxAmount: 0,
  shippingCost: 0,
  totalAmount: 1000,
  items: [{ productName: "Roof Rack", quantity: 1, totalPrice: 1000 }],
  shippingAddress: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.EMAIL_FROM = "MerchStore <shop@example.com>";
  process.env.FRONTEND_URL = "https://shop.example.com";
  send.mockResolvedValue({ data: { id: "msg_1" }, error: null });
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.FRONTEND_URL;
});

describe("delivery when the provider is configured", () => {
  it("sends the welcome email to the recipient", async () => {
    await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "MerchStore <shop@example.com>",
        to: ["ada@example.com"],
      })
    );
  });

  it("titles the order confirmation with the order number", async () => {
    await sendOrderConfirmationEmail({ to: "ada@example.com", order });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.subject).toContain("ORD-2026-00042");
  });

  it("sends a status update naming the new status", async () => {
    await sendOrderStatusEmail({ to: "ada@example.com", order, newStatus: "SHIPPED" });

    expect(send).toHaveBeenCalledOnce();
    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.html).toContain("SHIPPED");
  });

  it("carries the reset link through to the rendered body", async () => {
    const resetUrl = "https://shop.example.com/reset-password?token=abc123";

    await sendPasswordResetEmail({ to: "ada@example.com", name: "Ada", resetUrl });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.html).toContain(resetUrl);
  });

  it("carries the verification link through to the rendered body", async () => {
    const verifyUrl = "https://shop.example.com/verify-email?token=abc123";

    await sendEmailVerification({ to: "ada@example.com", name: "Ada", verifyUrl });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.html).toContain(verifyUrl);
  });

  it("sends HTML, not a bare text body", async () => {
    await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.html).toContain("<!DOCTYPE html>");
  });

  it("uses the default from-address when EMAIL_FROM is unset", async () => {
    delete process.env.EMAIL_FROM;

    await sendWelcomeEmail({ to: "ada@example.com", name: "Ada" });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.from).toContain("@");
  });
});

describe("behaviour with no provider key", () => {
  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  it("skips the send instead of throwing, so development works offline", async () => {
    await expect(sendWelcomeEmail({ to: "ada@example.com", name: "Ada" })).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it("skips every message type the same way", async () => {
    await sendOrderConfirmationEmail({ to: "ada@example.com", order });
    await sendOrderStatusEmail({ to: "ada@example.com", order, newStatus: "SHIPPED" });
    await sendPasswordResetEmail({ to: "a@b.com", name: "Ada", resetUrl: "https://x/y" });
    await sendEmailVerification({ to: "a@b.com", name: "Ada", verifyUrl: "https://x/y" });

    expect(send).not.toHaveBeenCalled();
  });
});

describe("failure isolation", () => {
  it("swallows a provider-reported error rather than rejecting", async () => {
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });

    // Callers fire these in the background; a rejection here would surface as an
    // unhandled rejection rather than a logged warning.
    await expect(sendWelcomeEmail({ to: "ada@example.com", name: "Ada" })).resolves.toBeUndefined();
  });

  it("swallows a thrown transport error", async () => {
    send.mockRejectedValue(new Error("ECONNRESET"));

    await expect(sendWelcomeEmail({ to: "ada@example.com", name: "Ada" })).resolves.toBeUndefined();
  });

  it("swallows a transport error on the order confirmation too", async () => {
    send.mockRejectedValue(new Error("ECONNRESET"));

    await expect(
      sendOrderConfirmationEmail({ to: "ada@example.com", order })
    ).resolves.toBeUndefined();
  });

  it("does not reject when a status email fails", async () => {
    send.mockRejectedValue(new Error("timeout"));

    await expect(
      sendOrderStatusEmail({ to: "ada@example.com", order, newStatus: "DELIVERED" })
    ).resolves.toBeUndefined();
  });

  it("does not reject when a password reset email fails", async () => {
    send.mockRejectedValue(new Error("timeout"));

    await expect(
      sendPasswordResetEmail({ to: "a@b.com", name: "Ada", resetUrl: "https://x/y" })
    ).resolves.toBeUndefined();
  });

  it("renders the body before contacting the provider, so a template bug is caught locally", async () => {
    send.mockRejectedValue(new Error("network"));

    await sendOrderConfirmationEmail({ to: "ada@example.com", order });

    const arg = send.mock.calls[0]?.[0] as any;
    expect(arg.html).toContain("ORD-2026-00042");
  });
});
