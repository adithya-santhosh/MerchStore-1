// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { getCookie } from "@/utils/cookie";

/** Clears every cookie jsdom is currently holding. */
const clearCookies = () => {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
};

beforeEach(() => {
  clearCookies();
});

describe("getCookie", () => {
  it("returns null when no cookies are set at all", () => {
    expect(getCookie("token")).toBeNull();
  });

  it("reads the only cookie present", () => {
    document.cookie = "token=abc123";

    expect(getCookie("token")).toBe("abc123");
  });

  it("picks the right cookie out of several", () => {
    document.cookie = "theme=dark";
    document.cookie = "token=abc123";
    document.cookie = "locale=en-IN";

    expect(getCookie("token")).toBe("abc123");
  });

  it("returns null for a name that is not set", () => {
    document.cookie = "theme=dark";

    expect(getCookie("token")).toBeNull();
  });

  it("does not match a cookie whose name merely ends with the requested one", () => {
    document.cookie = "csrf_token=should-not-match";

    // Splitting on "; token=" is what keeps "csrf_token" from being read as "token".
    expect(getCookie("token")).toBeNull();
  });

  it("returns null rather than an empty string for a valueless cookie", () => {
    document.cookie = "token=";

    expect(getCookie("token")).toBeNull();
  });

  it("reads a JWT-shaped value intact", () => {
    const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6N30.signature-part";
    document.cookie = `token=${jwt}`;

    expect(getCookie("token")).toBe(jwt);
  });

  it("reads the first cookie in the jar", () => {
    document.cookie = "token=first";
    document.cookie = "other=second";

    expect(getCookie("token")).toBe("first");
  });
});
