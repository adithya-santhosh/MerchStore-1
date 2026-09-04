import { Product, type ProductWritePayload } from "@/types/products";
import { getCookie, getCsrfHeader } from "@/utils/cookie";
import { ApiValidationError, type ApiFieldError } from "@/lib/errors";
import type { RazorpaySuccessResponse, RazorpayFailureResponse } from "@/types/razorpay";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Turns a failed response into the Error to throw.
 *
 * A 422 from the API's `validate()` middleware carries a field-level `errors`
 * array; that becomes an `ApiValidationError` so a form can point at the
 * offending inputs. Everything else falls back to the API's own `message`, then
 * to the caller's wording.
 */
async function apiError(res: Response, fallback: string): Promise<Error> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // A 500 behind a proxy often has an HTML or empty body.
    return new Error(fallback);
  }

  const raw = (body ?? {}) as { message?: unknown; errors?: unknown };

  const fieldErrors: ApiFieldError[] = Array.isArray(raw.errors)
    ? raw.errors
        .filter(
          (e): e is { field?: unknown; message: string } =>
            typeof e === "object" &&
            e !== null &&
            typeof (e as { message?: unknown }).message === "string" &&
            (e as { message: string }).message !== ""
        )
        .map((e) => ({ field: String(e.field ?? ""), message: e.message }))
    : [];

  const message = typeof raw.message === "string" && raw.message ? raw.message : fallback;

  return fieldErrors.length > 0
    ? new ApiValidationError(fieldErrors, message)
    : new Error(message);
}

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
        ...getCsrfHeader(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
}

export interface UploadSignature {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  allowedFormats: string;
}

/** Admin-only, short-lived Cloudinary upload credentials — see uploadToCloudinary in lib/utils.ts. */
export async function getUploadSignature(): Promise<UploadSignature> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products/admin/upload-signature`, {
    credentials: "include",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw await apiError(response, "Failed to prepare image upload");
  }
  return response.json();
}

export async function createProduct(product: ProductWritePayload){
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products`,{
    method :"POST",
    credentials: "include",
    headers : {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body : JSON.stringify(product),
  });
  if (!response.ok){
    throw await apiError(response, "Failed to create the product");
  }
  return response.json();
}

export async function updateProduct(id: string | number, product: ProductWritePayload) {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw await apiError(response, "Failed to update the product");
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

// ─── Vendor Types ─────────────────────────────────────────────────────────────

export interface Vendor {
  id: number;
  companyName: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  productCount: number;
  products: { id: number; name: string }[];
}

export interface VendorOrder {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string;
  customer: { firstName: string; lastName: string; email: string };
  shippingAddress: OrderAddress & { id: number };
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string | null;
  }[];
  shipment: {
    carrier: string | null;
    trackingNumber: string | null;
    status: string;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
}

/** A saved delivery address on a user account. */
export interface UserAddress {
  id: number;
  label?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

/** The signed-in user as returned by the auth endpoints. */
export interface AuthUserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  phone?: string | null;
  isMember?: boolean;
  emailVerified?: boolean;
  addresses?: UserAddress[];
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

// Tax and shipping are computed server-side from store settings — the client
// never sends money-related values.
export interface CreateOrderPayload {
  address: OrderAddress;
  couponCode?: string;
  paymentMethod: "cod" | "razorpay";
  sessionToken?: string;
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
      ...getCsrfHeader(),
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
      ...getCsrfHeader(),
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
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/payment/verify`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
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
    gatewayPaymentId?: string | null;
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

/**
 * The API returns order status as the Prisma enum spells it — uppercase. Every
 * screen in this app compares against lowercase literals, which is why the
 * admin list's stat tiles read 0 and its status filter matched nothing, and why
 * `dashboard/page.tsx` had already sprinkled `.toLowerCase()` at its call
 * sites. Normalising once here means callers can rely on one casing instead of
 * each remembering to defend against it.
 */
const toClientStatus = <T extends { status: string }>(o: T): T => ({
  ...o,
  status: o.status?.toLowerCase() ?? o.status,
});

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
  const data: AdminOrdersResponse = await response.json();
  return { ...data, orders: (data.orders ?? []).map(toClientStatus) };
}

export async function getAdminOrderById(id: number): Promise<AdminOrderDetail> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/${id}`, {
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch order");
  return toClientStatus(await response.json());
}

export async function updateAdminOrderStatus(id: number, status: string): Promise<void> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/admin/${id}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
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
      ...getCsrfHeader(),
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

export async function updateProfile(payload: { firstName: string; lastName: string; phone?: string | null }): Promise<AuthUserProfile> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/auth/profile`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
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
      ...getCsrfHeader(),
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
      ...getCsrfHeader(),
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
    headers: { ...getCsrfHeader() },
  });
}

export async function removeFromWishlistApi(productId: number): Promise<void> {
  await fetch(`${API_URL}/api/wishlist/${productId}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...getCsrfHeader() },
  });
}

