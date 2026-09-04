import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => {
  const address = {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  };
  return {
    default: {
      address,
      $transaction: vi.fn((cb: any) => cb({ address })),
    },
  };
});

import prisma from "../../src/lib/prisma";
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from "../../src/services/address.service";

const mockedPrisma = vi.mocked(prisma, true);

const addressRow = (over: Record<string, any> = {}) => ({
  id: 1,
  userId: 7,
  label: "Home",
  addressLine1: "221B Baker Street",
  addressLine2: null,
  city: "Bengaluru",
  state: "KA",
  postalCode: "560001",
  country: "IN",
  isDefault: false,
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserAddresses", () => {
  it("orders the default address first, then newest first", async () => {
    mockedPrisma.address.findMany.mockResolvedValue([] as any);

    await getUserAddresses(7);

    expect(mockedPrisma.address.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    });
  });
});

describe("createAddress", () => {
  it("does not touch other addresses when this one isn't marked default", async () => {
    mockedPrisma.address.count.mockResolvedValue(2 as any);
    mockedPrisma.address.create.mockResolvedValue(addressRow() as any);

    await createAddress(7, { addressLine1: "x", city: "y", state: "z", postalCode: "560001" });

    expect(mockedPrisma.address.updateMany).not.toHaveBeenCalled();
    const data = (mockedPrisma.address.create.mock.calls[0]?.[0] as any).data;
    expect(data.isDefault).toBe(false);
  });

  it("clears every other default first when this one is marked default", async () => {
    mockedPrisma.address.count.mockResolvedValue(2 as any);
    mockedPrisma.address.create.mockResolvedValue(addressRow({ isDefault: true }) as any);

    await createAddress(7, {
      addressLine1: "x",
      city: "y",
      state: "z",
      postalCode: "560001",
      isDefault: true,
    });

    expect(mockedPrisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, isDefault: true },
      data: { isDefault: false },
    });
  });

  it("makes a user's very first address the default automatically, even unrequested", async () => {
    mockedPrisma.address.count.mockResolvedValue(0 as any);
    mockedPrisma.address.create.mockResolvedValue(addressRow({ isDefault: true }) as any);

    await createAddress(7, { addressLine1: "x", city: "y", state: "z", postalCode: "560001" });

    const data = (mockedPrisma.address.create.mock.calls[0]?.[0] as any).data;
    expect(data.isDefault).toBe(true);
  });

  it("scopes the created row to the given user", async () => {
    mockedPrisma.address.count.mockResolvedValue(1 as any);
    mockedPrisma.address.create.mockResolvedValue(addressRow() as any);

    await createAddress(7, { addressLine1: "x", city: "y", state: "z", postalCode: "560001" });

    const data = (mockedPrisma.address.create.mock.calls[0]?.[0] as any).data;
    expect(data.userId).toBe(7);
  });
});

describe("updateAddress", () => {
  it("reports a missing address rather than throwing something opaque", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(null as any);

    await expect(updateAddress(7, 999, { city: "New City" })).rejects.toThrow(/not found/i);
  });

  it("refuses to edit another user's address", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(addressRow({ userId: 999 }) as any);

    await expect(updateAddress(7, 1, { city: "New City" })).rejects.toThrow(/your own address/i);
    expect(mockedPrisma.address.update).not.toHaveBeenCalled();
  });

  it("clears every other default when this edit sets isDefault", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(addressRow({ userId: 7 }) as any);
    mockedPrisma.address.update.mockResolvedValue(addressRow({ isDefault: true }) as any);

    await updateAddress(7, 1, { isDefault: true });

    expect(mockedPrisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, isDefault: true, id: { not: 1 } },
      data: { isDefault: false },
    });
  });

  it("does not touch other addresses when isDefault isn't part of the edit", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(addressRow({ userId: 7 }) as any);
    mockedPrisma.address.update.mockResolvedValue(addressRow() as any);

    await updateAddress(7, 1, { city: "New City" });

    expect(mockedPrisma.address.updateMany).not.toHaveBeenCalled();
  });
});

describe("deleteAddress", () => {
  it("reports a missing address rather than throwing something opaque", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(null as any);

    await expect(deleteAddress(7, 999)).rejects.toThrow(/not found/i);
  });

  it("refuses to delete another user's address", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 999, orders: [] }) as any
    );

    await expect(deleteAddress(7, 1)).rejects.toThrow(/your own address/i);
    expect(mockedPrisma.address.delete).not.toHaveBeenCalled();
  });

  it("refuses to delete an address used on a past order", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 7, orders: [{ id: 42 }] }) as any
    );

    await expect(deleteAddress(7, 1)).rejects.toThrow(/past order/i);
    expect(mockedPrisma.address.delete).not.toHaveBeenCalled();
  });

  it("deletes an unused address", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 7, isDefault: false, orders: [] }) as any
    );

    await deleteAddress(7, 1);

    expect(mockedPrisma.address.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("promotes the next-most-recent address to default when the default is deleted", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 7, isDefault: true, orders: [] }) as any
    );
    mockedPrisma.address.findFirst.mockResolvedValue(addressRow({ id: 2 }) as any);

    await deleteAddress(7, 1);

    expect(mockedPrisma.address.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: { isDefault: true },
    });
  });

  it("does not try to promote anything when no addresses remain", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 7, isDefault: true, orders: [] }) as any
    );
    mockedPrisma.address.findFirst.mockResolvedValue(null as any);

    await deleteAddress(7, 1);

    expect(mockedPrisma.address.update).not.toHaveBeenCalled();
  });

  it("does not promote anything when the deleted address wasn't the default", async () => {
    mockedPrisma.address.findUnique.mockResolvedValue(
      addressRow({ userId: 7, isDefault: false, orders: [] }) as any
    );

    await deleteAddress(7, 1);

    expect(mockedPrisma.address.findFirst).not.toHaveBeenCalled();
    expect(mockedPrisma.address.update).not.toHaveBeenCalled();
  });
});
