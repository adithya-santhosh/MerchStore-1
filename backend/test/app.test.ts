import { describe, it, expect, vi } from "vitest";
import request from "supertest";

// /health now checks the database (see app.ts) rather than answering
// unconditionally — several tests below reuse /health as a convenient
// side-effect-free GET route to exercise CORS/error-handling middleware,
// not because they care about health-check semantics specifically, so
// they need a DB call to resolve rather than reject with no real DB here.
vi.mock("../src/lib/prisma", () => ({
  default: { $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]) },
}));

import app from "../src/app";
import prisma from "../src/lib/prisma";

describe("app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /health returns 503 when the database is unreachable", async () => {
    // An uptime monitor needs to be able to tell "server up, DB down"
    // apart from "everything's fine" — that's the entire point of
    // checking the DB here instead of answering unconditionally.
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("connection refused"));

    const res = await request(app).get("/health");
    expect(res.status).toBe(503);
    expect(res.body.status).toBe("error");
  });

  it("GET / returns a plain-text confirmation", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Backend Running");
  });

  it("blocks an admin route with no auth token", async () => {
    const res = await request(app).get("/api/products/admin/stats");
    expect(res.status).toBe(401);
  });
});

describe("CSP violation reporting", () => {
  it("accepts a report-uri style violation report", async () => {
    const res = await request(app)
      .post("/api/csp-report")
      .set("Content-Type", "application/csp-report")
      .send(
        JSON.stringify({
          "csp-report": { "violated-directive": "script-src", "blocked-uri": "https://evil.example" },
        })
      );

    expect(res.status).toBe(204);
  });

  it("accepts a Reporting API style violation report", async () => {
    const res = await request(app)
      .post("/api/csp-report")
      .set("Content-Type", "application/reports+json")
      .send(JSON.stringify([{ type: "csp-violation", body: { blockedURL: "https://evil.example" } }]));

    expect(res.status).toBe(204);
  });
});

describe("error handling", () => {
  it("returns JSON 404 for an unknown route, not an HTML page", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("rejects a disallowed CORS origin with 403 rather than 500", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://not-our-frontend.example.com");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Origin not allowed");
    // The whole point: a blocked origin must not look like a server fault.
    expect(res.status).not.toBe(500);
  });

  it("still allows a permitted origin through", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:3000");

    expect(res.status).toBe(200);
    expect(res.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("rejects an arbitrary *.vercel.app origin rather than trusting the wildcard", async () => {
    // credentials: true is on, so blanket-trusting *.vercel.app would let anyone
    // who deploys their own project there make authenticated requests using a
    // logged-in customer's cookie. Only origins listed in ALLOWED_ORIGIN may pass.
    const res = await request(app)
      .get("/health")
      .set("Origin", "https://some-attacker-project.vercel.app");

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Origin not allowed");
  });

  it("answers 400 for malformed JSON instead of crashing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email": "broken"'); // deliberately truncated

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/malformed json/i);
  });

  it("never leaks a stack trace to the client", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\(/);
    expect(res.body).not.toHaveProperty("stack");
  });
});

describe("proxy trust / rate-limit isolation", () => {
  it("trusts a bounded number of proxy hops rather than every hop", () => {
    // `true` would let any client forge X-Forwarded-For and evade rate limiting.
    const setting = app.get("trust proxy");
    expect(setting).not.toBe(true);
    expect(typeof setting).toBe("number");
  });

  it("gives each forwarded client IP its own rate-limit budget", async () => {
    // Behind a proxy without `trust proxy`, req.ip is the proxy's address for
    // everyone, so all customers share one counter and a handful of failed
    // logins locks out the whole store. Two distinct client IPs must therefore
    // consume from two distinct budgets.
    const post = (clientIp: string) =>
      request(app)
        .post("/api/auth/login")
        .set("X-Forwarded-For", clientIp)
        .send({}); // rejected by Zod before any DB access

    const first = await post("203.0.113.10");
    const second = await post("203.0.113.10");
    const otherClient = await post("198.51.100.20");

    const remaining = (res: request.Response) =>
      Number(res.headers["ratelimit-remaining"]);

    // Same client: the budget visibly draws down.
    expect(remaining(second)).toBe(remaining(first) - 1);

    // Different client: starts from its own budget, unaffected by the first.
    expect(remaining(otherClient)).toBe(remaining(first));
  });
});
