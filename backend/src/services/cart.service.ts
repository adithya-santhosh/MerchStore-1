import prisma from "../lib/prisma";
import crypto from "crypto";

const cartInclude = {
  items: {
    include: {
      product: {
        include: {
          images: true,
          category: true
        }
      }
    }
  }
};

const mapCart = (cart: any) => {
  if (!cart) return null;
  return {
    id: cart.id,
    sessionToken: cart.sessionToken,
    userId: cart.userId,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    items: (cart.items || []).map((item: any) => {
      const primaryImage = item.product.images?.find((img: any) => img.isPrimary) || item.product.images?.[0];
      const ImageURL = primaryImage ? primaryImage.imageUrl : null;
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        product: {
          id: item.product.id,
          name: item.product.name,
          slug: item.product.slug,
          price: Number(item.product.price),
          compareAtPrice: item.product.compareAtPrice ? Number(item.product.compareAtPrice) : null,
          category: item.product.category?.name || "",
          ImageURL
        }
      };
    })
  };
};

export const getOrCreateCart = async (sessionToken?: string) => {
  let token = sessionToken;

  if (!token) {
    token = crypto.randomUUID();
    const cart = await prisma.cart.create({
      data: { sessionToken: token },
      include: cartInclude
    });
    return mapCart(cart);
  }

  let cart = await prisma.cart.findFirst({
    where: { sessionToken: token },
    include: cartInclude
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { sessionToken: token },
      include: cartInclude
    });
  }

  return mapCart(cart);
};

export const addItemToCart = async (sessionToken: string, productId: number, quantity: number, relative: boolean = true) => {
  const cart = await prisma.cart.findFirst({
    where: { sessionToken }
  });

  let targetCartId: number;

  if (!cart) {
    const newCart = await prisma.cart.create({
      data: { sessionToken }
    });
    targetCartId = newCart.id;
  } else {
    targetCartId = cart.id;
  }

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: targetCartId,
      productId: productId
    }
  });

  if (existingItem) {
    const newQuantity = relative ? existingItem.quantity + quantity : quantity;
    if (newQuantity <= 0) {
      await prisma.cartItem.delete({
        where: { id: existingItem.id }
      });
    } else {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          unitPrice: product.price
        }
      });
    }
  } else if (quantity > 0) {
    await prisma.cartItem.create({
      data: {
        cartId: targetCartId,
        productId,
        quantity,
        unitPrice: product.price
      }
    });
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { id: targetCartId },
    include: cartInclude
  });

  return mapCart(updatedCart);
};

export const removeItemFromCart = async (sessionToken: string, productId: number) => {
  const cart = await prisma.cart.findFirst({
    where: { sessionToken }
  });

  if (!cart) {
    return getOrCreateCart(sessionToken);
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      productId: productId
    }
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude
  });

  return mapCart(updatedCart);
};
