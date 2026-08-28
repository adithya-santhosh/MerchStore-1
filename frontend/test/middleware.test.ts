import { describe, it, expect, beforeAll } from "vitest";
import { SignJWT } from "jose";
// Type-only imports are erased at compile time, so they do not disturb the
// load-order dance below.
import type { NextRequest as NextRequestType, NextResponse } from "next/server";

const JWT_SECRET = "test-jwt-secret-do-not-use-in-production";

// middleware.ts reads JWT_SECRET at module load, so the env has to be in place
// before the import happens — hence the dynamic import below.
process.env.JWT_SECRET = JWT_SECRET;

let middleware: (req: NextRequestType) => Promise<NextResponse>;
let NextRequest: typeof NextRequestType;

beforeAll(async () => {
  ({ middleware } = await import("@/middleware"));
  ({ NextRequest } = await import("next/server"));
});

/** Signs a token the middleware will accept, with the given role. */
const signToken = async (role: string, expiresIn = "1h") =>
  new SignJWT({ id: 7, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(JWT_SECRET));

const requestFor = (path: string, token?: string) => {
  const headers = new Headers();
  if (token) headers.set("cookie", `token=${token}`);
  return new NextRequest(new URL(`http://localhost:3000${path}`), { headers });
};

/** The Location header of a redirect response, or null if it isn't one. */
const redirectTarget = (res: NextResponse): URL | null => {
  const location = res.headers.get("location");
  return location ? new URL(location) : null;
};

describe("/admin protection", () => {
  it("redirects an anonymous visitor to the login page", async () => {
    const res = await middleware(requestFor("/admin/products"));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("remembers where the visitor was heading", async () => {
    const res = await middleware(requestFor("/admin/products"));

    expect(redirectTarget(res)?.searchParams.get("callbackUrl")).toBe("/admin/products");
  });

  it("redirects a signed-in customer away from the back office", async () => {
    const res = await middleware(requestFor("/admin/products", await signToken("CUSTOMER")));

    // A valid session is not enough — /admin needs the ADMIN role.
    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("redirects a vendor away from the back office", async () => {
    const res = await middleware(requestFor("/admin/products", await signToken("VENDOR")));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("lets an admin through", async () => {
    const res = await middleware(requestFor("/admin/products", await signToken("ADMIN")));

    expect(redirectTarget(res)).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const forged = await new SignJWT({ id: 7, role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("attacker-secret"));

    const res = await middleware(requestFor("/admin", forged));

    // The cookie is verified cryptographically, never merely decoded.
    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("rejects an expired admin token", async () => {
    const expired = await new SignJWT({ id: 7, role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = await middleware(requestFor("/admin", expired));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("rejects a structurally invalid cookie value", async () => {
    const res = await middleware(requestFor("/admin", "not-a-jwt"));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("rejects a token carrying no role claim", async () => {
    const roleless = await new SignJWT({ id: 7 })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(JWT_SECRET));

    const res = await middleware(requestFor("/admin", roleless));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("protects nested admin routes too", async () => {
    const res = await middleware(requestFor("/admin/orders/42"));

    expect(redirectTarget(res)?.pathname).toBe("/login");
    expect(redirectTarget(res)?.searchParams.get("callbackUrl")).toBe("/admin/orders/42");
  });
});

describe("/dashboard protection", () => {
  it("redirects an anonymous visitor to login", async () => {
    const res = await middleware(requestFor("/dashboard"));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("lets any signed-in customer through", async () => {
    const res = await middleware(requestFor("/dashboard", await signToken("CUSTOMER")));

    // Unlike /admin, the dashboard only needs a valid session.
    expect(redirectTarget(res)).toBeNull();
  });

  it("lets an admin through as well", async () => {
    const res = await middleware(requestFor("/dashboard", await signToken("ADMIN")));

    expect(redirectTarget(res)).toBeNull();
  });

  it("rejects an invalid token", async () => {
    const res = await middleware(requestFor("/dashboard", "garbage"));

    expect(redirectTarget(res)?.pathname).toBe("/login");
  });

  it("preserves the callback URL", async () => {
    const res = await middleware(requestFor("/dashboard"));

    expect(redirectTarget(res)?.searchParams.get("callbackUrl")).toBe("/dashboard");
  });
});

describe("/login and /register for signed-in users", () => {
  it("sends a signed-in customer to the storefront", async () => {
    const res = await middleware(requestFor("/login", await signToken("CUSTOMER")));

    expect(redirectTarget(res)?.pathname).toBe("/");
  });

  it("sends a signed-in admin to the product manager", async () => {
    const res = await middleware(requestFor("/login", await signToken("ADMIN")));

    expect(redirectTarget(res)?.pathname).toBe("/admin/products");
  });

  it("leaves an anonymous visitor on the login page", async () => {
    const res = await middleware(requestFor("/login"));

    expect(redirectTarget(res)).toBeNull();
  });

  it("lets someone with a stale token reach login to sign in again", async () => {
    const res = await middleware(requestFor("/login", "expired-or-garbage"));

    // Bouncing them would strand a user whose session has gone bad.
    expect(redirectTarget(res)).toBeNull();
  });

  it("applies the same rule to the register page", async () => {
    const res = await middleware(requestFor("/register", await signToken("CUSTOMER")));

    expect(redirectTarget(res)?.pathname).toBe("/");
  });
});

describe("unprotected routes", () => {
  it.each(["/", "/products", "/cart", "/checkout", "/about"])(
    "leaves %s alone for an anonymous visitor",
    async (path) => {
      const res = await middleware(requestFor(path));

      expect(redirectTarget(res)).toBeNull();
    }
  );
});

describe("matcher configuration", () => {
  it("covers exactly the admin, dashboard and auth routes", async () => {
    const { config } = await import("@/middleware");

    expect(config.matcher).toEqual([
      "/admin/:path*",
      "/dashboard/:path*",
      "/login",
      "/register",
    ]);
  });
});
