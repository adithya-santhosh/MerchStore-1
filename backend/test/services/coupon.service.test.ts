import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    coupon: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import prisma from "../../src/lib/prisma";
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../../src/services/coupon.service";

const mockedPrisma = vi.mocked(prisma, true);

/** A stored coupon, with Decimal columns in the string form Prisma returns. */
const couponRow = (over: Record<string, any> = {}) => ({
  id: 1,
  code: "SAVE10",
  type: "percent",
  value: "10",
  minOrderAmount: null,
  maxUses: null,
  usedCount: 0,
  expiresAt: null,
  isActive: true,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAllCoupons", () => {
  it("returns Decimal columns as numbers so the admin table can do arithmetic", async () => {
    mockedPrisma.coupon.findMany.mockResolvedValue([
      couponRow({ value: "10.50", minOrderAmount: "999.00" }),
    ] as any);

    const [coupon] = await getAllCoupons();

    expect(coupon.value).toBe(10.5);
    expect(coupon.minOrderAmount).toBe(999);
  });

  it("keeps a null minimum as null rather than coercing it to 0", async () => {
    mockedPrisma.coupon.findMany.mockResolvedValue([couponRow()] as any);

    const [coupon] = await getAllCoupons();

    // 0 would read as "a minimum of ₹0 applies", which is a different rule.
    expect(coupon.minOrderAmount).toBeNull();
  });

  it("lists coupons in code order", async () => {
    mockedPrisma.coupon.findMany.mockResolvedValue([] as any);

    await getAllCoupons();

    expect(mockedPrisma.coupon.findMany).toHaveBeenCalledWith({ orderBy: { code: "asc" } });
  });
});

describe("createCoupon", () => {
  it("normalises the code to trimmed upper case so lookups match", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow() as any);

    await createCoupon({ code: "  save10 ", type: "percent", value: 10 });

    expect(mockedPrisma.coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: "SAVE10" }) })
    );
  });

  it("stores optional limits as null when they are omitted", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow() as any);

    await createCoupon({ code: "SAVE10", type: "percent", value: 10 });

    const data = (mockedPrisma.coupon.create.mock.calls[0]?.[0] as any).data;
    expect(data.minOrderAmount).toBeNull();
    expect(data.maxUses).toBeNull();
    expect(data.expiresAt).toBeNull();
  });

  it("defaults a new coupon to active", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow() as any);

    await createCoupon({ code: "SAVE10", type: "percent", value: 10 });

    const data = (mockedPrisma.coupon.create.mock.calls[0]?.[0] as any).data;
    expect(data.isActive).toBe(true);
  });

  it("honours isActive: false instead of falling back to the default", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow({ isActive: false }) as any);

    await createCoupon({ code: "SAVE10", type: "percent", value: 10, isActive: false });

    const data = (mockedPrisma.coupon.create.mock.calls[0]?.[0] as any).data;
    expect(data.isActive).toBe(false);
  });

  it("parses an ISO expiry string into a Date", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow() as any);

    await createCoupon({
      code: "SAVE10",
      type: "percent",
      value: 10,
      expiresAt: "2027-01-01T00:00:00.000Z",
    });

    const data = (mockedPrisma.coupon.create.mock.calls[0]?.[0] as any).data;
    expect(data.expiresAt).toBeInstanceOf(Date);
    expect(data.expiresAt.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });

  it("coerces numeric fields sent as strings by a form post", async () => {
    mockedPrisma.coupon.create.mockResolvedValue(couponRow() as any);

    await createCoupon({
      code: "SAVE10",
      type: "fixed",
      value: "250",
      minOrderAmount: "1000",
      maxUses: "50",
    });

    const data = (mockedPrisma.coupon.create.mock.calls[0]?.[0] as any).data;
    expect(data.value).toBe(250);
    expect(data.minOrderAmount).toBe(1000);
    expect(data.maxUses).toBe(50);
  });
});

