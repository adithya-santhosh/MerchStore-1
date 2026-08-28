import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  placeOrderSchema,
  couponValidateSchema,
  createCouponSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../../src/middleware/validation.middleware";

describe("registerSchema", () => {
  const valid = {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "Ada@Example.com",
    password: "password123",
  };

  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = registerSchema.parse(valid);
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ ...valid, password: "short1" });
    expect(result.success).toBe(false);
  });

  it("rejects a missing required field", () => {
    const { firstName, ...rest } = valid;
    const result = registerSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("defaults isMember to false when omitted", () => {
    const result = registerSchema.parse(valid);
    expect(result.isMember).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email address", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("placeOrderSchema", () => {
  const validAddress = {
    addressLine1: "221B Baker Street",
    city: "London",
    state: "LDN",
    postalCode: "560001",
  };

  it("accepts a valid COD order", () => {
    const result = placeOrderSchema.safeParse({
      address: validAddress,
      paymentMethod: "cod",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a postal code that isn't 6 digits", () => {
    const result = placeOrderSchema.safeParse({
      address: { ...validAddress, postalCode: "123" },
      paymentMethod: "cod",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unsupported payment method", () => {
    const result = placeOrderSchema.safeParse({
      address: validAddress,
      paymentMethod: "bitcoin",
    });
    expect(result.success).toBe(false);
  });
});

describe("couponValidateSchema", () => {
  it("uppercases the coupon code", () => {
    const result = couponValidateSchema.parse({ code: "save10", orderAmount: 500 });
    expect(result.code).toBe("SAVE10");
  });

  it("rejects a non-positive order amount", () => {
    const result = couponValidateSchema.safeParse({ code: "SAVE10", orderAmount: 0 });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts a valid email and lowercases it", () => {
    const result = forgotPasswordSchema.parse({ email: "User@Example.com" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects a missing email", () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts a valid token and password", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc123", newPassword: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing token", () => {
    const result = resetPasswordSchema.safeParse({ newPassword: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = resetPasswordSchema.safeParse({ token: "abc123", newPassword: "short1" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a valid current/new password pair", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword1",
      newPassword: "newpassword1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "newpassword1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a new password shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpassword1",
      newPassword: "short1",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCouponSchema", () => {
  it("accepts a valid percent coupon", () => {
    const result = createCouponSchema.safeParse({
      code: "launch10",
      type: "percent",
      value: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid discount type", () => {
    const result = createCouponSchema.safeParse({
      code: "LAUNCH10",
      type: "buy-one-get-one",
      value: 10,
    });
    expect(result.success).toBe(false);
  });
});
