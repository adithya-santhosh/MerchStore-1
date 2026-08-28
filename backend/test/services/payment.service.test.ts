import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// The Razorpay client is created once at module load from env vars, so tests
// swap it through a live getter rather than re-importing the service.
const gateway = {
  configured: true as boolean,
  orders: { create: vi.fn() },
};

vi.mock("../../src/lib/razorpay", () => ({
  get razorpay() {
    return gateway.configured ? gateway : null;
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

vi.mock("../../src/services/order.service", () => ({
  prepareCheckout: vi.fn(),
  finalizeOrder: vi.fn(),
  triggerOrderConfirmationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../src/services/settings.service", () => ({
  getSettings: vi.fn(),
}));

import prisma from "../../src/lib/prisma";
import { prepareCheckout, finalizeOrder, triggerOrderConfirmationEmail } from "../../src/services/order.service";
import { getSettings } from "../../src/services/settings.service";
import {
  timingSafeEqualHex,
  createRazorpayOrder,
  verifyRazorpayPayment,
  createMembershipRazorpayOrder,
  verifyMembershipPayment,
} from "../../src/services/payment.service";

const mockedPrisma = vi.mocked(prisma, true);
const mockedPrepareCheckout = vi.mocked(prepareCheckout);
const mockedFinalizeOrder = vi.mocked(finalizeOrder);
const mockedGetSettings = vi.mocked(getSettings);

const TEST_SECRET = "razorpay-test-secret";

/** The signature Razorpay would send for this order/payment pair. */
const signFor = (orderId: string, paymentId: string, secret = TEST_SECRET) =>
  crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

const checkoutInput = {
  userId: 7,
  address: {
    addressLine1: "221B Baker Street",
    city: "London",
    state: "LDN",
    postalCode: "560001",
  },
  paymentMethod: "razorpay" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  gateway.configured = true;
  process.env.RAZORPAY_SECRET = TEST_SECRET;
  process.env.RAZORPAY_KEY_ID = "rzp_test_key";
  gateway.orders.create.mockResolvedValue({
    id: "order_xyz",
    amount: 100_000,
    currency: "INR",
    receipt: "CHK-7-receipt-1",
  });
  mockedGetSettings.mockResolvedValue({
    tax_rate: 0,
    shipping_limit: 0,
    shipping_cost: 0,
    membership_fee: 999,
  });
});

afterEach(() => {
  delete process.env.RAZORPAY_SECRET;
  delete process.env.RAZORPAY_KEY_ID;
});

describe("timingSafeEqualHex", () => {
  it("returns true for identical hex strings", () => {
    expect(timingSafeEqualHex("abcd1234", "abcd1234")).toBe(true);
  });

  it("returns false for different hex strings of the same length", () => {
    expect(timingSafeEqualHex("abcd1234", "abcd1235")).toBe(false);
  });

  it("returns false (rather than throwing) for different-length inputs", () => {
    expect(() => timingSafeEqualHex("ab", "abcd")).not.toThrow();
    expect(timingSafeEqualHex("ab", "abcd")).toBe(false);
  });

  it("returns false for a non-hex string instead of throwing", () => {
    expect(() => timingSafeEqualHex("not-hex!", "abcd1234")).not.toThrow();
  });

  it("returns false for an empty string against a real signature", () => {
    expect(timingSafeEqualHex("", "abcd1234")).toBe(false);
  });

  it("matches a full 64-character signature", () => {
    const sig = signFor("order_1", "pay_1");
    expect(timingSafeEqualHex(sig, sig)).toBe(true);
    expect(timingSafeEqualHex(sig, signFor("order_1", "pay_2"))).toBe(false);
  });
});

describe("createRazorpayOrder", () => {
  it("refuses to take money when the gateway is not configured", async () => {
    gateway.configured = false;

    await expect(createRazorpayOrder(checkoutInput)).rejects.toThrow(/not configured/i);
    expect(mockedPrepareCheckout).not.toHaveBeenCalled();
  });

  it("charges the server-computed total, not anything the client sent", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1234.56 } as any);

    await createRazorpayOrder({ ...checkoutInput, ...({ totalAmount: 1 } as any) });

    // Razorpay works in paise, so the rupee total is scaled and rounded once.
    expect(gateway.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 123456, currency: "INR" })
    );
  });

  it("rounds sub-paise amounts rather than sending a fractional value", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 100.005 } as any);

    await createRazorpayOrder(checkoutInput);

    const amount = (gateway.orders.create.mock.calls[0]?.[0] as any).amount;
    expect(Number.isInteger(amount)).toBe(true);
    expect(amount).toBe(10001);
  });

  it("tags the receipt with the customer so payments can be reconciled", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 100 } as any);

    await createRazorpayOrder(checkoutInput);

    expect((gateway.orders.create.mock.calls[0]?.[0] as any).receipt).toMatch(/^CHK-7-receipt-\d+$/);
  });

  it("returns the publishable key and gateway order for the checkout widget", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);

    const result = await createRazorpayOrder(checkoutInput);

    expect(result).toEqual({
      key: "rzp_test_key",
      orderId: "order_xyz",
      amount: 100_000,
      currency: "INR",
      receipt: "CHK-7-receipt-1",
    });
  });

  it("never returns the gateway secret", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);

    const result = await createRazorpayOrder(checkoutInput);

    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it("lets a checkout failure surface instead of creating a payment for a bad cart", async () => {
    mockedPrepareCheckout.mockRejectedValue(new Error("Your cart is empty."));

    await expect(createRazorpayOrder(checkoutInput)).rejects.toThrow(/cart is empty/i);
    expect(gateway.orders.create).not.toHaveBeenCalled();
  });
});

