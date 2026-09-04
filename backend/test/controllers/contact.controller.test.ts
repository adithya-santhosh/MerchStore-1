import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/contact.service", () => ({
  submitContactMessage: vi.fn(),
  getContactMessages: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as contactService from "../../src/services/contact.service";

const svc = vi.mocked(contactService);
const JWT_SECRET = process.env.JWT_SECRET!;

/** POST /api/contact is rate limited to 5/15min per IP — one address per test. */
let ipCounter = 0;
const nextIp = () => {
  ipCounter += 1;
  return `10.${Math.floor(ipCounter / 254)}.${ipCounter % 254}.1`;
};

const post = (path: string) => request(app).post(path).set("X-Forwarded-For", nextIp());
const get = (path: string) => request(app).get(path).set("X-Forwarded-For", nextIp());

const tokenWithRole = (role: string) =>
  jwt.sign({ id: 1, email: "u@example.com", role, firstName: "U", lastName: "R" }, JWT_SECRET, {
    expiresIn: "1h",
  });

const validPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Do you stock a roof rack for a 2019 Jimny?",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/contact", () => {
  it("rejects a payload missing required fields with 422", async () => {
    const res = await post("/api/contact").send({ name: "Ada" });

    expect(res.status).toBe(422);
    expect(svc.submitContactMessage).not.toHaveBeenCalled();
  });

  it("rejects an invalid email with 422", async () => {
    const res = await post("/api/contact").send({ ...validPayload, email: "not-an-email" });

    expect(res.status).toBe(422);
  });

  it("stores a valid message and returns 201", async () => {
    svc.submitContactMessage.mockResolvedValue({ message: "Thanks for reaching out." });

    const res = await post("/api/contact").send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/thanks/i);
    expect(svc.submitContactMessage).toHaveBeenCalledWith(validPayload);
  });

  it("strips HTML out of the name and message before they reach the service", async () => {
    svc.submitContactMessage.mockResolvedValue({ message: "Thanks for reaching out." });

    await post("/api/contact").send({
      name: "<script>alert(1)</script>Ada",
      email: "ada@example.com",
      message: "<b>Hello</b> there",
    });

    expect(svc.submitContactMessage).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Ada", message: "Hello there" })
    );
  });

  it("requires no authentication at all", async () => {
    svc.submitContactMessage.mockResolvedValue({ message: "Thanks." });

    const res = await post("/api/contact").send(validPayload);

    expect(res.status).not.toBe(401);
  });

  it("answers 500, not a crash, when the service throws", async () => {
    svc.submitContactMessage.mockRejectedValue(new Error("DB unreachable"));

    const res = await post("/api/contact").send(validPayload);

    expect(res.status).toBe(500);
  });
});

describe("GET /api/contact", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await get("/api/contact");

    expect(res.status).toBe(401);
    expect(svc.getContactMessages).not.toHaveBeenCalled();
  });

  it("rejects a signed-in customer with 403", async () => {
    const res = await get("/api/contact").set("Authorization", `Bearer ${tokenWithRole("CUSTOMER")}`);

    expect(res.status).toBe(403);
    expect(svc.getContactMessages).not.toHaveBeenCalled();
  });

  it("returns the message list for an admin", async () => {
    svc.getContactMessages.mockResolvedValue([
      { id: 1, name: "Ada", email: "ada@example.com", message: "Hi", createdAt: new Date() },
    ] as any);

    const res = await get("/api/contact").set("Authorization", `Bearer ${tokenWithRole("ADMIN")}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});
