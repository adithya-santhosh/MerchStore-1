import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/auth.service", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
  getUserById: vi.fn(),
  updateUserProfile: vi.fn(),
  becomeMemberUser: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  changeUserPassword: vi.fn(),
  verifyEmailToken: vi.fn(),
  resendVerificationEmail: vi.fn(),
}));

import app from "../../src/app";
import * as authService from "../../src/services/auth.service";

const svc = vi.mocked(authService);
const JWT_SECRET = process.env.JWT_SECRET!;

/**
 * /api/auth is rate limited to 20 requests per IP per 15 minutes, so every test
 * speaks from its own forwarded client address rather than sharing one budget.
 */
let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `10.${Math.floor(ipCounter / 254)}.${ipCounter % 254}.1`;
};

const post = (path: string) =>
  request(app).post(path).set("X-Forwarded-For", nextIp());
const get = (path: string) => request(app).get(path).set("X-Forwarded-For", nextIp());
const put = (path: string) => request(app).put(path).set("X-Forwarded-For", nextIp());

const tokenFor = (over: Record<string, any> = {}) =>
  jwt.sign(
    { id: 7, email: "ada@example.com", role: "CUSTOMER", firstName: "Ada", lastName: "L", ...over },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

const sessionUser = {
  id: 7,
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  role: "CUSTOMER",
  createdAt: new Date("2026-01-01"),
  isMember: false,
  emailVerified: false,
};

const validRegistration = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "password123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("rejects a short password with 422 before reaching the service", async () => {
    const res = await post("/api/auth/register").send({ ...validRegistration, password: "short" });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe("password");
    expect(svc.registerUser).not.toHaveBeenCalled();
  });

  it("rejects a malformed email with 422", async () => {
    const res = await post("/api/auth/register").send({ ...validRegistration, email: "nope" });

    expect(res.status).toBe(422);
    expect(res.body.message).toBe("Validation failed");
  });

  it("names every failing field, not just the first", async () => {
    const res = await post("/api/auth/register").send({ email: "nope", password: "x" });

    const fields = res.body.errors.map((e: any) => e.field);
    expect(fields).toEqual(expect.arrayContaining(["firstName", "lastName", "email", "password"]));
  });

  it("creates the account and returns 201", async () => {
    svc.registerUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    const res = await post("/api/auth/register").send(validRegistration);

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
  });

  it("sets the session cookie as HttpOnly so script cannot read it", async () => {
    svc.registerUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    const res = await post("/api/auth/register").send(validRegistration);
    const cookie = res.headers["set-cookie"]![0]!;

    expect(cookie).toMatch(/^token=jwt-token/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\//);
  });

  it("answers 400, not 500, when the email is already registered", async () => {
    svc.registerUser.mockRejectedValue(new Error("Email is already registered"));

    const res = await post("/api/auth/register").send(validRegistration);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email is already registered");
  });

  it("strips unknown fields, so a role cannot be self-assigned at sign-up", async () => {
    svc.registerUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    await post("/api/auth/register").send({ ...validRegistration, role: "ADMIN" });

    expect(svc.registerUser).toHaveBeenCalledWith(expect.not.objectContaining({ role: "ADMIN" }));
  });
});

