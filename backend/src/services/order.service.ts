import prisma from "../lib/prisma";
import { OrderStatus, PaymentStatus, Prisma } from "../generated/prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressInput {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface CreateOrderInput {
  userId: number;
  address: AddressInput;
  couponCode?: string;
  paymentMethod: "cod" | "razorpay";
  sessionToken?: string;
  taxRate: number;
  shippingCost: number;
}

export type PreparedCheckout = {
    cart: Prisma.CartGetPayload<{ include: { items: { include: { product: true } } } }>
    subtotal: number
    discountAmount: number
    resolvedCouponCode?: string | undefined
    taxAmount: number
    shippingCost: number
    totalAmount: number
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${year}-${rand}`;
};

export const prepareCheckout = async (input: CreateOrderInput) => {
   const { userId, address, couponCode, paymentMethod, sessionToken, taxRate, shippingCost } = input;

    // ── Step 1: Validate input ────────────────────────────────────────────────
  if (!address.addressLine1?.trim()) throw new Error("Shipping address is required.");
  if (!address.city?.trim())         throw new Error("City is required.");
  if (!address.state?.trim())        throw new Error("State is required.");
  if (!address.postalCode?.trim())   throw new Error("Postal code is required.");
  if (!["cod", "razorpay"].includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }
   
  // ── Step 2: Fetch products (via cart) ────────────────────────────────────
  const cart = userId
    ? await prisma.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: true } } },
      })
    : sessionToken
      ? await prisma.cart.findFirst({
          where: { sessionToken },
          include: { items: { include: { product: true } } },
        })
      : null;

  if (!cart || cart.items.length === 0) {
    throw new Error("Your cart is empty. Add items before placing an order.");
  }
    // Ensure every product still exists
  for (const item of cart.items) {
    if (!item.product) {
      throw new Error(`A product in your cart no longer exists (ID: ${item.productId}).`);
    }
    if (!item.product.isActive) {
      throw new Error(`"${item.product.name}" is no longer available.`);
    }
  }

  // ── Step 3: Calculate totals ──────────────────────────────────────────────
  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  // Coupon discount
  let discountAmount = 0;
  let resolvedCouponCode: string | undefined;
  if (couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: couponCode.toUpperCase(), isActive: true },
    });
    if (coupon) {
      const notExpired = !coupon.expiresAt || coupon.expiresAt > new Date();
      const hasUses    = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
      const meetsMin   = !coupon.minOrderAmount || subtotal >= Number(coupon.minOrderAmount);
      if (notExpired && hasUses && meetsMin) {
        discountAmount =
          coupon.type === "percent"
            ? subtotal * (Number(coupon.value) / 100)
            : Number(coupon.value);
        resolvedCouponCode = coupon.code;
      }
    }
  }

  const taxAmount   = subtotal * taxRate;
  const totalAmount = Math.max(0, subtotal + shippingCost + taxAmount - discountAmount);

  // ── Step 4: Check inventory ───────────────────────────────────────────────
  for (const item of cart.items) {
    if (item.product.stockQty < item.quantity) {
      throw new Error(
        `"${item.product.name}" only has ${item.product.stockQty} unit(s) in stock, but you requested ${item.quantity}.`
      );
    }
  }

  return {
    cart,
    subtotal,
    discountAmount,
    resolvedCouponCode,
    taxAmount,
    shippingCost,
    totalAmount,
  };

}


export interface PaymentDetails {
  status?: PaymentStatus;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  gatewaySignature?: string;
}

export const finalizeOrder = async (
  checkout: PreparedCheckout,
  input: CreateOrderInput,
  paymentDetails?: PaymentDetails
) => {

  const { userId, address, paymentMethod } = input;

  const {
    cart,
    subtotal,
    discountAmount,
    resolvedCouponCode,
    taxAmount,
    shippingCost,
    totalAmount,
  } = checkout;

  const order = await prisma.$transaction(async (tx) => {

    // Step 5a: Persist shipping address
    const savedAddress = await tx.address.create({
      data: {
        userId,
        label:        address.label || "Shipping",
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || null,
        city:         address.city,
        state:        address.state,
        postalCode:   address.postalCode,
        country:      address.country || "IN",
      },
    });

    // Step 5b: Generate a unique order number
    let orderNumber = generateOrderNumber();
    const collision = await tx.order.findUnique({ where: { orderNumber } });
    if (collision) orderNumber = generateOrderNumber();

    // Step 5c + 6: Create order with nested order items in one write
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        status:           OrderStatus.PENDING,
        shippingAddressId: savedAddress.id,
        subtotal,
        discountAmount,
        shippingCost,
        taxAmount,
        totalAmount,
        couponCode: resolvedCouponCode || null,
        // Step 6: Create order items
        items: {
          create: cart.items.map((item) => ({
            productId:   item.productId,
            productName: item.product.name,
            quantity:    item.quantity,
            unitPrice:   item.unitPrice,
            totalPrice:  Number(item.unitPrice) * item.quantity,
          })),
        },
        payment: {
          create: {
            gateway:          paymentMethod,
            amount:           totalAmount,
            currency:         "INR",
            status:           paymentDetails?.status || PaymentStatus.PENDING,
            gatewayOrderId:   paymentDetails?.gatewayOrderId || null,
            gatewayPaymentId: paymentDetails?.gatewayPaymentId || null,
            gatewaySignature: paymentDetails?.gatewaySignature || null,
            paidAt:           paymentDetails?.status === PaymentStatus.PAID ? new Date() : null,
          },
        },
      },
      include: {
        items:           true,
        payment:         true,
        shippingAddress: true,
      },
    });

    // Step 7: Reduce stock for each product
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stockQty: { decrement: item.quantity } },
      });
    }

    // Bonus: Increment coupon usage counter
    if (resolvedCouponCode) {
      await tx.coupon.update({
        where: { code: resolvedCouponCode },
        data:  { usedCount: { increment: 1 } },
      });
    }

    // Clear cart items after successful order
    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  // ── Step 8: Return order ──────────────────────────────────────────────────
  return mapOrder(order);
}

export const createOrder = async (input: CreateOrderInput) => {
  const { userId, address, paymentMethod } = input;
  
  const checkout  = await prepareCheckout(input);

  return await finalizeOrder(checkout, input);

};



// ─── Get Orders By User (customer view) ──────────────────────────────────────

export const getOrdersByUser = async (userId: number) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true, payment: true, shippingAddress: true },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(mapOrder);
};

// ─── Get Single Order (customer view – scoped to userId) ─────────────────────

export const getOrderById = async (orderId: number, userId: number) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items:           { include: { product: { include: { images: true } } } },
      payment:         true,
      shippingAddress: true,
    },
  });
  if (!order) throw new Error("Order not found");
  return mapOrderDetail(order);
};

// ─── Admin: List ALL orders ───────────────────────────────────────────────────

export const getAllOrdersAdmin = async () => {
  const orders = await prisma.order.findMany({
    include: {
      user:            { select: { id: true, firstName: true, lastName: true, email: true } },
      payment:         true,
      shippingAddress: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return orders.map((o) => ({
    id:          o.id,
    orderNumber: o.orderNumber,
    status:      o.status,
    totalAmount: Number(o.totalAmount),
    createdAt:   o.createdAt,
    customer: {
      id:        o.user.id,
      name:      `${o.user.firstName} ${o.user.lastName}`.trim(),
      email:     o.user.email,
    },
    payment: o.payment
      ? { gateway: o.payment.gateway, status: o.payment.status }
      : null,
  }));
};

// ─── Admin: Get single order (full detail, not scoped to userId) ──────────────

export const getOrderByIdAdmin = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user:            { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      items:           { include: { product: { include: { images: true } } } },
      payment:         true,
      shippingAddress: true,
      shipment:        true,
    },
  });
  if (!order) throw new Error("Order not found");

  return {
    id:            order.id,
    orderNumber:   order.orderNumber,
    status:        order.status,
    subtotal:      Number(order.subtotal),
    discountAmount:Number(order.discountAmount),
    shippingCost:  Number(order.shippingCost),
    taxAmount:     Number(order.taxAmount),
    totalAmount:   Number(order.totalAmount),
    couponCode:    order.couponCode,
    notes:         order.notes,
    createdAt:     order.createdAt,
    updatedAt:     order.updatedAt,
    customer: {
      id:        order.user.id,
      name:      `${order.user.firstName} ${order.user.lastName}`.trim(),
      email:     order.user.email,
      phone:     order.user.phone,
    },
    shippingAddress: order.shippingAddress,
    payment: order.payment
      ? {
          gateway:  order.payment.gateway,
          amount:   Number(order.payment.amount),
          status:   order.payment.status,
          paidAt:   order.payment.paidAt,
        }
      : null,
    shipment: order.shipment || null,
    items: order.items.map((item) => {
      const primaryImage =
        item.product?.images?.find((img) => img.isPrimary) || item.product?.images?.[0];
      return {
        id:          item.id,
        productId:   item.productId,
        productName: item.productName,
        quantity:    item.quantity,
        unitPrice:   Number(item.unitPrice),
        totalPrice:  Number(item.totalPrice),
        imageUrl:    primaryImage?.imageUrl || null,
      };
    }),
  };
};

// ─── Admin: Update order status ───────────────────────────────────────────────

export const updateOrderStatus = async (orderId: number, status: string) => {
  const validStatuses = Object.values(OrderStatus);
  if (!validStatuses.includes(status as OrderStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }
  const order = await prisma.order.update({
    where: { id: orderId },
    data:  { status: status as OrderStatus },
    include: {
      user:            { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      items:           true,
      payment:         true,
      shippingAddress: true,
    },
  });
  return order;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

const mapOrder = (order: any) => ({
  id:            order.id,
  orderNumber:   order.orderNumber,
  status:        order.status,
  subtotal:      Number(order.subtotal),
  discountAmount:Number(order.discountAmount),
  shippingCost:  Number(order.shippingCost),
  taxAmount:     Number(order.taxAmount),
  totalAmount:   Number(order.totalAmount),
  couponCode:    order.couponCode,
  createdAt:     order.createdAt,
  updatedAt:     order.updatedAt,
  shippingAddress: order.shippingAddress,
  payment: order.payment
    ? {
        gateway: order.payment.gateway,
        amount:  Number(order.payment.amount),
        status:  order.payment.status,
        paidAt:  order.payment.paidAt,
      }
    : null,
  items: (order.items || []).map((item: any) => ({
    id:          item.id,
    productId:   item.productId,
    productName: item.productName,
    quantity:    item.quantity,
    unitPrice:   Number(item.unitPrice),
    totalPrice:  Number(item.totalPrice),
  })),
});

const mapOrderDetail = (order: any) => {
  const base = mapOrder(order);
  return {
    ...base,
    items: (order.items || []).map((item: any) => {
      const primaryImage =
        item.product?.images?.find((img: any) => img.isPrimary) || item.product?.images?.[0];
      return {
        id:          item.id,
        productId:   item.productId,
        productName: item.productName,
        quantity:    item.quantity,
        unitPrice:   Number(item.unitPrice),
        totalPrice:  Number(item.totalPrice),
        imageUrl:    primaryImage?.imageUrl || null,
      };
    }),
  };
};

