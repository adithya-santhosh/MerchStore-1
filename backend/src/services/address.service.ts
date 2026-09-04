import prisma from "../lib/prisma";

export interface AddressData {
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

/** Default first, then newest first — the one most likely to be reused sits at the top. */
export const getUserAddresses = async (userId: number) => {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { id: "desc" }],
  });
};

export const createAddress = async (userId: number, data: AddressData) => {
  // A brand-new address that asks to be default, or a user's very first
  // address ever (which should default itself even if they didn't check the
  // box — there is no meaningful "not default" state with only one address).
  const existingCount = await prisma.address.count({ where: { userId } });
  const shouldBeDefault = data.isDefault || existingCount === 0;

  return prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({ data: { userId, ...data, isDefault: shouldBeDefault } });
  });
};

export const updateAddress = async (userId: number, addressId: number, data: Partial<AddressData>) => {
  const existing = await prisma.address.findUnique({ where: { id: addressId } });
  if (!existing) throw new Error("Address not found");
  if (existing.userId !== userId) throw new Error("You can only edit your own address");

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
};

export const deleteAddress = async (userId: number, addressId: number) => {
  const existing = await prisma.address.findUnique({
    where: { id: addressId },
    include: { orders: { select: { id: true }, take: 1 } },
  });
  if (!existing) throw new Error("Address not found");
  if (existing.userId !== userId) throw new Error("You can only delete your own address");
  if (existing.orders.length > 0) {
    throw new Error("This address is used on a past order and can't be deleted");
  }

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });

    // Deleting the default leaves nothing marked default, which would make
    // checkout's "use my default address" silently fall through to nothing —
    // promote the next-most-recent address instead, if one is left.
    if (existing.isDefault) {
      const next = await tx.address.findFirst({ where: { userId }, orderBy: { id: "desc" } });
      if (next) {
        await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
    }
  });

  return { message: "Address deleted successfully" };
};
