import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    user: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    cart: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    cartItem: { update: vi.fn() },
    passwordResetToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Resolved promises, not bare vi.fn() — registration attaches .catch() to these
// to fire them in the background, which would throw on an undefined return.
vi.mock("../../src/services/email.service", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendEmailVerification: vi.fn().mockResolvedValue(undefined),
}));

import prisma from "../../src/lib/prisma";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "../../src/services/email.service";
import { createEmailVerificationToken } from "../../src/lib/email-verification";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  becomeMemberUser,
  requestPasswordReset,
  resetPassword,
  changeUserPassword,
  verifyEmailToken,
  resendVerificationEmail,
} from "../../src/services/auth.service";

const mockedPrisma = vi.mocked(prisma, true);
const JWT_SECRET = process.env.JWT_SECRET!;

const userRow = (over: Record<string, any> = {}) => ({
  id: 7,
  email: "ada@example.com",
  passwordHash: bcrypt.hashSync("correct-horse", 4), // low cost keeps the suite fast
  firstName: "Ada",
  lastName: "Lovelace",
  phone: null,
  role: "CUSTOMER",
  createdAt: new Date("2026-01-01"),
  isMember: false,
  emailVerified: false,
  tokenVersion: 0,
  failedLoginAttempts: 0,
  lockedUntil: null,
  addresses: [],
  ...over,
});

const registerInput = {
  firstName: " Ada ",
  lastName: " Lovelace ",
  email: "  Ada@Example.COM ",
  password: "password123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("registerUser", () => {
  it("refuses a second account on the same email", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await expect(registerUser(registerInput)).rejects.toThrow("Email is already registered");
    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
  });

  it("normalises the email before checking for a duplicate", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await expect(registerUser(registerInput)).rejects.toThrow();

    // Without this, "Ada@Example.COM" would slip past a check on "ada@example.com".
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
    });
  });

  it("stores a bcrypt hash rather than the password itself", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(5 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser(registerInput);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.passwordHash).not.toBe("password123");
    expect(data.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare("password123", data.passwordHash)).toBe(true);
  });

  it("trims the stored name fields", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(5 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser(registerInput);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.firstName).toBe("Ada");
    expect(data.lastName).toBe("Lovelace");
  });

  it("makes the very first account an admin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(0 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow({ role: "ADMIN" }) as any);

    await registerUser(registerInput);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.role).toBe("ADMIN");
  });

  it("makes every later account a plain customer", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser(registerInput);

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.role).toBe("CUSTOMER");
  });

  it("ignores a client-supplied isMember flag, so membership cannot be self-granted", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser({ ...registerInput, isMember: true });

    const data = (mockedPrisma.user.create.mock.calls[0]?.[0] as any).data;
    expect(data.isMember).toBe(false);
  });

  it("issues a 7-day JWT carrying the account's real role", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    const { token } = await registerUser(registerInput);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.id).toBe(7);
    expect(decoded.role).toBe("CUSTOMER");
    expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60);
  });

  it("never returns the password hash to the caller", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    const { user } = await registerUser(registerInput);

    expect(user).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(user)).not.toContain("$2");
  });

  it("sends the welcome and verification emails", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser(registerInput);

    expect(sendWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com", name: "Ada Lovelace" })
    );
    expect(sendEmailVerification).toHaveBeenCalledOnce();
  });

  it("still registers the account when the welcome email fails", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);
    vi.mocked(sendWelcomeEmail).mockRejectedValueOnce(new Error("SMTP down"));

    // Mail is fire-and-forget: a broken provider must not cost a sign-up.
    await expect(registerUser(registerInput)).resolves.toHaveProperty("token");
  });

  it("puts a verification link on the frontend origin", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    mockedPrisma.user.count.mockResolvedValue(1 as any);
    mockedPrisma.user.create.mockResolvedValue(userRow() as any);

    await registerUser(registerInput);

    const arg = vi.mocked(sendEmailVerification).mock.calls[0]?.[0] as any;
    expect(arg.verifyUrl).toMatch(/\/verify-email\?token=.+/);
  });
});

