"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.becomeMemberUser = exports.updateUserProfile = exports.getUserById = exports.loginUser = exports.registerUser = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("../generated/prisma/client");
// JWT_SECRET is guaranteed to be set — server.ts exits at startup if it isn't
const JWT_SECRET = process.env.JWT_SECRET;
const registerUser = async (data) => {
    const email = data.email.toLowerCase().trim();
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        throw new Error("Email is already registered");
    }
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(data.password, 10);
    // Only the very first registered user becomes ADMIN
    const userCount = await prisma_1.default.user.count();
    const role = userCount === 0 ? client_1.UserRole.ADMIN : client_1.UserRole.CUSTOMER;
    const user = await prisma_1.default.user.create({
        data: {
            email,
            passwordHash,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone || null,
            role,
            isMember: !!data.isMember
        }
    });
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
    }, JWT_SECRET, { expiresIn: "7d" });
    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            isMember: user.isMember
        },
        token
    };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    const email = data.email.toLowerCase().trim();
    const user = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    if (data.sessionToken) {
        const guestCart = await prisma_1.default.cart.findFirst({
            where: {
                sessionToken: data.sessionToken
            },
            include: {
                items: true
            }
        });
        if (guestCart) {
            const userCart = await prisma_1.default.cart.findFirst({
                where: {
                    userId: user.id
                },
                include: {
                    items: true
                }
            });
            if (!userCart) {
                // Link guest cart to user
                await prisma_1.default.cart.update({
                    where: {
                        id: guestCart.id
                    },
                    data: {
                        userId: user.id,
                        sessionToken: null
                    }
                });
            }
            else {
                // Merge guest cart items into user cart
                for (const guestItem of guestCart.items) {
                    const matchingUserItem = userCart.items.find((item) => item.productId === guestItem.productId);
                    if (matchingUserItem) {
                        // Combine quantities
                        await prisma_1.default.cartItem.update({
                            where: { id: matchingUserItem.id },
                            data: { quantity: matchingUserItem.quantity + guestItem.quantity }
                        });
                    }
                    else {
                        // Reassign guest item to the user's cart
                        await prisma_1.default.cartItem.update({
                            where: { id: guestItem.id },
                            data: { cartId: userCart.id }
                        });
                    }
                }
                // Delete guest cart
                await prisma_1.default.cart.delete({
                    where: { id: guestCart.id }
                });
            }
        }
    }
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
    }, JWT_SECRET, { expiresIn: "7d" });
    return {
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            isMember: user.isMember
        },
        token
    };
};
exports.loginUser = loginUser;
const getUserById = async (id) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id },
        include: {
            addresses: true
        }
    });
    if (!user)
        return null;
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.phone,
        isMember: user.isMember,
        addresses: user.addresses
    };
};
exports.getUserById = getUserById;
const updateUserProfile = async (id, data) => {
    const user = await prisma_1.default.user.update({
        where: { id },
        data: {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            phone: data.phone ? data.phone.trim() : null
        },
        include: {
            addresses: true
        }
    });
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.phone,
        isMember: user.isMember,
        addresses: user.addresses
    };
};
exports.updateUserProfile = updateUserProfile;
const becomeMemberUser = async (id) => {
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { isMember: true }
    });
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        phone: user.phone,
        isMember: user.isMember
    };
};
exports.becomeMemberUser = becomeMemberUser;
//# sourceMappingURL=auth.service.js.map