import logger from "../lib/logger";
import prisma from "../lib/prisma";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from "./email.service";
import { getSettings } from "./settings.service";

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

// Note: tax and shipping are deliberately NOT part of this input. They are
// derived server-side from system settings inside prepareCheckout, so a client
// can never influence what it is charged.
export interface CreateOrderInput {
  userId: number;
  address: AddressInput;
  couponCode?: string;
  paymentMethod: "cod" | "razorpay";
  sessionToken?: string;
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
   const { userId, address, couponCode, paymentMethod, sessionToken } = input;

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

  // Tax and shipping come from server-side settings only — never from the
  // client — so the amount charged always matches the store's configuration.
  // Both default to 0, i.e. the listed price is the price paid.
  const settings = await getSettings();
  const taxAmount = subtotal * settings.tax_rate;
  const shippingCost =
    subtotal >= settings.shipping_limit ? 0 : settings.shipping_cost;

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

    // Step 5b: Generate a unique order number (retry until no collision —
    // a single retry could still collide under concurrent order creation)
    let orderNumber = generateOrderNumber();
    while (await tx.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

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

    // Step 7: Reduce stock for each product — conditioned on current stock so
    // two concurrent checkouts can't both decrement past zero (TOCTOU guard).
    for (const item of cart.items) {
      const stockUpdate = await tx.product.updateMany({
        where: { id: item.productId, stockQty: { gte: item.quantity } },
        data:  { stockQty: { decrement: item.quantity } },
      });
      if (stockUpdate.count === 0) {
        throw new Error(
          `"${item.product.name}" no longer has enough stock to fulfill this order.`
        );
      }
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

export const triggerOrderConfirmationEmail = async (orderId: number): Promise<void> => {
  try {
    const result = await prisma.order.updateMany({
      where: {
        id: orderId,
        confirmationEmailSentAt: null,
      },
      data: {
        confirmationEmailSentAt: new Date(),
      },
    });

    if (result.count === 1) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          user: true,
          shippingAddress: true,
        },
      });

      if (order && order.user?.email) {
        sendOrderConfirmationEmail({
          to: order.user.email,
          order,
        }).catch((err) => logger.error({ err: err }, "[OrderService] sendOrderConfirmationEmail background error"));
      }
    }
  } catch (error) {
    logger.error({ err: error }, "[OrderService] Error triggering order confirmation email");
  }
};

export const createOrder = async (input: CreateOrderInput) => {
  const { paymentMethod } = input;
  
  const checkout  = await prepareCheckout(input);
  const order = await finalizeOrder(checkout, input);

  if (paymentMethod === "cod") {
    triggerOrderConfirmationEmail(order.id).catch((err) =>
      logger.error({ err: err }, "[OrderService] COD confirmation email trigger error")
    );
  }

  return order;
};



// ─── Get Orders By User (customer view) ──────────────────────────────────────

export const getOrdersByUser = async (userId: number) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true, payment: true, shippingAddress: true, shipment: true },
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

// ─── Admin: List ALL orders (paginated — the table can grow unbounded) ────────

