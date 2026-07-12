import prisma from "../lib/prisma";

// ─── Get vendor profile for a given user ID ───────────────────────────────────
export const getVendorByUserId = async (userId: number) => {
  return prisma.vendor.findUnique({
    where: { userId },
    include: { products: { select: { id: true } } }
  });
};

// ─── Get orders scoped to a vendor's products ─────────────────────────────────
export const getVendorOrders = async (vendorId: number) => {
  // First get the product IDs for this vendor
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { products: { select: { id: true } } }
  });

  if (!vendor) return [];

  const productIds = vendor.products.map(p => p.id);
  if (productIds.length === 0) return [];

  // Find all orders that contain at least one of the vendor's products
  const orders = await prisma.order.findMany({
    where: {
      items: {
        some: {
          productId: { in: productIds }
        }
      }
    },
    include: {
      items: {
        where: { productId: { in: productIds } },
        include: {
          product: {
            select: { id: true, name: true, images: { where: { isPrimary: true }, take: 1 } }
          }
        }
      },
      shipment: true,
      shippingAddress: true,
      user: {
        select: { firstName: true, lastName: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt,
    customer: {
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      email: order.user.email
    },
    shippingAddress: order.shippingAddress,
    items: order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      imageUrl: item.product?.images?.[0]?.imageUrl ?? null
    })),
    shipment: order.shipment ? {
      carrier: order.shipment.carrier,
      trackingNumber: order.shipment.trackingNumber,
      status: order.shipment.status,
      shippedAt: order.shipment.shippedAt,
      deliveredAt: order.shipment.deliveredAt
    } : null
  }));
};

// ─── Submit shipment info for an order ───────────────────────────────────────
export const submitVendorShipment = async (
  vendorId: number,
  orderId: number,
  data: { carrier: string; trackingNumber: string }
) => {
  // Security: verify the order actually contains this vendor's products
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    include: { products: { select: { id: true } } }
  });

  if (!vendor) throw new Error("Vendor not found");

  const productIds = vendor.products.map(p => p.id);

  const orderItem = await prisma.orderItem.findFirst({
    where: { orderId, productId: { in: productIds } }
  });

  if (!orderItem) throw new Error("Order does not belong to this vendor");

  // Upsert the shipment record
  const shipment = await prisma.shipment.upsert({
    where: { orderId },
    create: {
      orderId,
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: "SHIPPED",
      shippedAt: new Date()
    },
    update: {
      carrier: data.carrier,
      trackingNumber: data.trackingNumber,
      status: "SHIPPED",
      shippedAt: new Date()
    }
  });

  // Update order status to SHIPPED
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "SHIPPED" }
  });

  return shipment;
};

// ─── Admin: Create a vendor account ──────────────────────────────────────────
export const createVendor = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}) => {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: "VENDOR",
      emailVerified: true,
      vendor: {
        create: { companyName: data.companyName }
      }
    },
    include: { vendor: true }
  });

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyName: user.vendor?.companyName,
    vendorId: user.vendor?.id
  };
};

// ─── Admin: List all vendors ──────────────────────────────────────────────────
export const getAllVendors = async () => {
  const vendors = await prisma.vendor.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      products: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return vendors.map(v => ({
    id: v.id,
    companyName: v.companyName,
    userId: v.userId,
    email: v.user.email,
    firstName: v.user.firstName,
    lastName: v.user.lastName,
    productCount: v.products.length,
    products: v.products
  }));
};

// ─── Admin: Assign product to vendor ─────────────────────────────────────────
export const assignProductToVendor = async (productId: number, vendorId: number | null) => {
  return prisma.product.update({
    where: { id: productId },
    data: { vendorId }
  });
};
