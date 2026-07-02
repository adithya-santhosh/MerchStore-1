import { razorpay } from "../lib/razorpay";
import { CreateOrderInput, prepareCheckout } from "./order.service";
import crypto from "crypto";


type CreateRazorpayOrderInput =  CreateOrderInput

export const createRazorpayOrder = async (input:CreateRazorpayOrderInput) => {
    const checkout = await prepareCheckout(input);

    const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(checkout.totalAmount * 100),
    currency: "INR",
    receipt: `CHK-${input.userId}-receipt-${Date.now()}`
});

return {checkout, razorpayOrder}


// return {
//     orderId: razorpayOrder.id,
//     amount: razorpayOrder.amount,
//     currency: razorpayOrder.currency,
//     key: process.env.RAZORPAY_KEY_ID,
// };
}

export const verifyRazorpayPayment = async () => {}

