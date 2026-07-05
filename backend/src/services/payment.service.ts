import { razorpay } from "../lib/razorpay";
import { CreateOrderInput, prepareCheckout, finalizeOrder } from "./order.service";
import { PaymentStatus } from "../generated/prisma/client";
import crypto from "crypto";

type CreateRazorpayOrderInput = CreateOrderInput;

export interface VerifyRazorpayPaymentInput extends CreateOrderInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const createRazorpayOrder = async (input: CreateRazorpayOrderInput) => {
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
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    ...createOrderInput
  } = input;

  // Verify the signature
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET!);
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

  return order;
};

