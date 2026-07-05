"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeItemFromCart = exports.addItemToCart = exports.getOrCreateCart = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
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
const mapCart = (cart) => {
    if (!cart)
        return null;
    return {
        id: cart.id,
        sessionToken: cart.sessionToken,
        userId: cart.userId,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        items: (cart.items || []).map((item) => {
            const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
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
const getOrCreateCart = async (sessionToken, userId) => {
    // If user is logged in, find cart by userId
    if (userId) {
        let cart = await prisma_1.default.cart.findFirst({
            where: { userId },
            include: cartInclude
        });
        // If no user cart exists, but they have a guest sessionToken,
        // link that guest cart to the user.
        if (!cart && sessionToken) {
            cart = await prisma_1.default.cart.findFirst({
                where: { sessionToken },
                include: cartInclude
            });
            if (cart) {
                cart = await prisma_1.default.cart.update({
                    where: { id: cart.id },
                    data: { userId, sessionToken: null },
                    include: cartInclude
                });
            }
        }
        // If still no cart, create a new one for the user
        if (!cart) {
            cart = await prisma_1.default.cart.create({
                data: { userId },
                include: cartInclude
            });
        }
        return mapCart(cart);
    }
    // Guest flow (no userId)
    let token = sessionToken;
    if (!token) {
        token = crypto_1.default.randomUUID();
        const cart = await prisma_1.default.cart.create({
            data: { sessionToken: token },
            include: cartInclude
        });
        return mapCart(cart);
    }
    let cart = await prisma_1.default.cart.findFirst({
        where: { sessionToken: token },
        include: cartInclude
    });
    if (!cart) {
        cart = await prisma_1.default.cart.create({
            data: { sessionToken: token },
            include: cartInclude
        });
    }
    return mapCart(cart);
};
exports.getOrCreateCart = getOrCreateCart;
const addItemToCart = async (sessionToken, userId, productId, quantity, relative = true) => {
    const cart = userId
        ? await prisma_1.default.cart.findFirst({ where: { userId } })
        : sessionToken
            ? await prisma_1.default.cart.findFirst({ where: { sessionToken } })
            : null;
    let targetCartId;
    if (!cart) {
        const newCart = userId
            ? await prisma_1.default.cart.create({ data: { userId } })
            : sessionToken
                ? await prisma_1.default.cart.create({ data: { sessionToken } })
                : (() => { throw new Error("sessionToken or userId is required"); })();
        targetCartId = newCart.id;
    }
    else {
        targetCartId = cart.id;
    }
    const product = await prisma_1.default.product.findUnique({
        where: { id: productId }
    });
    if (!product) {
        throw new Error("Product not found");
    }
    const existingItem = await prisma_1.default.cartItem.findFirst({
        where: {
            cartId: targetCartId,
            productId: productId
        }
    });
    if (existingItem) {
        const newQuantity = relative ? existingItem.quantity + quantity : quantity;
        if (newQuantity <= 0) {
            await prisma_1.default.cartItem.delete({
                where: { id: existingItem.id }
            });
        }
        else {
            await prisma_1.default.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: newQuantity,
                    unitPrice: product.price
                }
            });
        }
    }
    else if (quantity > 0) {
        await prisma_1.default.cartItem.create({
            data: {
                cartId: targetCartId,
                productId,
                quantity,
                unitPrice: product.price
            }
        });
    }
    const updatedCart = await prisma_1.default.cart.findUnique({
        where: { id: targetCartId },
        include: cartInclude
    });
    return mapCart(updatedCart);
};
exports.addItemToCart = addItemToCart;
const removeItemFromCart = async (sessionToken, userId, productId) => {
    const cart = userId
        ? await prisma_1.default.cart.findFirst({ where: { userId } })
        : sessionToken
            ? await prisma_1.default.cart.findFirst({ where: { sessionToken } })
            : null;
    if (!cart) {
        return (0, exports.getOrCreateCart)(sessionToken, userId);
    }
    await prisma_1.default.cartItem.deleteMany({
        where: {
            cartId: cart.id,
            productId: productId
        }
    });
    const updatedCart = await prisma_1.default.cart.findUnique({
        where: { id: cart.id },
        include: cartInclude
    });
    return mapCart(updatedCart);
};
exports.removeItemFromCart = removeItemFromCart;
//# sourceMappingURL=cart.service.js.map