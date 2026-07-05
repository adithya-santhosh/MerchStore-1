import Razorpay from "razorpay";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_SECRET;

if (!key_id || !key_secret) {
  console.warn("WARNING: RAZORPAY_KEY_ID or RAZORPAY_SECRET is missing. Razorpay integrations will be disabled.");
}

export const razorpay = key_id && key_secret
  ? new Razorpay({ key_id, key_secret })
  : null;