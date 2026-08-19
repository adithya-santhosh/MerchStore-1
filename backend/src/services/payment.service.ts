import { razorpay } from "../lib/razorpay";
import { CreateOrderInput, prepareCheckout, finalizeOrder, triggerOrderConfirmationEmail } from "./order.service";
import { PaymentStatus } from "@prisma/client";
import crypto from "crypto";

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

  if (generatedSignature !== razorpaySignature) {
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
    console.error("[PaymentService] Razorpay confirmation email trigger error:", err)
  );

  return order;
};