describe("loginUser", () => {
  const credentials = { email: "ada@example.com", password: "correct-horse" };

  it("gives the same message for an unknown email as for a wrong password", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    const unknownEmail = await loginUser(credentials).catch((e) => e.message);

    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    const wrongPassword = await loginUser({ ...credentials, password: "nope" }).catch(
      (e) => e.message
    );

    // Differing messages would let an attacker enumerate registered addresses.
    expect(unknownEmail).toBe("Invalid email or password");
    expect(wrongPassword).toBe("Invalid email or password");
  });

  it("looks the account up by the normalised email", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await loginUser({ email: "  ADA@example.com  ", password: "correct-horse" });

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
    });
  });

  it("issues a token on a correct password", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    const { token, user } = await loginUser(credentials);

    expect(jwt.verify(token, JWT_SECRET)).toMatchObject({ id: 7, email: "ada@example.com" });
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("does not touch carts when no guest session token is supplied", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await loginUser(credentials);

    expect(mockedPrisma.cart.findFirst).not.toHaveBeenCalled();
  });

  it("claims the guest cart outright when the account has none", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce({ id: 50, items: [{ id: 1, productId: 10, quantity: 1 }] } as any)
      .mockResolvedValueOnce(null as any);

    await loginUser({ ...credentials, sessionToken: "guest-tok" });

    expect(mockedPrisma.cart.update).toHaveBeenCalledWith({
      where: { id: 50 },
      data: { userId: 7, sessionToken: null },
    });
    expect(mockedPrisma.cart.delete).not.toHaveBeenCalled();
  });

  it("combines quantities when both carts hold the same product", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce({ id: 50, items: [{ id: 1, productId: 10, quantity: 2 }] } as any)
      .mockResolvedValueOnce({ id: 60, items: [{ id: 9, productId: 10, quantity: 3 }] } as any);

    await loginUser({ ...credentials, sessionToken: "guest-tok" });

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { quantity: 5 },
    });
  });

  it("moves a product the account did not already have into the user's cart", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce({ id: 50, items: [{ id: 1, productId: 11, quantity: 2 }] } as any)
      .mockResolvedValueOnce({ id: 60, items: [{ id: 9, productId: 10, quantity: 3 }] } as any);

    await loginUser({ ...credentials, sessionToken: "guest-tok" });

    expect(mockedPrisma.cartItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { cartId: 60 },
    });
  });

  it("deletes the emptied guest cart after a merge", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.cart.findFirst
      .mockResolvedValueOnce({ id: 50, items: [] } as any)
      .mockResolvedValueOnce({ id: 60, items: [] } as any);

    await loginUser({ ...credentials, sessionToken: "guest-tok" });

    expect(mockedPrisma.cart.delete).toHaveBeenCalledWith({ where: { id: 50 } });
  });

  it("signs in normally when the guest token matches no cart", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.cart.findFirst.mockResolvedValue(null as any);

    await expect(
      loginUser({ ...credentials, sessionToken: "stale" })
    ).resolves.toHaveProperty("token");
    expect(mockedPrisma.cart.update).not.toHaveBeenCalled();
  });

  it("reports the member and verification flags the UI gates on", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(
      userRow({ isMember: true, emailVerified: true }) as any
    );

    const { user } = await loginUser(credentials);

    expect(user.isMember).toBe(true);
    expect(user.emailVerified).toBe(true);
  });

  describe("account lockout", () => {
    it("counts a wrong password without locking the account below the threshold", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(userRow({ failedLoginAttempts: 2 }) as any);

      await expect(loginUser({ ...credentials, password: "nope" })).rejects.toThrow(
        "Invalid email or password"
      );

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { failedLoginAttempts: 3, lockedUntil: null },
      });
    });

    it("locks the account on the 5th consecutive failed attempt", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(userRow({ failedLoginAttempts: 4 }) as any);

      await expect(loginUser({ ...credentials, password: "nope" })).rejects.toThrow(
        "Invalid email or password"
      );

      const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
      expect(data.failedLoginAttempts).toBe(0);
      expect(data.lockedUntil).toBeInstanceOf(Date);
      expect(data.lockedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    it("rejects a login while locked out even with the correct password", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(
        userRow({ lockedUntil: new Date(Date.now() + 10 * 60 * 1000) }) as any
      );

      await expect(loginUser(credentials)).rejects.toThrow(/too many failed login attempts/i);
      // Never even reaches a bcrypt compare / DB write for this attempt.
      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });

    it("allows login again once the lockout window has passed", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(
        userRow({ failedLoginAttempts: 0, lockedUntil: new Date(Date.now() - 1000) }) as any
      );

      await expect(loginUser(credentials)).resolves.toHaveProperty("token");
    });

    it("clears a stale lockedUntil on a successful login after the window passed", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(
        userRow({ failedLoginAttempts: 0, lockedUntil: new Date(Date.now() - 1000) }) as any
      );

      await loginUser(credentials);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    });

    it("resets the failed-attempt counter on a successful login", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(userRow({ failedLoginAttempts: 3 }) as any);

      await loginUser(credentials);

      expect(mockedPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    });

    it("does not touch the DB on a clean successful login with no prior failures", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

      await loginUser(credentials);

      expect(mockedPrisma.user.update).not.toHaveBeenCalled();
    });
  });
});

