import Razorpay from "razorpay";

export const razorpay = new Razorpay({
    key_id : process.env.RAZORPAY_KEY_ID!,
    key_secret : process.env.RAZORPAY_SECRET!
});

if(!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET){
    throw new Error("MISSING RAZORPAY KEYS")
}