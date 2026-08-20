import { Product } from "@/types/products";
import { getCookie } from "@/utils/cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
      credentials: "include",
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
    credentials: "include",
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
    credentials: "include",
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

// ─── Search Products (with filters, sort, pagination) ─────────────────────────

export interface SearchProductsParams {
  search?: string;
  category?: string;
  brand?: string;
  vehicle?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export interface SearchAggregations {
  brands: { id: number; name: string; slug: string }[];
  categories: { id: number; name: string; slug: string; parentName: string | null }[];
  priceRange: { min: number; max: number };
}

export interface SearchProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations: SearchAggregations;
}

export async function searchProducts(params: SearchProductsParams): Promise<SearchProductsResult> {
  const query = new URLSearchParams();

  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.brand) query.append("brand", params.brand);
  if (params.vehicle) query.append("vehicle", params.vehicle);
  if (params.productType) query.append("productType", params.productType);
  if (params.minPrice !== undefined) query.append("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.append("maxPrice", String(params.maxPrice));
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.page) query.append("page", String(params.page));
  if (params.limit) query.append("limit", String(params.limit));

  const response = await fetch(
    `${API_URL}/api/products/search${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to search products");
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
  try {
    const response = await fetch(`${API_URL}/api/products/navigation/metadata`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("Failed to fetch navigation metadata, returning fallback empty metadata.");
      return { categories: [], brands: [], vehicles: [] };
    }

    return await response.json();
  } catch (error) {
    console.error("Network error fetching navigation metadata:", error);
    return { categories: [], brands: [], vehicles: [] };
  }
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
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
  items: OrderItem[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders`, {
    method: "POST",
    credentials: "include",
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

export interface CreatePaymentOrderPayload {
  address: OrderAddress;
  couponCode?: string;
  sessionToken?: string;
  taxRate: number;
  shippingCost: number;
}

export interface RazorpayOrderResponse {
  key: string;
  orderId: string;
  amount: number;
  currency: string;
  receipt: string;
}

export async function createPaymentOrder(payload: CreatePaymentOrderPayload): Promise<RazorpayOrderResponse> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/payment/create-order`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to create payment order");
  }

  return response.json();
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  address: OrderAddress;
  couponCode?: string;
  sessionToken?: string;
  taxRate: number;
  shippingCost: number;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/payment/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to verify payment");
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

export interface AdminOrdersResponse {
  orders: AdminOrderRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllOrders(params: { page?: number; limit?: number } = {}): Promise<AdminOrdersResponse> {
  const token = getCookie("token");
  const query = new URLSearchParams();
  // The admin orders page currently loads everything and filters client-side,
  // so default to a generous page size until it grows real pagination controls.
  query.append("limit", String(params.limit ?? 200));
  if (params.page) query.append("page", String(params.page));

  const response = await fetch(`${API_URL}/api/orders/admin/all?${query.toString()}`, {
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
}

export async function getAdminOrderById(id: number): Promise<AdminOrderDetail> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/${id}`, {
    credentials: "include",
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
    credentials: "include",
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
    credentials: "include",
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

// ─── Admin Products API ──────────────────────────────────────────────────────

export interface AdminProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  outOfStock: number;
  lowStock: number;
}

export async function getAdminProducts(params: {
  page?: string | number;
  limit?: string | number;
  search?: string;
  category?: string;
  status?: string;
  stock?: string;
  sortBy?: string;
  sortOrder?: string;
}, token?: string): Promise<AdminProductsResponse> {
  const finalToken = token || getCookie("token");
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, String(value));
  });
  const response = await fetch(
    `${API_URL}/api/products/admin?${query.toString()}`,
    {
      credentials: "include",
      headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch admin products");
  return response.json();
}

export async function getProductStats(token?: string): Promise<ProductStats> {
  const finalToken = token || getCookie("token");
  const response = await fetch(`${API_URL}/api/products/admin/stats`, {
    credentials: "include",
    headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch product stats");
  return response.json();
}

export async function bulkUpdateProducts(
  ids: number[],
  action: "activate" | "deactivate" | "delete"
): Promise<{ affected: number; action: string }> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products/admin/bulk`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ids, action }),
  });
  if (!response.ok) throw new Error("Failed to bulk update products");
  return response.json();
}

// ─── Admin Customers API ─────────────────────────────────────────────────────

export interface AdminCustomerRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalReviews: number;
  totalWishlist: number;
  totalSpent: number;
}

export interface AdminCustomersResponse {
  customers: AdminCustomerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerStats {
  totalCustomers: number;
  newThisMonth: number;
  totalAdmins: number;
  customersWithOrders: number;
}

export interface AdminCustomerDetail {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  totalOrders: number;
  totalReviews: number;
  totalWishlist: number;
  totalSpent: number;
  addresses: {
    id: number;
    label: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }[];
  recentOrders: {
    id: number;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    itemCount: number;
    payment: { gateway: string; status: string } | null;
  }[];
}

export async function getAdminCustomers(params: {
  page?: string | number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}, token?: string): Promise<AdminCustomersResponse> {
  const finalToken = token || getCookie("token");
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, String(value));
  });
  const response = await fetch(
    `${API_URL}/api/customers/admin?${query.toString()}`,
    {
      credentials: "include",
      headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
      cache: "no-store",
    }
  );
  if (!response.ok) throw new Error("Failed to fetch customers");
  return response.json();
}

export async function getAdminCustomerById(
  id: number,
  token?: string
): Promise<AdminCustomerDetail> {
  const finalToken = token || getCookie("token");
  const response = await fetch(`${API_URL}/api/customers/admin/${id}`, {
    credentials: "include",
    headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch customer");
  return response.json();
}

export async function getCustomerStatsApi(token?: string): Promise<CustomerStats> {
  const finalToken = token || getCookie("token");
  const response = await fetch(`${API_URL}/api/customers/admin/stats`, {
    credentials: "include",
    headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch customer stats");
  return response.json();
}

// ─── Dashboard / Analytics API ───────────────────────────────────────────────

export interface DashboardData {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    averageOrderValue: number;
  };
  revenueChart: { date: string; revenue: number; orderCount: number }[];
  topProducts: {
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    imageUrl: string | null;
  }[];
  recentOrders: AdminOrderRow[];
  statusBreakdown: Record<string, number>;
}

export async function getDashboardData(
  days?: number,
  token?: string
): Promise<DashboardData> {
  const finalToken = token || getCookie("token");
  const query = days ? `?days=${days}` : "";
  const response = await fetch(`${API_URL}/api/analytics/dashboard${query}`, {
    credentials: "include",
    headers: { ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard data");
  return response.json();
}

export async function getMyOrders(token?: string): Promise<Order[]> {
  const finalToken = token || getCookie("token");
  const response = await fetch(`${API_URL}/api/orders`, {
    credentials: "include",
    headers: {
      ...(finalToken ? { Authorization: `Bearer ${finalToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch order history");
  }

  return response.json();
}

export async function updateProfile(payload: { firstName: string; lastName: string; phone?: string | null }): Promise<any> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to update profile");
  }

  return response.json();
}

