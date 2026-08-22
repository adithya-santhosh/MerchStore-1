import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * auth-cookie.ts reads env at import time, so each case re-imports the module
 * with a fresh registry after setting the environment it should see.
 */
const loadWith = async (env: Record<string, string | undefined>) => {
  vi.resetModules();
  const saved = { ...process.env };
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  });
  const mod = await import("./auth-cookie");
  process.env = saved;
  return mod;
};

let originalEnv: NodeJS.ProcessEnv;

beforeEach(() => {
  originalEnv = { ...process.env };
});

afterEach(() => {
  process.env = originalEnv;
  vi.resetModules();
});

describe("auth cookie options", () => {
  it("is always HttpOnly so XSS cannot read the token", async () => {
    const { AUTH_COOKIE_OPTIONS } = await loadWith({ NODE_ENV: "production" });
    expect(AUTH_COOKIE_OPTIONS.httpOnly).toBe(true);
  });

  it("is Secure in production", async () => {
    const { AUTH_COOKIE_OPTIONS } = await loadWith({
      NODE_ENV: "production",
      COOKIE_SAMESITE: undefined,
    });
    expect(AUTH_COOKIE_OPTIONS.secure).toBe(true);
  });

  it("defaults to SameSite=none in production (cross-site Vercel + Render)", async () => {
    const { AUTH_COOKIE_OPTIONS } = await loadWith({
      NODE_ENV: "production",
      COOKIE_SAMESITE: undefined,
    });
    expect(AUTH_COOKIE_OPTIONS.sameSite).toBe("none");
  });

  it("honours COOKIE_SAMESITE=lax for a shared-domain setup", async () => {
    // The target state: api.example.com + www.example.com are the same site,
    // so Lax works and dodges third-party-cookie restrictions entirely.
    const { AUTH_COOKIE_OPTIONS } = await loadWith({
      NODE_ENV: "production",
      COOKIE_SAMESITE: "lax",
    });
    expect(AUTH_COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(AUTH_COOKIE_OPTIONS.secure).toBe(true);
  });

  it("uses lax outside production so local HTTP development works", async () => {
    const { AUTH_COOKIE_OPTIONS } = await loadWith({
      NODE_ENV: "test",
      COOKIE_SAMESITE: undefined,
    });
    expect(AUTH_COOKIE_OPTIONS.sameSite).toBe("lax");
    expect(AUTH_COOKIE_OPTIONS.secure).toBe(false);
  });

  it("scopes the cookie to the whole site", async () => {
    const { AUTH_COOKIE_OPTIONS, AUTH_COOKIE_NAME } = await loadWith({ NODE_ENV: "test" });
    expect(AUTH_COOKIE_OPTIONS.path).toBe("/");
    expect(AUTH_COOKIE_NAME).toBe("token");
  });
});
