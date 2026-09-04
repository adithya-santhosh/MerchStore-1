"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { createOrder, createPaymentOrder, verifyPayment } from "@/lib/api";
import { getProductImageSrc } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/errors";
import type { RazorpaySuccessResponse, RazorpayFailureResponse } from "@/types/razorpay";
import {
  MapPin,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Truck,
  Shield,
  Banknote,
  Sparkles,
  AlertCircle,
  Tag,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddressForm {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const STEPS = [
  { id: 1, label: "Address", icon: MapPin },
  { id: 2, label: "Review", icon: ShoppingBag },
  { id: 3, label: "Payment", icon: CreditCard },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const done = current > step.id;
        const active = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${done ? "bg-primary border-primary text-primary-foreground" : ""}
                  ${active ? "bg-primary/10 border-primary text-primary-bright shadow-lg shadow-primary/20" : ""}
                  ${!done && !active ? "bg-muted/30 border-border text-muted-foreground" : ""}
                `}
              >
                {done ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Icon className="size-4.5" />
                )}
              </div>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  active ? "text-primary-bright" : done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-0.5 mb-4 mx-2 transition-all duration-500 ${
                  current > step.id ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Input Field ──────────────────────────────────────────────────────────────

function Field({
  label,
  id,
  required,
  children,
  error,
}: {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {label}
        {required && <span className="text-primary-bright ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[10px] text-destructive font-semibold flex items-center gap-1">
          <AlertCircle className="size-3" /> {error}
        </p>
      )}
    </div>
  );
}

// The address form collects one "full name" field regardless of guest/signed-in
// status; guest checkout needs it split for the account it creates behind the
// scenes. First word is the first name, everything else the last — falls back
// to repeating the first name for a single-word entry rather than leaving the
// last name empty.
function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

const inputClass =
  "w-full px-4 py-3 text-sm font-medium bg-muted/20 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all";

const selectClass =
  "w-full px-4 py-3 text-sm font-medium bg-muted/20 border border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all appearance-none cursor-pointer";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { cart, subtotal, settings, loading: cartLoading, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Partial<AddressForm>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("cod");
  const [couponCode, setCouponCode] = useState("");
  const [couponDetails, setCouponDetails] = useState<{ code: string; type: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Pre-fill name, email and phone from user profile. Checkout no longer
  // requires signing in — a shopper who isn't logged in fills the (now
  // editable) email field themselves and checks out as a guest.
  useEffect(() => {
    if (user) {
      setAddress((prev) => ({
        ...prev,
        fullName: prev.fullName || `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: prev.phone || user.phone || "",
      }));
    }
  }, [user]);

  // ── Calculations ─────────────────────────────────────────────────────────

  const shippingThreshold = settings.shipping_limit;
  const shippingCost = subtotal >= shippingThreshold || subtotal === 0 ? 0 : settings.shipping_cost;
  const taxRate = settings.tax_rate;
  const taxAmount = subtotal * taxRate;

  let discount = 0;
  if (couponDetails) {
    discount =
      couponDetails.type === "percent"
        ? subtotal * (couponDetails.value / 100)
        : couponDetails.value;
  }

  const finalTotal = Math.max(0, subtotal + shippingCost + taxAmount - discount);

  // ── Coupon ────────────────────────────────────────────────────────────────

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, orderAmount: subtotal }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err, "Invalid coupon"));
      }
      const data = await res.json();
      setCouponDetails(data);
    } catch (e) {
      setCouponError(getErrorMessage(e, "Invalid coupon code"));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponDetails(null);
    setCouponCode("");
    setCouponError("");
  };

  // ── Address Validation ────────────────────────────────────────────────────

  const validateAddress = useCallback((): boolean => {
    const errors: Partial<AddressForm> = {};
    if (!address.fullName.trim()) errors.fullName = "Full name is required";
    if (!address.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim()))
      errors.email = "Enter a valid email address";
    if (!address.phone.trim()) errors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(address.phone.replace(/\s/g, "")))
      errors.phone = "Enter a valid 10-digit Indian mobile number";
    if (!address.addressLine1.trim()) errors.addressLine1 = "Address line 1 is required";
    if (!address.city.trim()) errors.city = "City is required";
    if (!address.state.trim()) errors.state = "State is required";
    if (!address.postalCode.trim()) errors.postalCode = "Postal code is required";
    else if (!/^\d{6}$/.test(address.postalCode.trim()))
      errors.postalCode = "Enter a valid 6-digit PIN code";
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  }, [address]);

  const handleNextFromStep1 = () => {
    if (validateAddress()) setStep(2);
  };

  // ── Place Order ───────────────────────────────────────────────────────────

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const sessionToken =
        typeof window !== "undefined" ? localStorage.getItem("sessionToken") || undefined : undefined;

      const addressPayload = {
        label: "Shipping",
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || undefined,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: "IN",
      };

      // Only sent (and only needed) when checking out without an account —
      // an authenticated request is already tied to the signed-in user.
      const guestPayload = isAuthenticated
        ? undefined
        : { email: address.email, ...splitFullName(address.fullName), phone: address.phone };

      if (paymentMethod === "razorpay") {
        // 1. Load Razorpay script
        const isScriptLoaded = await new Promise<boolean>((resolve) => {
          if (typeof window === "undefined") {
            resolve(false);
            return;
          }
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!isScriptLoaded) {
          throw new Error("Failed to load Razorpay payment SDK. Please check your connection.");
        }

        // 2. Create payment order in backend
        const orderData = await createPaymentOrder({
          address: addressPayload,
          couponCode: couponDetails?.code,
          sessionToken,
          guest: guestPayload,
        });

        // 3. Open Razorpay checkout
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "MerchStore",
          description: "Purchase Payment",
          order_id: orderData.orderId,
          handler: async function (response: RazorpaySuccessResponse) {
            console.log("Razorpay payment success response:", response);
            try {
              setSubmitting(true);
              const order = await verifyPayment({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                address: addressPayload,
                couponCode: couponDetails?.code,
                sessionToken,
                guest: guestPayload,
              });

              clearCart();
              router.push(`/checkout/confirmation?orderId=${order.id}`);
            } catch (err) {
              console.error("Payment verification failed:", err);
              setSubmitError(getErrorMessage(err, "Payment verification failed. Please contact support."));
            } finally {
              setSubmitting(false);
            }
          },
          prefill: {
            name: address.fullName,
            contact: address.phone,
            email: user?.email || address.email,
          },
          theme: {
            color: "#000000",
          },
        };

        const rzp = new window.Razorpay!(options);
        rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
          console.error("Razorpay payment failed:", response.error);
          setSubmitError(response.error.description || "Payment failed. Please try again.");
        });
        rzp.open();
      } else {
        // COD path
        const order = await createOrder({
          address: addressPayload,
          couponCode: couponDetails?.code,
          paymentMethod: "cod",
          sessionToken,
          guest: guestPayload,
        });

        clearCart();
        router.push(`/checkout/confirmation?orderId=${order.id}`);
      }
    } catch (e) {
      setSubmitError(getErrorMessage(e, "Failed to place order. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Guard ───────────────────────────────────────────────────────

  if (authLoading || cartLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading checkout...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="max-w-md mx-auto text-center py-16 px-6 border border-border/80 rounded-3xl bg-card/25">
            <ShoppingBag className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Nothing to Checkout</h2>
            <p className="text-xs text-muted-foreground mb-6">Your cart is empty. Add some products first.</p>
            <Button asChild className="text-xs font-semibold px-6 rounded-xl">
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative">
        {/* Ambient glows */}
        <div className="absolute top-10 left-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl opacity-40" />
        <div className="absolute bottom-10 right-1/4 -z-10 size-80 rounded-full bg-primary/3 blur-3xl opacity-30" />

        {/* Page Header */}
        <div className="space-y-2 mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs font-semibold tracking-wide text-primary-bright uppercase">
            <Shield className="size-3.5" />
            Secure Checkout
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Complete Your Order</h1>
          <p className="text-xs text-muted-foreground">
            Encrypted with RSA-256 · Trusted by thousands of customers
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* ── Left Panel: Step Content ──────────────────────────────────── */}
          <div className="lg:col-span-7">

            {/* ─── STEP 1: SHIPPING ADDRESS ──────────────────────────── */}
            {step === 1 && (
              <div className="rounded-[2rem] border border-border bg-card/30 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="size-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Shipping Address</h2>
                    <p className="text-xs text-muted-foreground">Where should we deliver your order?</p>
                  </div>
                </div>

                {user?.addresses && user.addresses.length > 0 && (
                  <div className="space-y-2 p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-inner">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary animate-pulse" />
                      <span className="text-xs font-bold text-primary-bright uppercase tracking-wider">
                        Quick Fill Saved Address
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const selected = user.addresses?.find((a) => String(a.id) === val);
                            if (selected) {
                              setAddress({
                                fullName: `${user.firstName} ${user.lastName}`.trim(),
                                email: user.email,
                                phone: user.phone || address.phone || "",
                                addressLine1: selected.addressLine1,
                                addressLine2: selected.addressLine2 || "",
                                city: selected.city,
                                state: selected.state,
                                postalCode: selected.postalCode,
                              });
                            }
                          } else {
                            setAddress({
                              fullName: `${user.firstName} ${user.lastName}`.trim(),
                              email: user.email,
                              phone: user.phone || "",
                              addressLine1: "",
                              addressLine2: "",
                              city: "",
                              state: "",
                              postalCode: "",
                            });
                          }
                        }}
                        className={`${selectClass} border-primary/30 pr-10`}
                      >
                        <option value="">-- Enter a new address --</option>
                        {user.addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label ? `[${a.label}] ` : ""}{a.addressLine1}, {a.city}, {a.state} - {a.postalCode}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                        <ChevronDown className="size-4" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Selecting an address will autofill the form below. You can still modify any field.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Full Name" id="fullName" required error={addressErrors.fullName}>
                      <input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={address.fullName}
                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Email" id="email" required error={addressErrors.email}>
                      <input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={address.email}
                        disabled={isAuthenticated}
                        onChange={(e) => setAddress({ ...address, email: e.target.value })}
                        className={`${inputClass} ${isAuthenticated ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                    </Field>
                    {!isAuthenticated && (
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        We&apos;ll send your order confirmation here.{" "}
                        <Link href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`} className="text-primary-bright font-semibold hover:underline">
                          Log in
                        </Link>{" "}
                        if you have an account.
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Phone Number" id="phone" required error={addressErrors.phone}>
                      <input
                        id="phone"
                        type="tel"
                        placeholder="9876543210"
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" id="addressLine1" required error={addressErrors.addressLine1}>
                      <input
                        id="addressLine1"
                        type="text"
                        placeholder="Flat / House No., Street, Area"
                        value={address.addressLine1}
                        onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Address Line 2" id="addressLine2">
                      <input
                        id="addressLine2"
                        type="text"
                        placeholder="Landmark, Colony (optional)"
                        value={address.addressLine2}
                        onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="City" id="city" required error={addressErrors.city}>
                    <input
                      id="city"
                      type="text"
                      placeholder="Mumbai"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="PIN Code" id="postalCode" required error={addressErrors.postalCode}>
                    <input
                      id="postalCode"
                      type="text"
                      placeholder="400001"
                      maxLength={6}
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value.replace(/\D/g, "") })}
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="State" id="state" required error={addressErrors.state}>
                      <select
                        id="state"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        className={selectClass}
                      >
                        <option value="">Select State / UT</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                <Button
                  id="step1-next"
                  onClick={handleNextFromStep1}
                  className="w-full py-6 text-sm font-bold rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
                >
                  Continue to Review
                  <ChevronRight className="size-4.5 ml-1" />
                </Button>
              </div>
            )}

            {/* ─── STEP 2: REVIEW ORDER ──────────────────────────────── */}
            {step === 2 && (
              <div className="rounded-[2rem] border border-border bg-card/30 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="size-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Review Your Order</h2>
                    <p className="text-xs text-muted-foreground">Confirm items and apply any discounts</p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => {
                    const imgSrc = getProductImageSrc(item.product.ImageURL);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-muted/10"
                      >
                        <div className="size-14 rounded-xl border border-border/40 bg-muted/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {imgSrc ? (
                            <img src={imgSrc} alt={item.product.name} className="w-full h-full object-contain" />
                          ) : (
                            <Sparkles className="size-5 text-primary/30" />
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-semibold text-primary-bright uppercase tracking-wider">{item.product.category}</p>
                          <p className="text-sm font-bold text-foreground truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.unitPrice.toLocaleString("en-IN")}</p>
                        </div>
                        <span className="text-sm font-black text-foreground shrink-0">
                          ₹{(item.quantity * item.unitPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Promo Code</label>
                  {couponDetails ? (
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                      <div className="flex items-center gap-2">
                        <Tag className="size-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-500">{couponDetails.code} applied!</span>
                        <span className="text-xs text-emerald-400">
                          {couponDetails.type === "percent" ? `${couponDetails.value}% off` : `₹${couponDetails.value} off`}
                        </span>
                      </div>
                      <button onClick={removeCoupon} className="text-[10px] text-muted-foreground hover:text-destructive font-semibold cursor-pointer transition-colors">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <input
                          id="coupon-input"
                          type="text"
                          placeholder="e.g., WELCOME10"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      <Button
                        id="apply-coupon"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        variant="outline"
                        className="px-4 text-xs font-bold shrink-0 rounded-xl h-[46px] cursor-pointer"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </Button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                      <AlertCircle className="size-3" /> {couponError}
                    </p>
                  )}
                </div>

                {/* Delivery address preview */}
                <div className="p-4 rounded-2xl border border-border/60 bg-muted/10 space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="size-3.5" /> Delivering to
                  </p>
                  <p className="text-sm font-bold text-foreground">{address.fullName}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {address.addressLine1}
                    {address.addressLine2 && `, ${address.addressLine2}`},{" "}
                    {address.city}, {address.state} – {address.postalCode}
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="text-[10px] text-primary-bright font-semibold hover:underline cursor-pointer mt-0.5"
                  >
                    Change address
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button
                    id="step2-back"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 py-6 text-sm font-bold rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="size-4.5 mr-1" />
                    Back
                  </Button>
                  <Button
                    id="step2-next"
                    onClick={() => setStep(3)}
                    className="flex-[2] py-6 text-sm font-bold rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    Choose Payment
                    <ChevronRight className="size-4.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ─── STEP 3: PAYMENT ───────────────────────────────────── */}
            {step === 3 && (
              <div className="rounded-[2rem] border border-border bg-card/30 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="size-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Select Payment Method</h2>
                    <p className="text-xs text-muted-foreground">All transactions are 100% secure</p>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  {/* COD */}
                  <label
                    htmlFor="pay-cod"
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                      ${paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-muted/10 hover:border-primary/40"}`}
                  >
                    <input
                      id="pay-cod"
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={() => setPaymentMethod("cod")}
                      className="hidden"
                    />
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "cod" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "cod" && <div className="size-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Banknote className="size-5 text-amber-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-foreground">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when your order arrives at your door</p>
                    </div>
                    {paymentMethod === "cod" && (
                      <CheckCircle2 className="size-5 text-primary shrink-0" />
                    )}
                  </label>

                  {/* Razorpay */}
                  <label
                    htmlFor="pay-razorpay"
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                      ${paymentMethod === "razorpay" ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-muted/10 hover:border-primary/40"}`}
                  >
                    <input
                      id="pay-razorpay"
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === "razorpay"}
                      onChange={() => setPaymentMethod("razorpay")}
                      className="hidden"
                    />
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "razorpay" ? "border-primary" : "border-muted-foreground"}`}>
                      {paymentMethod === "razorpay" && <div className="size-2.5 rounded-full bg-primary" />}
                    </div>
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <CreditCard className="size-5 text-blue-500" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm font-bold text-foreground">Pay Online</p>
                      <p className="text-xs text-muted-foreground">Cards, UPI, Net Banking via Razorpay</p>
                    </div>
                    {paymentMethod === "razorpay" && (
                      <CheckCircle2 className="size-5 text-primary shrink-0" />
                    )}
                  </label>
                </div>

                {/* Error */}
                {submitError && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-destructive/30 bg-destructive/5">
                    <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive font-semibold">{submitError}</p>
                  </div>
                )}

                {/* Total preview */}
                <div className="flex items-baseline justify-between border-t border-border/60 pt-4">
                  <span className="text-sm font-bold text-foreground">Order Total</span>
                  <span className="text-2xl font-black text-primary">
                    ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button
                    id="step3-back"
                    variant="outline"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className="flex-1 py-6 text-sm font-bold rounded-xl cursor-pointer"
                  >
                    <ChevronLeft className="size-4.5 mr-1" />
                    Back
                  </Button>
                  <Button
                    id="place-order"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                    className="flex-[2] py-6 text-sm font-bold rounded-xl shadow-lg shadow-primary/10 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <Shield className="size-4.5 mr-1.5" />
                        Place Order · ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right Panel: Sticky Order Summary ──────────────────────────── */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[2rem] border border-border bg-card/30 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-foreground">Order Summary</h3>

              {/* Item count */}
              <p className="text-xs text-muted-foreground">
                {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} in your cart
              </p>

              {/* Line Items */}
              <div className="space-y-2.5 border-b border-border/60 pb-4 text-xs">
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Subtotal</span>
                  <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-muted-foreground font-semibold">
                  <span>Shipping</span>
                  {shippingCost === 0 ? (
                    <span className="text-emerald-500 font-bold uppercase">Free</span>
                  ) : (
                    <span className="text-foreground">₹{shippingCost}</span>
                  )}
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground font-semibold">
                    <span>GST ({(taxRate * 100).toFixed(0)}%)</span>
                    <span className="text-foreground">₹{Math.round(taxAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {couponDetails && (
                  <div className="flex justify-between text-emerald-500 font-bold animate-in fade-in">
                    <span>Discount ({couponDetails.code})</span>
                    <span>
                      −₹{Math.round(discount).toLocaleString("en-IN")}
                      {couponDetails.type === "percent" && ` (${couponDetails.value}%)`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-2xl font-black text-primary">
                  ₹{Math.round(finalTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Trust badge */}
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 flex items-center gap-3.5">
              <Shield className="size-8 text-emerald-500 shrink-0" />
              <div className="text-[11px] leading-normal text-muted-foreground">
                <span className="font-bold text-foreground block mb-0.5">Secure & Encrypted</span>
                RSA-256 encryption · Trusted payment processing · Easy returns
              </div>
            </div>

            {/* Free shipping progress */}
            {subtotal < shippingThreshold && (
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Add <span className="text-primary-bright font-black">₹{(shippingThreshold - subtotal).toLocaleString("en-IN")}</span> more for free shipping
                </p>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
