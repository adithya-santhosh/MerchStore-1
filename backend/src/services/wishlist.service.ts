import prisma from "../lib/prisma";

// ─── Helper to map wishlist items with product data ──────────────────────────

const mapWishlistItem = (item: any) => {
  const product = item.product;
  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];

  let categoryName = "";
  if (product.category) {
    categoryName = product.category.parent
      ? product.category.parent.name
      : product.category.name;
  }

  return {
    id: item.id,
    addedAt: item.addedAt,
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price ? Number(product.price) : 0,
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      ImageURL: primaryImage ? primaryImage.imageUrl : null,
      category: categoryName,
      isActive: product.isActive,
      stockQty: product.stockQty,
      brand: product.brand?.name || null,
    },
  };
};

// ─── Get full wishlist with product details ──────────────────────────────────

export const getWishlist = async (userId: number) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          images: true,
          category: { include: { parent: true } },
          brand: true,
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return items.map(mapWishlistItem);
};

// ─── Get just wishlist product IDs (lightweight) ─────────────────────────────

export const getWishlistIds = async (userId: number) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { productId: true },
  });
  return items.map((item) => item.productId);
};

// ─── Add to wishlist (idempotent upsert) ─────────────────────────────────────

export const addToWishlist = async (userId: number, productId: number) => {
  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    create: { userId, productId },
    update: {}, // No-op if already exists
  });

  return { id: item.id, productId: item.productId, addedAt: item.addedAt };
};

// ─── Remove from wishlist ────────────────────────────────────────────────────

export const removeFromWishlist = async (userId: number, productId: number) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });
  return { message: "Removed from wishlist" };
};
