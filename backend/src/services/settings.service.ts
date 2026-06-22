import prisma from "../lib/prisma";

export const getSettings = async () => {
  const settings = await prisma.systemSetting.findMany();
  
  // Default fallback configurations
  const config: Record<string, string> = {
    tax_rate: "0.18",       // 18% default GST
    shipping_limit: "499",  // Free shipping threshold
    shipping_cost: "99"     // Shipping charge
  };

  for (const s of settings) {
    config[s.key] = s.value;
  }

  return {
    tax_rate: Number(config.tax_rate),
    shipping_limit: Number(config.shipping_limit),
    shipping_cost: Number(config.shipping_cost)
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