describe("updateCoupon", () => {
  it("only writes the fields that were actually supplied", async () => {
    mockedPrisma.coupon.update.mockResolvedValue(couponRow() as any);

    await updateCoupon(1, { value: 15 });

    const data = (mockedPrisma.coupon.update.mock.calls[0]?.[0] as any).data;
    expect(data).toEqual({ value: 15 });
    // A blanket write would silently clear the expiry and usage cap.
    expect(data).not.toHaveProperty("expiresAt");
    expect(data).not.toHaveProperty("maxUses");
  });

  it("normalises an edited code the same way creation does", async () => {
    mockedPrisma.coupon.update.mockResolvedValue(couponRow() as any);

    await updateCoupon(1, { code: " newcode " });

    const data = (mockedPrisma.coupon.update.mock.calls[0]?.[0] as any).data;
    expect(data.code).toBe("NEWCODE");
  });

  it("clears the expiry when it is explicitly set to null", async () => {
    mockedPrisma.coupon.update.mockResolvedValue(couponRow() as any);

    await updateCoupon(1, { expiresAt: null });

    const data = (mockedPrisma.coupon.update.mock.calls[0]?.[0] as any).data;
    expect(data.expiresAt).toBeNull();
  });

  it("can deactivate a coupon without touching anything else", async () => {
    mockedPrisma.coupon.update.mockResolvedValue(couponRow({ isActive: false }) as any);

    await updateCoupon(1, { isActive: false });

    const data = (mockedPrisma.coupon.update.mock.calls[0]?.[0] as any).data;
    expect(data).toEqual({ isActive: false });
  });

  it("returns the updated coupon with numeric money fields", async () => {
    mockedPrisma.coupon.update.mockResolvedValue(
      couponRow({ value: "15.00", minOrderAmount: "500.00" }) as any
    );

    const result = await updateCoupon(1, { value: 15 });

    expect(result.value).toBe(15);
    expect(result.minOrderAmount).toBe(500);
  });
});

describe("deleteCoupon", () => {
  it("deletes by id", async () => {
    mockedPrisma.coupon.delete.mockResolvedValue(couponRow() as any);

    await deleteCoupon(3);

    expect(mockedPrisma.coupon.delete).toHaveBeenCalledWith({ where: { id: 3 } });
  });
});

describe("validateCoupon", () => {
  it("looks the code up case-insensitively by normalising it first", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(couponRow() as any);

    await validateCoupon("  save10 ", 1000);

    expect(mockedPrisma.coupon.findUnique).toHaveBeenCalledWith({ where: { code: "SAVE10" } });
  });

  it("rejects a code that does not exist", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(null as any);

    await expect(validateCoupon("NOPE", 1000)).rejects.toThrow("Coupon code not found");
  });

  it("rejects a deactivated coupon", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(couponRow({ isActive: false }) as any);

    await expect(validateCoupon("SAVE10", 1000)).rejects.toThrow(/inactive/i);
  });

  it("rejects a coupon whose expiry has passed", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ expiresAt: new Date("2000-01-01") }) as any
    );

    await expect(validateCoupon("SAVE10", 1000)).rejects.toThrow(/expired/i);
  });

  it("accepts a coupon whose expiry is still in the future", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ expiresAt: new Date(Date.now() + 86_400_000) }) as any
    );

    await expect(validateCoupon("SAVE10", 1000)).resolves.toMatchObject({ code: "SAVE10" });
  });

  it("rejects a coupon that has hit its usage cap", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ maxUses: 5, usedCount: 5 }) as any
    );

    await expect(validateCoupon("SAVE10", 1000)).rejects.toThrow(/limit reached/i);
  });

  it("still accepts a coupon with one redemption left", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ maxUses: 5, usedCount: 4 }) as any
    );

    await expect(validateCoupon("SAVE10", 1000)).resolves.toBeTruthy();
  });

  it("rejects an order below the coupon's minimum spend", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ minOrderAmount: "1000" }) as any
    );

    await expect(validateCoupon("SAVE10", 999)).rejects.toThrow(/Minimum order amount/i);
  });

  it("accepts an order exactly at the minimum spend", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ minOrderAmount: "1000" }) as any
    );

    await expect(validateCoupon("SAVE10", 1000)).resolves.toBeTruthy();
  });

  it("returns only the fields the checkout needs, never the usage counters", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(couponRow({ maxUses: 5, usedCount: 2 }) as any);

    const result = await validateCoupon("SAVE10", 1000);

    expect(result).toEqual({ id: 1, code: "SAVE10", type: "percent", value: 10 });
  });

  it("handles a fixed-amount coupon as well as a percentage one", async () => {
    mockedPrisma.coupon.findUnique.mockResolvedValue(
      couponRow({ type: "fixed", value: "250.00" }) as any
    );

    const result = await validateCoupon("FLAT250", 1000);

    expect(result.type).toBe("fixed");
    expect(result.value).toBe(250);
  });
});