// ─── Review API Helpers ───────────────────────────────────────────────────────

export interface ReviewUser {
  id: number;
  firstName: string;
  lastInitial: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
  user: ReviewUser;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>;
}

export async function getProductReviews(productId: number): Promise<Review[]> {
  const response = await fetch(`${API_URL}/api/reviews/${productId}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch reviews");
  return response.json();
}

export async function getReviewStats(productId: number): Promise<ReviewStats> {
  const response = await fetch(`${API_URL}/api/reviews/${productId}/stats`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch review stats");
  return response.json();
}

export async function getMyReview(productId: number): Promise<Review | null> {
  // No client-readable token to gate on (HttpOnly cookie) — just ask the
  // backend and treat a non-OK response (401/404) as "no review yet".
  const response = await fetch(`${API_URL}/api/reviews/${productId}/mine`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return null;
  return response.json();
}

export async function submitReview(
  productId: number,
  data: { rating: number; title?: string; body?: string }
): Promise<Review> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/reviews/${productId}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to submit review");
  }
  return response.json();
}

export async function deleteReviewApi(reviewId: number): Promise<void> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/reviews/${reviewId}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || "Failed to delete review");
  }
}

// ─── Wishlist API Helpers ─────────────────────────────────────────────────────

export interface WishlistProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  ImageURL: string | null;
  category: string;
  isActive: boolean;
  stockQty: number;
  brand: string | null;
}

export interface WishlistItem {
  id: number;
  addedAt: string;
  product: WishlistProduct;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  // No client-readable token to gate on (HttpOnly cookie) — a 401 just
  // means "not logged in", handled the same as an empty wishlist.
  const response = await fetch(`${API_URL}/api/wishlist`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json();
}

export async function getWishlistIds(): Promise<number[]> {
  const response = await fetch(`${API_URL}/api/wishlist/ids`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) return [];
  return response.json();
}

export async function addToWishlistApi(productId: number): Promise<void> {
  await fetch(`${API_URL}/api/wishlist/${productId}`, {
    method: "POST",
    credentials: "include",
  });
}

export async function removeFromWishlistApi(productId: number): Promise<void> {
  await fetch(`${API_URL}/api/wishlist/${productId}`, {
    method: "DELETE",
    credentials: "include",
  });
}

// ─── Vendor API ────────────────────────────────────────────────────────────────
export async function getVendorOrders(): Promise<any[]> {
  const token = getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/orders`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("Failed to fetch vendor orders");
  return res.json();
}

export async function submitVendorShipment(orderId: number, data: { carrier: string; trackingNumber: string }): Promise<any> {
  const token = getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/orders/${orderId}/ship`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit shipment details");
  return res.json();
}

export interface AdminVendorsResponse {
  vendors: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getAllVendors(
  token?: string,
  params: { page?: number; limit?: number } = {}
): Promise<AdminVendorsResponse> {
  const authToken = token || getCookie("token");
  const query = new URLSearchParams();
  // The admin vendors page currently loads everything (no pagination UI yet),
  // so default to a generous page size until it grows real pagination controls.
  query.append("limit", String(params.limit ?? 200));
  if (params.page) query.append("page", String(params.page));

  const res = await fetch(`${API_URL}/api/vendors?${query.toString()}`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
  });
  if (!res.ok) throw new Error("Failed to fetch vendors");
  return res.json();
}

export async function createVendorAccount(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
}, token?: string): Promise<any> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create vendor");
  }
  return res.json();
}

export async function assignProductVendor(productId: number, vendorId: number | null, token?: string): Promise<any> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/products/${productId}/assign`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify({ vendorId }),
  });
  if (!res.ok) throw new Error("Failed to assign vendor");
  return res.json();
}

