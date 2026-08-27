/**
 * Razorpay Checkout is loaded at runtime from checkout.razorpay.com, so it has
 * no bundled types. These declarations cover the surface this app actually
 * uses — enough to drop the `(window as any).Razorpay` casts and to get real
 * checking on the success/failure payloads.
 *
 * Reference: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/
 */

/** Payload passed to the `handler` callback after a successful payment. */
export interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** Payload passed to the "payment.failed" event listener. */
export interface RazorpayFailureResponse {
  error: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

export interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: RazorpayFailureResponse) => void): void;
  close(): void;
}

export type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    /** Present only after the Checkout script has finished loading. */
    Razorpay?: RazorpayConstructor;
  }
}