describe("verifyRazorpayPayment", () => {
  const verifyInput = (over: Record<string, any> = {}) => ({
    ...checkoutInput,
    razorpayOrderId: "order_xyz",
    razorpayPaymentId: "pay_abc",
    razorpaySignature: signFor("order_xyz", "pay_abc"),
    ...over,
  });

  it("refuses when the gateway is not configured", async () => {
    gateway.configured = false;

    await expect(verifyRazorpayPayment(verifyInput())).rejects.toThrow(/not configured/i);
  });

  it("refuses to verify when the signing secret is missing on the server", async () => {
    delete process.env.RAZORPAY_SECRET;

    // Without this guard the HMAC would be computed over "undefined", producing
    // a stable signature an attacker could reproduce.
    await expect(verifyRazorpayPayment(verifyInput())).rejects.toThrow(
      /Razorpay secret is not set/i
    );
    expect(mockedFinalizeOrder).not.toHaveBeenCalled();
  });

  it("rejects a forged signature", async () => {
    await expect(
      verifyRazorpayPayment(verifyInput({ razorpaySignature: "0".repeat(64) }))
    ).rejects.toThrow(/signature verification failed/i);
    expect(mockedFinalizeOrder).not.toHaveBeenCalled();
  });

  it("rejects a signature that was valid for a different payment id", async () => {
    await expect(
      verifyRazorpayPayment(
        verifyInput({ razorpaySignature: signFor("order_xyz", "some_other_payment") })
      )
    ).rejects.toThrow(/signature verification failed/i);
  });

  it("rejects a signature minted with the wrong secret", async () => {
    await expect(
      verifyRazorpayPayment(
        verifyInput({ razorpaySignature: signFor("order_xyz", "pay_abc", "attacker-secret") })
      )
    ).rejects.toThrow(/signature verification failed/i);
  });

  it("creates no order at all when verification fails", async () => {
    await expect(
      verifyRazorpayPayment(verifyInput({ razorpaySignature: "deadbeef" }))
    ).rejects.toThrow();

    expect(mockedPrepareCheckout).not.toHaveBeenCalled();
    expect(mockedFinalizeOrder).not.toHaveBeenCalled();
  });

  it("records the payment as PAID with its gateway references on a valid signature", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);
    mockedFinalizeOrder.mockResolvedValue({ id: 1 } as any);

    await verifyRazorpayPayment(verifyInput());

    expect(mockedFinalizeOrder).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      {
        status: "PAID",
        gatewayOrderId: "order_xyz",
        gatewayPaymentId: "pay_abc",
        gatewaySignature: signFor("order_xyz", "pay_abc"),
      }
    );
  });

  it("keeps the gateway fields out of the order input", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);
    mockedFinalizeOrder.mockResolvedValue({ id: 1 } as any);

    await verifyRazorpayPayment(verifyInput());

    const orderInput = mockedFinalizeOrder.mock.calls[0]?.[1] as any;
    expect(orderInput).not.toHaveProperty("razorpaySignature");
    expect(orderInput.userId).toBe(7);
  });

  it("triggers the confirmation email once the order exists", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);
    mockedFinalizeOrder.mockResolvedValue({ id: 42 } as any);

    await verifyRazorpayPayment(verifyInput());

    expect(triggerOrderConfirmationEmail).toHaveBeenCalledWith(42);
  });

  it("still returns the order when the confirmation email fails", async () => {
    mockedPrepareCheckout.mockResolvedValue({ totalAmount: 1000 } as any);
    mockedFinalizeOrder.mockResolvedValue({ id: 42 } as any);
    vi.mocked(triggerOrderConfirmationEmail).mockRejectedValueOnce(new Error("SMTP down"));

    // The customer has already been charged — a mail failure must not lose the order.
    await expect(verifyRazorpayPayment(verifyInput())).resolves.toMatchObject({ id: 42 });
  });
});

