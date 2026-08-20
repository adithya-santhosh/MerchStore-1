import prisma from "../lib/prisma";

export const getSettings = async () => {
  const settings = await prisma.systemSetting.findMany();
  
  // Default fallback configurations.
  // Tax and shipping default to 0 — the listed product price IS the price the
  // customer pays. These stay configurable so GST/shipping can be switched on
  // later from the admin Settings Panel without a code change.
  const config: Record<string, string> = {
    tax_rate: "0",          // no GST added on top of the listed price
    shipping_limit: "0",    // free shipping threshold (0 = always free)
    shipping_cost: "0",     // no shipping charge
    membership_fee: "999"   // Default membership joining fee
  };

  for (const s of settings) {
    config[s.key] = s.value;
  }

  return {
    tax_rate: Number(config.tax_rate),
    shipping_limit: Number(config.shipping_limit),
    shipping_cost: Number(config.shipping_cost),
    membership_fee: Number(config.membership_fee)
  };
};

export const updateSettings = async (data: Record<string, any>) => {
  for (const [key, value] of Object.entries(data)) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) }
    });
  }
  return getSettings();
};