describe("getUserById", () => {
  it("returns null for an id that does not exist", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    expect(await getUserById(999)).toBeNull();
  });

  it("returns the profile with its addresses and no password hash", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(
      userRow({ addresses: [{ id: 1, city: "Bengaluru" }] }) as any
    );

    const user = await getUserById(7);

    expect(user).not.toHaveProperty("passwordHash");
    expect(user!.addresses).toHaveLength(1);
  });
});

describe("updateUserProfile", () => {
  it("trims the submitted names", async () => {
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await updateUserProfile(7, { firstName: "  Ada  ", lastName: "  Lovelace " });

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data.firstName).toBe("Ada");
    expect(data.lastName).toBe("Lovelace");
  });

  it("stores a cleared phone number as null", async () => {
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await updateUserProfile(7, { firstName: "Ada", lastName: "Lovelace", phone: "" });

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data.phone).toBeNull();
  });

  it("does not let a profile edit change the role", async () => {
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await updateUserProfile(7, {
      firstName: "Ada",
      lastName: "Lovelace",
      ...({ role: "ADMIN" } as any),
    });

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data).not.toHaveProperty("role");
  });

  it("does not let a profile edit change the email", async () => {
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await updateUserProfile(7, {
      firstName: "Ada",
      lastName: "Lovelace",
      ...({ email: "attacker@example.com" } as any),
    });

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data).not.toHaveProperty("email");
  });
});

describe("becomeMemberUser", () => {
  it("flips the membership flag and returns the refreshed profile", async () => {
    mockedPrisma.user.update.mockResolvedValue(userRow({ isMember: true }) as any);

    const user = await becomeMemberUser(7);

    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { isMember: true },
    });
    expect(user.isMember).toBe(true);
    expect(user).not.toHaveProperty("passwordHash");
  });
});

