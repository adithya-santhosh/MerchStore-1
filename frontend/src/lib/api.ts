import { Product } from "@/types/products";
import { getCookie } from "@/hooks/useAuth";

//const API_URL = import.meta.env.VITE_API_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/// This function will go to backend and fetch all the product info
export async function getProducts(params?: { category?: string; subCategory?: string; vehicle?: string; brand?: string }) :Promise<Product []>{
  const query = new URLSearchParams();
  if (params) {
    if (params.category) query.append("category", params.category);
    if (params.subCategory) query.append("subCategory", params.subCategory);
    if (params.vehicle) query.append("vehicle", params.vehicle);
    if (params.brand) query.append("brand", params.brand);
  }

  const url = `${API_URL}/api/products${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(
    url,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products");
  }

  return response.json();
}

// This is go to backend and fetch the products according to the category 

export async function getProductByCategory(category:string) :Promise<Product[]> {
  const response = await fetch(
    `${API_URL}/api/products?category=${encodeURIComponent(category)}`,
    {
      cache: "no-store"
    }
  );

  if (!response.ok){
    throw new Error("Failed to Fetch the product by category.");
  }
  return response.json();
}

// This is to get product according to the id number

export async function getProductById(id:string) :Promise<Product>{
  const response = await fetch(
    `${API_URL}/api/products/${id}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  return response.json();
}

export async function deleteProduct(id: number) {
  const token = getCookie("token");
  const response = await fetch(
    `${API_URL}/api/products/${id}`,
    {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
}

export async function createProduct(product: Omit<Product,"id" | "createdAt" |"updatedAt">){
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products`,{
    method :"POST",
    headers : {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body : JSON.stringify(product),
  });
  if (!response.ok){
    throw new Error("Failed to create the product");
  }
  return response.json();
}

export async function updateProduct(id: string | number, product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error("Failed to update the product");
  }

  return response.json();
}

export async function getSubCategories(category: string): Promise<string[]> {
  const response = await fetch(
    `${API_URL}/api/products/subcategories/${encodeURIComponent(category)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch subcategories");
  }

  return response.json();
}

export async function getProductBySubCategory(subCategory: string): Promise<Product[]> {
  const response = await fetch(
    `${API_URL}/api/products?subCategory=${encodeURIComponent(subCategory)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to Fetch the product by subcategory.");
  }
  return response.json();
}

export async function getProductsBySubCategory(category: string):Promise<Product []> { 
  const response = await fetch(
    `${API_URL}/api/products?subCategory=${encodeURIComponent(category)}`,
      {
        cache:"no-store"
      }
    );
  
    if (!response.ok){
      throw new Error("Failed to Fetch the Products using Sub categories");
    }
    return response.json();
}

export interface NavCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  children: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
  }[];
}

export interface NavBrand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
}

export interface NavVehicle {
  id: number;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number | null;
  bodyType: string | null;
  engineType: string | null;
}

export interface NavMetadata {
  categories: NavCategory[];
  brands: NavBrand[];
  vehicles: NavVehicle[];
}

export async function getNavigationMetadata(): Promise<NavMetadata> {
  const response = await fetch(`${API_URL}/api/products/navigation/metadata`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch navigation metadata");
  }

  return response.json();
}

// ─── Order API Helpers ────────────────────────────────────────────────────────

export interface OrderAddress {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

export interface CreateOrderPayload {
  address: OrderAddress;
  couponCode?: string;
  paymentMethod: "cod" | "razorpay";
  sessionToken?: string;
  taxRate: number;
  shippingCost: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  createdAt: string;
  shippingAddress: OrderAddress & { id: number };
  payment: {
    gateway: string;
    amount: number;
    status: string;
    paidAt: string | null;
  } | null;
  items: OrderItem[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to place order");
  }

  return response.json();
}

// ─── Admin Order API Helpers ──────────────────────────────────────────────────

export interface AdminOrderRow {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  payment: { gateway: string; status: string } | null;
}

export interface AdminOrderDetail {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
  couponCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  shippingAddress: {
    id: number;
    label: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  payment: {
    gateway: string;
    amount: number;
    status: string;
    paidAt: string | null;
  } | null;
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
  items: {
    id: number;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl: string | null;
  }[];
}

export async function getAllOrders(): Promise<AdminOrderRow[]> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/all`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export async function getAdminOrderById(id: number): Promise<AdminOrderDetail> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/${id}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch order");
  return response.json();
}

export async function updateAdminOrderStatus(id: number, status: string): Promise<void> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update status");
  }
}
export async function getOrderById(id: number): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch order");
  }

  return response.json();
}
