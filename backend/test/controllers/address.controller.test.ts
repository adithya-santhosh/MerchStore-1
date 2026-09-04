import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../src/services/address.service", () => ({
  getUserAddresses: vi.fn(),
  createAddress: vi.fn(),
  updateAddress: vi.fn(),
  deleteAddress: vi.fn(),
}));

// requireAuth checks tokenVersion against the DB on every request.
vi.mock("../../src/lib/prisma", () => ({
  default: { user: { findUnique: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import app from "../../src/app";
import * as addressService from "../../src/services/address.service";

const svc = vi.mocked(addressService);
const JWT_SECRET = process.env.JWT_SECRET!;

const auth = (id = 7) =>
  `Bearer ${jwt.sign(
    { id, email: "u@example.com", role: "CUSTOMER", firstName: "U", lastName: "R" },
    JWT_SECRET,
    { expiresIn: "1h" }
  )}`;

const validAddress = {
  addressLine1: "221B Baker Street",
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/addresses", () => {
  it("rejects an anonymous request with 401", async () => {
    const res = await request(app).get("/api/addresses");

    expect(res.status).toBe(401);
    expect(svc.getUserAddresses).not.toHaveBeenCalled();
  });

  it("returns the signed-in user's own addresses", async () => {
    svc.getUserAddresses.mockResolvedValue([{ id: 1 }] as any);

    const res = await request(app).get("/api/addresses").set("Authorization", auth(7));

    expect(res.status).toBe(200);
    expect(svc.getUserAddresses).toHaveBeenCalledWith(7);
  });
});

describe("POST /api/addresses", () => {
  it("rejects a payload missing required fields with 422", async () => {
    const res = await request(app).post("/api/addresses").set("Authorization", auth()).send({ city: "x" });

    expect(res.status).toBe(422);
    expect(svc.createAddress).not.toHaveBeenCalled();
  });

  it("creates the address under the signed-in user, not a client-supplied id", async () => {
    svc.createAddress.mockResolvedValue({ id: 1, ...validAddress } as any);

    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", auth(7))
      .send({ ...validAddress, userId: 999 });

    expect(res.status).toBe(201);
    expect(svc.createAddress).toHaveBeenCalledWith(7, expect.not.objectContaining({ userId: 999 }));
  });

  it("strips HTML out of free-text fields before they reach the service", async () => {
    svc.createAddress.mockResolvedValue({ id: 1 } as any);

    await request(app)
      .post("/api/addresses")
      .set("Authorization", auth())
      .send({ ...validAddress, city: "<script>alert(1)</script>Bengaluru" });

    expect(svc.createAddress).toHaveBeenCalledWith(7, expect.objectContaining({ city: "Bengaluru" }));
  });
});

describe("PUT /api/addresses/:id", () => {
  it("rejects an invalid address id with 400", async () => {
    const res = await request(app).put("/api/addresses/abc").set("Authorization", auth()).send({ city: "x" });

    expect(res.status).toBe(400);
    expect(svc.updateAddress).not.toHaveBeenCalled();
  });

  it("updates the address for the signed-in user", async () => {
    svc.updateAddress.mockResolvedValue({ id: 1, city: "New City" } as any);

    const res = await request(app)
      .put("/api/addresses/1")
      .set("Authorization", auth(7))
      .send({ city: "New City" });

    expect(res.status).toBe(200);
    expect(svc.updateAddress).toHaveBeenCalledWith(7, 1, expect.objectContaining({ city: "New City" }));
  });

  it("maps another user's address to 403", async () => {
    svc.updateAddress.mockRejectedValue(new Error("You can only edit your own address"));

    const res = await request(app).put("/api/addresses/1").set("Authorization", auth()).send({ city: "x" });

    expect(res.status).toBe(403);
  });

  it("maps a missing address to 404", async () => {
    svc.updateAddress.mockRejectedValue(new Error("Address not found"));

    const res = await request(app).put("/api/addresses/999").set("Authorization", auth()).send({ city: "x" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/addresses/:id", () => {
  it("rejects an invalid address id with 400", async () => {
    const res = await request(app).delete("/api/addresses/abc").set("Authorization", auth());

    expect(res.status).toBe(400);
    expect(svc.deleteAddress).not.toHaveBeenCalled();
  });

  it("deletes the address for the signed-in user", async () => {
    svc.deleteAddress.mockResolvedValue({ message: "Address deleted successfully" });

    const res = await request(app).delete("/api/addresses/1").set("Authorization", auth(7));

    expect(res.status).toBe(200);
    expect(svc.deleteAddress).toHaveBeenCalledWith(7, 1);
  });

  it("maps an address still referenced by an order to 409", async () => {
    svc.deleteAddress.mockRejectedValue(new Error("This address is used on a past order and can't be deleted"));

    const res = await request(app).delete("/api/addresses/1").set("Authorization", auth());

    expect(res.status).toBe(409);
  });

  it("maps another user's address to 403", async () => {
    svc.deleteAddress.mockRejectedValue(new Error("You can only delete your own address"));

    const res = await request(app).delete("/api/addresses/1").set("Authorization", auth());

    expect(res.status).toBe(403);
  });
});
