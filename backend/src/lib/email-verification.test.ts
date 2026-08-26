import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import {
  createEmailVerificationToken,
  readEmailVerificationToken,
} from "./email-verification";

const JWT_SECRET = process.env.JWT_SECRET!;

describe("email verification tokens", () => {
  it("round-trips the user id and email", () => {
    const token = createEmailVerificationToken(42, "buyer@example.com");
    expect(readEmailVerificationToken(token)).toEqual({
      userId: 42,
      email: "buyer@example.com",
    });
  });

  it("rejects a tampered token", () => {
    const token = createEmailVerificationToken(42, "buyer@example.com");
    expect(readEmailVerificationToken(`${token}x`)).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign(
      { userId: 1, email: "a@b.com", purpose: "email-verification" },
      "some-other-secret"
    );
    expect(readEmailVerificationToken(forged)).toBeNull();
  });

  it("rejects a session JWT replayed as a verification token", () => {
    // Session tokens are signed with the same secret, so the purpose claim is
    // what stops one being swapped in to self-verify an arbitrary account.
    const sessionToken = jwt.sign(
      { id: 42, email: "buyer@example.com", role: "CUSTOMER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    expect(readEmailVerificationToken(sessionToken)).toBeNull();
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign(
      { userId: 42, email: "buyer@example.com", purpose: "email-verification" },
      JWT_SECRET,
      { expiresIn: -10 }
    );
    expect(readEmailVerificationToken(expired)).toBeNull();
  });

  it("rejects a token whose claims are the wrong shape", () => {
    const malformed = jwt.sign(
      { userId: "not-a-number", email: "a@b.com", purpose: "email-verification" },
      JWT_SECRET
    );
    expect(readEmailVerificationToken(malformed)).toBeNull();
  });
});
