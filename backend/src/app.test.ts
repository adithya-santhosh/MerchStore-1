import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "./app";

describe("app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
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