describe("createMembershipRazorpayOrder", () => {
  it("refuses when the gateway is not configured", async () => {
    gateway.configured = false;

    await expect(createMembershipRazorpayOrder(7)).rejects.toThrow(/not configured/i);
  });

  it("reports a missing user", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    await expect(createMembershipRazorpayOrder(999)).rejects.toThrow("User not found");
  });

  it("refuses to charge an existing member a second time", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 7, isMember: true } as any);

    await expect(createMembershipRazorpayOrder(7)).rejects.toThrow(/already a premium member/i);
    expect(gateway.orders.create).not.toHaveBeenCalled();
  });

  it("takes the fee from store settings rather than hard-coding it", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 7, isMember: false } as any);
    mockedGetSettings.mockResolvedValue({
      tax_rate: 0,
      shipping_limit: 0,
      shipping_cost: 0,
      membership_fee: 1499,
    });

    const result = await createMembershipRazorpayOrder(7);

    expect((gateway.orders.create.mock.calls[0]?.[0] as any).amount).toBe(149_900);
    expect(result.membershipFee).toBe(1499);
  });

  it("falls back to ₹999 when the configured fee is zero or unset", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 7, isMember: false } as any);
    mockedGetSettings.mockResolvedValue({
      tax_rate: 0,
      shipping_limit: 0,
      shipping_cost: 0,
      membership_fee: 0,
    });

    const result = await createMembershipRazorpayOrder(7);

    expect(result.membershipFee).toBe(999);
  });

  it("tags the receipt as a membership charge, distinct from a checkout", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 7, isMember: false } as any);

    await createMembershipRazorpayOrder(7);

    expect((gateway.orders.create.mock.calls[0]?.[0] as any).receipt).toMatch(/^MEM-7-receipt-\d+$/);
  });
});

describe("verifyMembershipPayment", () => {
  const validSig = () => signFor("order_mem", "pay_mem");

  it("refuses when the gateway is not configured", async () => {
    gateway.configured = false;

    await expect(
      verifyMembershipPayment(7, "order_mem", "pay_mem", validSig())
    ).rejects.toThrow(/not configured/i);
  });

  it("refuses when the signing secret is missing", async () => {
    delete process.env.RAZORPAY_SECRET;

    await expect(
      verifyMembershipPayment(7, "order_mem", "pay_mem", validSig())
    ).rejects.toThrow(/secret is not set/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("does not grant membership on a forged signature", async () => {
    await expect(
      verifyMembershipPayment(7, "order_mem", "pay_mem", "0".repeat(64))
    ).rejects.toThrow(/signature verification failed/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("grants membership on a valid signature", async () => {
    mockedPrisma.user.update.mockResolvedValue({
      id: 7,
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "CUSTOMER",
      createdAt: new Date("2026-01-01"),
      phone: null,
      isMember: true,
      addresses: [],
    } as any);

    const user = await verifyMembershipPayment(7, "order_mem", "pay_mem", validSig());

    expect(mockedPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 7 }, data: { isMember: true } })
    );
    expect(user.isMember).toBe(true);
  });

  it("never returns the password hash with the upgraded profile", async () => {
    mockedPrisma.user.update.mockResolvedValue({
      id: 7,
      email: "ada@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "CUSTOMER",
      createdAt: new Date("2026-01-01"),
      phone: null,
      isMember: true,
      passwordHash: "$2b$10$secret",
      addresses: [],
    } as any);

    const user = await verifyMembershipPayment(7, "order_mem", "pay_mem", validSig());

    expect(user).not.toHaveProperty("passwordHash");
  });
});