// ─── Vendor API ────────────────────────────────────────────────────────────────
export async function getVendorOrders(): Promise<VendorOrder[]> {
  const token = getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/orders`, {
    cache: "no-store",
    credentials: "include",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) throw new Error("Failed to fetch vendor orders");
  return res.json();
}

export async function submitVendorShipment(orderId: number, data: { carrier: string; trackingNumber: string }): Promise<{ message: string }> {
  const token = getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/orders/${orderId}/ship`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit shipment details");
  return res.json();
}

export interface AdminVendorsResponse {
  vendors: Vendor[];
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
}, token?: string): Promise<Vendor> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to create vendor");
  }
  return res.json();
}

export async function assignProductVendor(productId: number, vendorId: number | null, token?: string): Promise<{ message: string }> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/vendors/products/${productId}/assign`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify({ vendorId }),
  });
  if (!res.ok) throw new Error("Failed to assign vendor");
  return res.json();
}

export async function purchaseMembershipRazorpay(userToken?: string): Promise<AuthUserProfile> {
  // No client-readable token to pre-check (HttpOnly cookie) — the create-order
  // call below will fail with 401 if the user isn't actually logged in.

  // 1. Load Razorpay script if not already loaded
  if (typeof window !== "undefined" && !window.Razorpay) {
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
      ...getCsrfHeader(),
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
      handler: async function (paymentResponse: RazorpaySuccessResponse) {
        try {
          const verifyRes = await fetch(`${API_URL}/api/payment/verify-membership`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(userToken ? { Authorization: `Bearer ${userToken}` } : {}),
              ...getCsrfHeader(),
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

    const rzp = new window.Razorpay!(options);
    rzp.on("payment.failed", function (response: RazorpayFailureResponse) {
      reject(new Error(response.error?.description || "Membership payment failed."));
    });
    rzp.open();
  });
}

export async function changePasswordAPI(currentPassword: string, newPassword: string, token?: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to change password");
  }

  return res.json();
}

/** Order statuses a customer can still cancel from — mirrors the backend. */
export const CANCELLABLE_ORDER_STATUSES = ["pending", "confirmed", "processing"];

export function isOrderCancellable(status: string): boolean {
  return CANCELLABLE_ORDER_STATUSES.includes(status.toLowerCase());
}

export async function cancelOrderApi(orderId: number, reason?: string): Promise<Order> {
  const token = getCookie("token");
  const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify(reason ? { reason } : {}),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || "Failed to cancel order");
  }

  return response.json();
}

// ─── Password Reset ───────────────────────────────────────────────────────────

/**
 * The message alone, for callers that only need a string. `apiError` already
 * puts the first field-level message on a validation error, so a 422 still
 * reads as "Password must be at least 8 characters" and not "Validation
 * failed".
 */
async function readApiError(res: Response, fallback: string): Promise<string> {
  return (await apiError(res, fallback)).message;
}

export async function requestPasswordResetAPI(email: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to send the reset link. Please try again."));
  }

  return res.json();
}

export async function resetPasswordAPI(token: string, newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to reset your password. Please try again."));
  }

  return res.json();
}



// ─── Email Verification ───────────────────────────────────────────────────────

export async function verifyEmailApi(token: string): Promise<{ message: string; alreadyVerified?: boolean }> {
  const res = await fetch(`${API_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Could not confirm your email. The link may have expired."));
  }

  return res.json();
}

export async function resendVerificationApi(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
    headers: { ...getCsrfHeader() },
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Could not send the verification email. Please try again."));
  }

  return res.json();
}

// ─── Admin Refunds ────────────────────────────────────────────────────────────

export interface RefundOwed {
  id: number;
  orderNumber: string;
  totalAmount: number;
  cancelledAt: string;
  customer: { id: number; name: string; email: string };
  payment: { gateway: string; amount: number; gatewayPaymentId: string | null } | null;
}

/** Cancelled orders whose payment was captured and not yet refunded. */
export async function getRefundsOwed(token?: string): Promise<RefundOwed[]> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/orders/admin/refunds-owed`, {
    credentials: "include",
    headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch outstanding refunds");
  return res.json();
}

/**
 * Records a refund that has already been issued in the payment gateway.
 * This does not move money — it marks the order settled so it leaves the queue.
 */
export async function recordRefundApi(orderId: number, reference?: string): Promise<AdminOrderDetail> {
  const token = getCookie("token");
  const res = await fetch(`${API_URL}/api/orders/admin/${orderId}/refund`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...getCsrfHeader(),
    },
    body: JSON.stringify(reference ? { reference } : {}),
  });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to record refund"));
  }
  return res.json();
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

export interface ContactMessagePayload {
  name: string;
  email: string;
  message: string;
}

export async function submitContactMessageApi(
  payload: ContactMessagePayload
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(await readApiError(res, "Failed to send your message. Please try again."));
  }

  return res.json();
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

/** Admin-only inbox for messages submitted through /contact. */
export async function getContactMessagesApi(token?: string): Promise<ContactMessage[]> {
  const authToken = token || getCookie("token");
  const res = await fetch(`${API_URL}/api/contact`, {
    credentials: "include",
    headers: { ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}
