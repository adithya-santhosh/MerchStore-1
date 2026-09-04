import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { parseCookies, requiresCsrfCheck, csrfTokenIsValid, generateCsrfToken } from "../../src/lib/csrf";

const mockReq = (over: { method?: string; cookie?: string; authorization?: string; csrfHeader?: string } = {}): Request =>
  ({
    method: over.method ?? "POST",
    headers: {
      ...(over.cookie ? { cookie: over.cookie } : {}),
      ...(over.authorization ? { authorization: over.authorization } : {}),
      ...(over.csrfHeader !== undefined ? { "x-csrf-token": over.csrfHeader } : {}),
    },
  }) as unknown as Request;

describe("generateCsrfToken", () => {
  it("produces a long, unpredictable value each time", () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();

    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});

describe("parseCookies", () => {
  it("returns an empty object when there is no cookie header", () => {
    expect(parseCookies(mockReq({ cookie: undefined }))).toEqual({});
  });

  it("parses multiple cookies", () => {
    const req = mockReq({ cookie: "role=ADMIN; csrf_token=abc123" });
    expect(parseCookies(req)).toEqual({ role: "ADMIN", csrf_token: "abc123" });
  });
});

describe("requiresCsrfCheck", () => {
  it("applies to POST/PUT/PATCH/DELETE", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      expect(requiresCsrfCheck(mockReq({ method }))).toBe(true);
    }
  });

  it("does not apply to GET or HEAD — nothing to protect", () => {
    expect(requiresCsrfCheck(mockReq({ method: "GET" }))).toBe(false);
    expect(requiresCsrfCheck(mockReq({ method: "HEAD" }))).toBe(false);
  });

  it("does not apply when the request carries its own Authorization header", () => {
    // Not riding an ambient cookie, so a cross-site page has nothing to forge.
    expect(
      requiresCsrfCheck(mockReq({ method: "POST", authorization: "Bearer sometoken" }))
    ).toBe(false);
  });
});

describe("csrfTokenIsValid", () => {
  it("passes when the header echoes the cookie exactly", () => {
    const req = mockReq({ cookie: "csrf_token=abc123", csrfHeader: "abc123" });
    expect(csrfTokenIsValid(req)).toBe(true);
  });

  it("fails when the header is missing", () => {
    const req = mockReq({ cookie: "csrf_token=abc123" });
    expect(csrfTokenIsValid(req)).toBe(false);
  });

  it("fails when the cookie is missing", () => {
    const req = mockReq({ csrfHeader: "abc123" });
    expect(csrfTokenIsValid(req)).toBe(false);
  });

  it("fails when the header doesn't match the cookie — the actual forged-request case", () => {
    // An attacker can't read the victim's cookie, so at best they guess or
    // supply their own value, which won't match what the browser sent.
    const req = mockReq({ cookie: "csrf_token=abc123", csrfHeader: "attacker-guess" });
    expect(csrfTokenIsValid(req)).toBe(false);
  });

  it("fails when both are empty strings", () => {
    const req = mockReq({ cookie: "csrf_token=", csrfHeader: "" });
    expect(csrfTokenIsValid(req)).toBe(false);
  });
});