describe("requestPasswordReset", () => {
  it("gives the same answer for an unregistered address", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    const result = await requestPasswordReset("nobody@example.com");

    // Anything else would turn this endpoint into an account-existence oracle.
    expect(result.message).toMatch(/if an account with that email exists/i);
    expect(mockedPrisma.passwordResetToken.create).not.toHaveBeenCalled();
  });

  it("returns the identical message for a real account", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    const real = await requestPasswordReset("ada@example.com");
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    const fake = await requestPasswordReset("nobody@example.com");

    expect(real.message).toBe(fake.message);
  });

  it("invalidates any outstanding reset tokens first", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await requestPasswordReset("ada@example.com");

    expect(mockedPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("stores only the SHA-256 hash of the token, never the token itself", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await requestPasswordReset("ada@example.com");

    const data = (mockedPrisma.passwordResetToken.create.mock.calls[0]?.[0] as any).data;
    const resetUrl = (vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0] as any).resetUrl;
    const rawToken = new URL(resetUrl).searchParams.get("token")!;

    // A database leak must not hand the attacker working reset links.
    expect(data.tokenHash).toHaveLength(64);
    expect(data.tokenHash).not.toBe(rawToken);
  });

  it("emails a link containing a 32-byte random token", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await requestPasswordReset("ada@example.com");

    const resetUrl = (vi.mocked(sendPasswordResetEmail).mock.calls[0]?.[0] as any).resetUrl;
    const rawToken = new URL(resetUrl).searchParams.get("token")!;
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expires the token an hour out", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await requestPasswordReset("ada@example.com");

    const data = (mockedPrisma.passwordResetToken.create.mock.calls[0]?.[0] as any).data;
    const minutes = (data.expiresAt.getTime() - Date.now()) / 60_000;
    expect(minutes).toBeGreaterThan(59);
    expect(minutes).toBeLessThanOrEqual(60);
  });

  it("normalises the email before looking the account up", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    await requestPasswordReset("  ADA@Example.com ");

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "ada@example.com" },
    });
  });
});

describe("resetPassword", () => {
  const tokenRow = (over: Record<string, any> = {}) => ({
    id: 1,
    userId: 7,
    usedAt: null,
    expiresAt: new Date(Date.now() + 600_000),
    user: userRow(),
    ...over,
  });

  it("rejects a new password shorter than 8 characters", async () => {
    await expect(resetPassword("token", "short")).rejects.toThrow(/at least 8 characters/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects an empty token without hitting the database", async () => {
    await expect(resetPassword("", "password123")).rejects.toThrow(/invalid request/i);
    expect(mockedPrisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("looks the token up by its hash, not its plaintext", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(tokenRow() as any);

    await resetPassword("abc123", "password123");

    const where = (mockedPrisma.passwordResetToken.findUnique.mock.calls[0]?.[0] as any).where;
    expect(where.tokenHash).toHaveLength(64);
    expect(where.tokenHash).not.toBe("abc123");
  });

  it("rejects a token that does not match anything", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(null as any);

    await expect(resetPassword("bogus", "password123")).rejects.toThrow(/invalid or expired/i);
  });

  it("refuses to reuse a link that has already been redeemed", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(
      tokenRow({ usedAt: new Date() }) as any
    );

    await expect(resetPassword("abc123", "password123")).rejects.toThrow(/already been used/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("refuses an expired link", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(
      tokenRow({ expiresAt: new Date(Date.now() - 1000) }) as any
    );

    await expect(resetPassword("abc123", "password123")).rejects.toThrow(/has expired/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("writes a hash of the new password", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(tokenRow() as any);

    await resetPassword("abc123", "brand-new-password");

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(await bcrypt.compare("brand-new-password", data.passwordHash)).toBe(true);
  });

  it("burns the token so the same link cannot be replayed", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(tokenRow() as any);

    await resetPassword("abc123", "brand-new-password");

    expect(mockedPrisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { usedAt: expect.any(Date) },
    });
  });

  it("bumps tokenVersion so sessions on other devices are invalidated", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(tokenRow() as any);

    await resetPassword("abc123", "brand-new-password");

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data.tokenVersion).toEqual({ increment: 1 });
  });

  it("clears any account lockout, since proving ownership by email supersedes it", async () => {
    mockedPrisma.passwordResetToken.findUnique.mockResolvedValue(
      tokenRow({ user: userRow({ failedLoginAttempts: 5, lockedUntil: new Date(Date.now() + 60_000) }) }) as any
    );

    await resetPassword("abc123", "brand-new-password");

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data.failedLoginAttempts).toBe(0);
    expect(data.lockedUntil).toBeNull();
  });
});