describe("POST /api/auth/login", () => {
  it("rejects an empty payload with 422", async () => {
    const res = await post("/api/auth/login").send({});

    expect(res.status).toBe(422);
    expect(svc.loginUser).not.toHaveBeenCalled();
  });

  it("answers 401 on bad credentials", async () => {
    svc.loginUser.mockRejectedValue(new Error("Invalid email or password"));

    const res = await post("/api/auth/login").send({ email: "a@b.com", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });

  it("returns the profile and sets the cookie on success", async () => {
    svc.loginUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    const res = await post("/api/auth/login").send({
      email: "ada@example.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]![0]).toMatch(/HttpOnly/i);
  });

  it("never echoes the password back", async () => {
    svc.loginUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    const res = await post("/api/auth/login").send({
      email: "ada@example.com",
      password: "hunter2",
    });

    expect(JSON.stringify(res.body)).not.toContain("hunter2");
  });

  it("passes a guest session token through so the basket can be merged", async () => {
    svc.loginUser.mockResolvedValue({ user: sessionUser, token: "jwt-token" } as any);

    await post("/api/auth/login").send({
      email: "ada@example.com",
      password: "password123",
      sessionToken: "guest-tok",
    });

    expect(svc.loginUser).toHaveBeenCalledWith(
      expect.objectContaining({ sessionToken: "guest-tok" })
    );
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await post("/api/auth/logout").send({});

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]![0]).toMatch(/^token=;/);
  });

  it("succeeds even when nobody is signed in", async () => {
    const res = await post("/api/auth/logout").send({});

    expect(res.status).toBe(200);
  });
});

describe("GET /api/auth/me", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await get("/api/auth/me");

    expect(res.status).toBe(401);
    expect(svc.getUserById).not.toHaveBeenCalled();
  });

  it("rejects a tampered token with 401", async () => {
    const res = await get("/api/auth/me").set("Authorization", "Bearer not.a.token");

    expect(res.status).toBe(401);
  });

  it("rejects an expired token with 401", async () => {
    const expired = jwt.sign({ id: 7, role: "CUSTOMER" }, JWT_SECRET, { expiresIn: "-1h" });

    const res = await get("/api/auth/me").set("Authorization", `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const forged = jwt.sign({ id: 7, role: "ADMIN" }, "attacker-secret", { expiresIn: "1h" });

    const res = await get("/api/auth/me").set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it("returns the profile for a valid token", async () => {
    svc.getUserById.mockResolvedValue(sessionUser as any);

    const res = await get("/api/auth/me").set("Authorization", `Bearer ${tokenFor()}`);

    expect(res.status).toBe(200);
    expect(svc.getUserById).toHaveBeenCalledWith(7);
  });

  it("answers 404 when the token names an account that no longer exists", async () => {
    svc.getUserById.mockResolvedValue(null as any);

    const res = await get("/api/auth/me").set("Authorization", `Bearer ${tokenFor()}`);

    expect(res.status).toBe(404);
  });

  it("reads the token from a cookie as well as the header", async () => {
    svc.getUserById.mockResolvedValue(sessionUser as any);

    const res = await get("/api/auth/me").set("Cookie", `token=${tokenFor()}`);

    expect(res.status).toBe(200);
  });
});

describe("PUT /api/auth/profile", () => {
  it("requires authentication", async () => {
    const res = await put("/api/auth/profile").send({ firstName: "A", lastName: "B" });

    expect(res.status).toBe(401);
  });

  it("rejects a malformed phone number with 422", async () => {
    const res = await put("/api/auth/profile")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ firstName: "Ada", lastName: "Lovelace", phone: "not-a-phone" });

    expect(res.status).toBe(422);
    expect(svc.updateUserProfile).not.toHaveBeenCalled();
  });

  it("updates the caller's own profile, never an id from the body", async () => {
    svc.updateUserProfile.mockResolvedValue(sessionUser as any);

    await put("/api/auth/profile")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ firstName: "Ada", lastName: "Lovelace", id: 999 });

    // The user id comes from the verified token, so passing id: 999 changes nothing.
    expect(svc.updateUserProfile).toHaveBeenCalledWith(7, expect.anything());
  });
});

describe("PUT /api/auth/change-password", () => {
  it("requires authentication", async () => {
    const res = await put("/api/auth/change-password").send({
      currentPassword: "old",
      newPassword: "newpassword1",
    });

    expect(res.status).toBe(401);
  });

  it("rejects a short new password with 422", async () => {
    const res = await put("/api/auth/change-password")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ currentPassword: "oldpassword", newPassword: "short" });

    expect(res.status).toBe(422);
  });

  it("answers 400 when the current password is wrong", async () => {
    svc.changeUserPassword.mockRejectedValue(new Error("Current password is incorrect."));

    const res = await put("/api/auth/change-password")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({ currentPassword: "wrong", newPassword: "newpassword1" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("rejects an invalid email with 422", async () => {
    const res = await post("/api/auth/forgot-password").send({ email: "nope" });

    expect(res.status).toBe(422);
  });

  it("answers 200 for an unknown address, revealing nothing", async () => {
    svc.requestPasswordReset.mockResolvedValue({
      message: "If an account with that email exists, a password reset link has been sent.",
    } as any);

    const res = await post("/api/auth/forgot-password").send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/if an account with that email exists/i);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("rejects a missing token with 422", async () => {
    const res = await post("/api/auth/reset-password").send({ newPassword: "newpassword1" });

    expect(res.status).toBe(422);
    expect(svc.resetPassword).not.toHaveBeenCalled();
  });

  it("answers 400 for an expired or already-used link", async () => {
    svc.resetPassword.mockRejectedValue(new Error("This password reset link has expired."));

    const res = await post("/api/auth/reset-password").send({
      token: "abc",
      newPassword: "newpassword1",
    });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/verify-email", () => {
  it("is reachable without signing in, since the link is clicked from an inbox", async () => {
    svc.verifyEmailToken.mockResolvedValue({ message: "Email confirmed. Thanks!" } as any);

    const res = await post("/api/auth/verify-email").send({ token: "verify-token" });

    expect(res.status).toBe(200);
  });

  it("answers 400 when no token is supplied", async () => {
    const res = await post("/api/auth/verify-email").send({});

    expect(res.status).toBe(400);
    expect(svc.verifyEmailToken).not.toHaveBeenCalled();
  });

  it("answers 400 for an invalid link", async () => {
    svc.verifyEmailToken.mockRejectedValue(new Error("This verification link is invalid"));

    const res = await post("/api/auth/verify-email").send({ token: "bad" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/resend-verification", () => {
  it("requires authentication", async () => {
    const res = await post("/api/auth/resend-verification").send({});

    expect(res.status).toBe(401);
  });

  it("resends for the signed-in account", async () => {
    svc.resendVerificationEmail.mockResolvedValue({ message: "Verification email sent." } as any);

    const res = await post("/api/auth/resend-verification")
      .set("Authorization", `Bearer ${tokenFor()}`)
      .send({});

    expect(res.status).toBe(200);
    expect(svc.resendVerificationEmail).toHaveBeenCalledWith(7);
  });
});

describe("auth rate limiting", () => {
  it("locks a single IP out after 20 attempts in the window", async () => {
    const attacker = "198.51.100.77";
    svc.loginUser.mockRejectedValue(new Error("Invalid email or password"));

    let lastStatus = 0;
    for (let i = 0; i < 21; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", attacker)
        .send({ email: "victim@example.com", password: `guess-${i}` });
      lastStatus = res.status;
    }

    // Credential stuffing against one account must run out of budget.
    expect(lastStatus).toBe(429);
  });

  it("leaves other clients unaffected by that lockout", async () => {
    svc.loginUser.mockRejectedValue(new Error("Invalid email or password"));

    const res = await request(app)
      .post("/api/auth/login")
      .set("X-Forwarded-For", "198.51.100.200")
      .send({ email: "someone@example.com", password: "x" });

    expect(res.status).not.toBe(429);
  });
});