export async function purchaseMembershipRazorpay(userToken?: string): Promise<any> {
  // No client-readable token to pre-check (HttpOnly cookie) — the create-order
  // call below will fail with 401 if the user isn't actually logged in.

  // 1. Load Razorpay script if not already loaded
  if (typeof window !== "undefined" && !(window as any).Razorpay) {
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = resolve;
      script.onerror = () => reject(new Error("Failed to load Razorpay payment SDK."));
      document.body.appendChild(script);
    });
  }

  // 2. Create membership order on backend
  const response = await fetch(`${API_URL}/api/payment/create-membership-order`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
    },
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.message || "Failed to create membership order.");
  }

  const orderData = await response.json();

  // 3. Open Razorpay popup
  return new Promise((resolve, reject) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "MerchStore VIP Membership",
      description: `One-Time Membership Joining Fee (₹${orderData.membershipFee})`,
      order_id: orderData.orderId,
      handler: async function (paymentResponse: any) {
        try {
          const verifyRes = await fetch(`${API_URL}/api/payment/verify-membership`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
            },
            body: JSON.stringify({
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            }),
          });

          if (!verifyRes.ok) {
            const errData = await verifyRes.json();
            throw new Error(errData.message || "Membership payment verification failed.");
          }

          const updatedUser = await verifyRes.json();
          resolve(updatedUser);
        } catch (err) {
          reject(err);
        }
      },
      theme: {
        color: "#0ea5e9",
      },
      modal: {
        ondismiss: function () {
          reject(new Error("Membership payment cancelled."));
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on("payment.failed", function (response: any) {
      reject(new Error(response.error?.description || "Membership payment failed."));
    });
    rzp.open();
  });
}

export async function changePasswordAPI(currentPassword: string, newPassword: string, token?: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to change password");
  }

  return res.json();
}