describe("changeUserPassword", () => {
  it("rejects a new password shorter than 8 characters", async () => {
    await expect(changeUserPassword(7, "correct-horse", "short")).rejects.toThrow(
      /at least 8 characters/i
    );
    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("reports a missing account rather than throwing something opaque", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    await expect(changeUserPassword(999, "correct-horse", "password123")).rejects.toThrow(
      "User not found"
    );
  });

  it("requires the current password to be correct", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await expect(changeUserPassword(7, "wrong-one", "password123")).rejects.toThrow(
      /current password is incorrect/i
    );
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("stores the new password hashed once the current one checks out", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await changeUserPassword(7, "correct-horse", "a-longer-password");

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(await bcrypt.compare("a-longer-password", data.passwordHash)).toBe(true);
    expect(Object.keys(data)).toEqual(["passwordHash", "tokenVersion"]);
  });

  it("bumps tokenVersion so sessions on other devices are invalidated", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.user.update.mockResolvedValue(userRow() as any);

    await changeUserPassword(7, "correct-horse", "a-longer-password");

    const data = (mockedPrisma.user.update.mock.calls[0]?.[0] as any).data;
    expect(data.tokenVersion).toEqual({ increment: 1 });
  });

  it("returns a fresh token carrying the bumped tokenVersion, so the current session survives", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.user.update.mockResolvedValue(userRow({ tokenVersion: 1 }) as any);

    const result = await changeUserPassword(7, "correct-horse", "a-longer-password");

    expect(result.token).toBeTruthy();
    const decoded = jwt.verify(result.token!, JWT_SECRET) as any;
    expect(decoded).toMatchObject({ id: 7, tokenVersion: 1 });
  });
});

describe("verifyEmailToken", () => {
  it("rejects a token that isn't a valid verification token", async () => {
    await expect(verifyEmailToken("not-a-token")).rejects.toThrow(/invalid or has expired/i);
  });

  it("rejects a session JWT replayed as a verification link", async () => {
    const sessionToken = jwt.sign({ id: 7, email: "ada@example.com" }, JWT_SECRET);

    await expect(verifyEmailToken(sessionToken)).rejects.toThrow(/invalid or has expired/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("rejects a token whose user no longer exists", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);
    const token = createEmailVerificationToken(7, "ada@example.com");

    await expect(verifyEmailToken(token)).rejects.toThrow(/invalid or has expired/i);
  });

  it("refuses a link issued for an address the account no longer uses", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(
      userRow({ email: "new-address@example.com" }) as any
    );
    const token = createEmailVerificationToken(7, "ada@example.com");

    await expect(verifyEmailToken(token)).rejects.toThrow(/different email address/i);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("is idempotent for an address that is already confirmed", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow({ emailVerified: true }) as any);
    const token = createEmailVerificationToken(7, "ada@example.com");

    const result = await verifyEmailToken(token);

    expect(result.alreadyVerified).toBe(true);
    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it("marks the address confirmed on a valid first click", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    mockedPrisma.user.update.mockResolvedValue(userRow({ emailVerified: true }) as any);
    const token = createEmailVerificationToken(7, "ada@example.com");

    const result = await verifyEmailToken(token);

    expect(result.alreadyVerified).toBe(false);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { emailVerified: true },
    });
  });
});

describe("resendVerificationEmail", () => {
  it("reports a missing account", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null as any);

    await expect(resendVerificationEmail(999)).rejects.toThrow("User not found");
  });

  it("sends nothing when the address is already confirmed", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow({ emailVerified: true }) as any);

    const result = await resendVerificationEmail(7);

    expect(result.message).toMatch(/already confirmed/i);
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });

  it("sends a fresh link to an unconfirmed address", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);

    await resendVerificationEmail(7);

    expect(sendEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({ to: "ada@example.com" })
    );
  });

  it("surfaces a mail failure here, unlike during registration", async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(userRow() as any);
    vi.mocked(sendEmailVerification).mockRejectedValueOnce(new Error("SMTP down"));

    // The user explicitly asked for this one, so a silent failure would leave
    // them waiting for a mail that never comes.
    await expect(resendVerificationEmail(7)).rejects.toThrow("SMTP down");
  });
});
