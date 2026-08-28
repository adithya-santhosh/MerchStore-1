import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/lib/prisma", () => ({
  default: {
    systemSetting: { findMany: vi.fn(), upsert: vi.fn() },
  },
}));

import prisma from "../../src/lib/prisma";
import { getSettings, updateSettings } from "../../src/services/settings.service";

const mockedPrisma = vi.mocked(prisma, true);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSettings", () => {
  it("falls back to the live store setup when nothing is configured", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([] as any);

    const settings = await getSettings();

    // The listed price IS the price paid: no GST, no shipping charge.
    expect(settings).toEqual({
      tax_rate: 0,
      shipping_limit: 0,
      shipping_cost: 0,
      membership_fee: 999,
    });
  });

  it("lets stored rows override each default independently", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "tax_rate", value: "0.18" },
    ] as any);

    const settings = await getSettings();

    expect(settings.tax_rate).toBe(0.18);
    expect(settings.membership_fee).toBe(999); // untouched default
  });

  it("returns numbers, not the strings the settings table stores", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "shipping_cost", value: "99" },
      { key: "shipping_limit", value: "499" },
      { key: "membership_fee", value: "1499" },
    ] as any);

    const settings = await getSettings();

    expect(settings.shipping_cost).toBe(99);
    expect(settings.shipping_limit).toBe(499);
    expect(settings.membership_fee).toBe(1499);
    expect(typeof settings.shipping_cost).toBe("number");
  });

  it("ignores keys it does not recognise", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "some_future_flag", value: "true" },
    ] as any);

    const settings = await getSettings();

    expect(Object.keys(settings).sort()).toEqual([
      "membership_fee",
      "shipping_cost",
      "shipping_limit",
      "tax_rate",
    ]);
  });

  it("surfaces an unparseable stored value as NaN rather than silently reading 0", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "tax_rate", value: "eighteen percent" },
    ] as any);

    const settings = await getSettings();

    // Worth knowing about: a NaN tax rate makes every total NaN, which is loud,
    // whereas a silent 0 would quietly undercharge.
    expect(Number.isNaN(settings.tax_rate)).toBe(true);
  });
});

describe("updateSettings", () => {
  it("upserts every supplied key so a first-time write also creates the row", async () => {
    mockedPrisma.systemSetting.upsert.mockResolvedValue({} as any);
    mockedPrisma.systemSetting.findMany.mockResolvedValue([] as any);

    await updateSettings({ tax_rate: 0.18, shipping_cost: 99 });

    expect(mockedPrisma.systemSetting.upsert).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: "tax_rate" },
      update: { value: "0.18" },
      create: { key: "tax_rate", value: "0.18" },
    });
  });

  it("stringifies numeric values, since the column is text", async () => {
    mockedPrisma.systemSetting.upsert.mockResolvedValue({} as any);
    mockedPrisma.systemSetting.findMany.mockResolvedValue([] as any);

    await updateSettings({ membership_fee: 1499 });

    const call = (mockedPrisma.systemSetting.upsert.mock.calls[0]?.[0] as any);
    expect(call.update.value).toBe("1499");
    expect(typeof call.update.value).toBe("string");
  });

  it("returns the settings as they now read, not the raw input", async () => {
    mockedPrisma.systemSetting.upsert.mockResolvedValue({} as any);
    mockedPrisma.systemSetting.findMany.mockResolvedValue([
      { key: "tax_rate", value: "0.05" },
    ] as any);

    const result = await updateSettings({ tax_rate: 0.05 });

    expect(result.tax_rate).toBe(0.05);
    expect(result.membership_fee).toBe(999);
  });

  it("writes nothing when handed an empty payload", async () => {
    mockedPrisma.systemSetting.findMany.mockResolvedValue([] as any);

    await updateSettings({});

    expect(mockedPrisma.systemSetting.upsert).not.toHaveBeenCalled();
  });
});
