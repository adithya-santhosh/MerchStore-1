import logger from "../lib/logger";
import { razorpay } from "../lib/razorpay";
import prisma from "../lib/prisma";
import { getSettings } from "./settings.service";
import { CreateOrderInput, prepareCheckout, finalizeOrder, triggerOrderConfirmationEmail } from "./order.service";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";

// Constant-time hex-string comparison — prevents leaking signature bytes via
// response-time differences (crypto.timingSafeEqual requires equal-length
// buffers, so a length mismatch is treated as "not equal" up front).
export const timingSafeEqualHex = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

type CreateRazorpayOrderInput = CreateOrderInput;

export interface VerifyRazorpayPaymentInput extends CreateOrderInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createRazorpayOrder = async (input: CreateRazorpayOrderInput) => {
  if (!razorpay) {
    throw new Error("Razorpay payment gateway is not configured on this server.");
  }
  const checkout = await prepareCheckout(input);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(checkout.totalAmount * 100),
    currency: "INR",
    receipt: `CHK-${input.userId}-receipt-${Date.now()}`
  });

  return {
    key: process.env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: razorpayOrder.receipt
  };
};

export const verifyRazorpayPayment = async (input: VerifyRazorpayPaymentInput) => {
  if (!razorpay) {
    throw new Error("Razorpay payment gateway is not configured on this server.");
  }
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    ...createOrderInput
  } = input;

  // Verify the signature — guard explicitly so we never sign with "undefined"
  const razorpaySecret = process.env.RAZORPAY_SECRET;
  if (!razorpaySecret) {
    throw new Error("Server configuration error: Razorpay secret is not set. Cannot verify payment.");
  }
  const hmac = crypto.createHmac("sha256", razorpaySecret);
  hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
  const generatedSignature = hmac.digest("hex");

  if (!timingSafeEqualHex(generatedSignature, razorpaySignature)) {
    throw new Error("Payment signature verification failed. The transaction might be invalid.");
  }

  // Prepare checkout and finalize order
  const checkout = await prepareCheckout(createOrderInput);

  const order = await finalizeOrder(checkout, createOrderInput, {
    status: PaymentStatus.PAID,
    gatewayOrderId: razorpayOrderId,
    gatewayPaymentId: razorpayPaymentId,
    gatewaySignature: razorpaySignature
  });

  // Idempotently trigger order confirmation email asynchronously
  triggerOrderConfirmationEmail(order.id).catch((err) =>
    logger.error({ err: err }, "[PaymentService] Razorpay confirmation email trigger error")
  );

  return order;
};

export const createMembershipRazorpayOrder = async (userId: number) => {
  if (!razorpay) {
    throw new Error("Razorpay payment gateway is not configured on this server.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (user.isMember) throw new Error("You are already a premium member.");

  const settings = await getSettings();
  const feeAmount = settings.membership_fee || 999;

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(feeAmount * 100),
    currency: "INR",
    receipt: `MEM-${userId}-receipt-${Date.now()}`
  });

  return {
    key: process.env.RAZORPAY_KEY_ID,
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: razorpayOrder.receipt,
    membershipFee: feeAmount
  };
};

export const verifyMembershipPayment = async (
  userId: number,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) => {
  if (!razorpay) {
    throw new Error("Razorpay payment gateway is not configured on this server.");
  }

  const razorpaySecret = process.env.RAZORPAY_SECRET;
  if (!razorpaySecret) {
    throw new Error("Server configuration error: Razorpay secret is not set.");
  }

  const hmac = crypto.createHmac("sha256", razorpaySecret);
  hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
  const generatedSignature = hmac.digest("hex");

  if (!timingSafeEqualHex(generatedSignature, razorpaySignature)) {
    throw new Error("Payment signature verification failed.");
  }

  // Activate membership on user record
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isMember: true },
    include: { addresses: true }
  });

  return {
    id: updatedUser.id,
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    role: updatedUser.role,
    createdAt: updatedUser.createdAt,
    phone: updatedUser.phone,
    isMember: updatedUser.isMember,
    addresses: updatedUser.addresses
  };
};