export const getAllOrdersAdmin = async (params: { page?: number; limit?: number } = {}) => {
  const page  = Math.max(1, params.page || 1);
  const limit = Math.min(200, Math.max(1, params.limit || 100));
  const skip  = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      include: {
        user:            { select: { id: true, firstName: true, lastName: true, email: true } },
        payment:         true,
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count(),
  ]);

  return {
    orders: orders.map((o) => ({
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
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
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

// ─── Cancellation ─────────────────────────────────────────────────────────────

/**
 * Statuses a customer may still cancel from. Mirrors the published Cancellation
 * & Refund Policy: cancellable up until the order is handed to the courier.
 */
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
];

export const isCancellable = (status: OrderStatus): boolean =>
  CANCELLABLE_STATUSES.includes(status);

/**
 * Cancels an order and reverses its side effects atomically: stock goes back on
 * the shelf and any coupon use is given back.
 *
 * Pass `userId` for a customer-initiated cancellation — the order must belong to
 * them. Omit it for an admin cancellation, which may cancel from any status.
 *
 * Money is deliberately NOT moved here. The payment row is left untouched, so
 * "a CANCELLED order whose payment is still PAID" is exactly the set of refunds
 * owed — no extra schema state needed. The gateway refund is issued separately
 * so no automated path can move real money on its own.
 */
export const cancelOrder = async (
  orderId: number,
  { userId, reason }: { userId?: number; reason?: string } = {}
) => {
  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true, payment: true },
    });

    if (!order) throw new Error("Order not found");

    // Customers may only touch their own orders. Report the same "not found"
    // as a missing order so this can't be used to probe which IDs exist.
    if (userId !== undefined && order.userId !== userId) {
      throw new Error("Order not found");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new Error("This order has already been cancelled.");
    }

    // Admins can cancel from any state (e.g. to reverse a mistaken dispatch);
    // customers are held to the published policy.
    if (userId !== undefined && !isCancellable(order.status)) {
      throw new Error(
        `This order can no longer be cancelled because it is already ${order.status.toLowerCase()}. Please contact support to arrange a return.`
      );
    }

    // Put the stock back — the checkout decremented it when the order was placed.
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data:  { stockQty: { increment: item.quantity } },
      });
    }

    // Give the coupon use back so the customer isn't charged a redemption for
    // an order that never happened.
    if (order.couponCode) {
      await tx.coupon.updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data:  { usedCount: { decrement: 1 } },
      });
    }

    // The payment row is intentionally left as-is. Marking it REFUNDED here
    // would record a refund that hasn't happened; leaving it PAID on a
    // CANCELLED order is what identifies a refund as owed.

    return tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        notes: reason
          ? `${order.notes ? `${order.notes}\n` : ""}Cancellation reason: ${reason}`
          : order.notes,
      },
      include: {
        user:            { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        items:           true,
        payment:         true,
        shippingAddress: true,
      },
    });
  });

  // Surfaced at warn level so refunds owed are greppable in the logs until
  // there's a proper admin refunds queue.
  if (cancelled.payment?.status === PaymentStatus.PAID) {
    logger.warn(
      {
        orderId: cancelled.id,
        orderNumber: cancelled.orderNumber,
        amount: Number(cancelled.totalAmount),
        gateway: cancelled.payment.gateway,
        gatewayPaymentId: cancelled.payment.gatewayPaymentId,
      },
      "REFUND REQUIRED: cancelled order had a captured payment"
    );
  }

  if (cancelled.user?.email) {
    sendOrderStatusEmail({
      to: cancelled.user.email,
      order: cancelled,
      newStatus: OrderStatus.CANCELLED,
    }).catch((err) => logger.error({ err }, "[OrderService] Cancellation email error"));
  }

  return mapOrder(cancelled);
};

// ─── Admin: Update order status ───────────────────────────────────────────────

export const updateOrderStatus = async (orderId: number, status: string) => {
  const validStatuses = Object.values(OrderStatus);
  if (!validStatuses.includes(status as OrderStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Cancelling has side effects — restock, coupon reversal, refund flagging —
  // so route it through cancelOrder rather than a bare status write. Previously
  // an admin cancel silently lost that stock forever.
  if (status === OrderStatus.CANCELLED) {
    return cancelOrder(orderId);
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

  if (order.user?.email) {
    sendOrderStatusEmail({
      to: order.user.email,
      order,
      newStatus: status
    }).catch((err) => logger.error({ err: err }, "[OrderService] Status email background error"));
  }

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
  shipment: order.shipment
    ? {
        carrier:       order.shipment.carrier,
        trackingNumber:order.shipment.trackingNumber,
        status:        order.shipment.status,
        shippedAt:     order.shipment.shippedAt,
        deliveredAt:   order.shipment.deliveredAt,
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

