// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getProducts,
  getProductById,
  getProductByCategory,
  getSubCategories,
  searchProducts,
  createOrder,
  createPaymentOrder,
  verifyPayment,
  deleteProduct,
} from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fetchMock = vi.fn();

/** Shorthand for a successful JSON response. */
const ok = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

/** Shorthand for a failed response carrying an API error message. */
const fail = (status: number, body: unknown = {}) => ({
  ok: false,
  status,
  json: async () => body,
});

/** The URL the single fetch call was made against. */
const calledUrl = () => fetchMock.mock.calls[0]?.[0] as string;
const calledInit = () => fetchMock.mock.calls[0]?.[1] as RequestInit;

const setCookie = (value: string) => {
  document.cookie = `token=${value}`;
};

const clearCookies = () => {
  for (const pair of document.cookie.split(";")) {
    const name = pair.split("=")[0]?.trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  clearCookies();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getProducts", () => {
  it("calls the catalogue endpoint with no query when unfiltered", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getProducts();

    expect(calledUrl()).toBe(`${API_URL}/api/products`);
  });

  it("appends only the filters that were supplied", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getProducts({ category: "storage", brand: "arb" });

    const url = new URL(calledUrl());
    expect(url.searchParams.get("category")).toBe("storage");
    expect(url.searchParams.get("brand")).toBe("arb");
    expect(url.searchParams.has("vehicle")).toBe(false);
  });

  it("url-encodes a filter containing spaces and ampersands", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getProducts({ category: "Storage & Racks" });

    expect(calledUrl()).toContain("category=Storage+%26+Racks");
    expect(new URL(calledUrl()).searchParams.get("category")).toBe("Storage & Racks");
  });

  it("opts out of caching so the catalogue is never stale", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getProducts();

    expect(calledInit()).toMatchObject({ cache: "no-store" });
  });

  it("throws when the API responds with an error status", async () => {
    fetchMock.mockResolvedValue(fail(500));

    await expect(getProducts()).rejects.toThrow(/failed to fetch products/i);
  });

  it("returns the parsed body on success", async () => {
    fetchMock.mockResolvedValue(ok([{ id: 10, name: "Roof Rack" }]));

    await expect(getProducts()).resolves.toEqual([{ id: 10, name: "Roof Rack" }]);
  });
});

describe("getProductById", () => {
  it("requests the single-product endpoint", async () => {
    fetchMock.mockResolvedValue(ok({ id: 10 }));

    await getProductById("10");

    expect(calledUrl()).toBe(`${API_URL}/api/products/10`);
  });

  it("throws for a 404 rather than returning undefined", async () => {
    fetchMock.mockResolvedValue(fail(404));

    await expect(getProductById("999")).rejects.toThrow(/failed to fetch product/i);
  });
});

describe("getProductByCategory", () => {
  it("encodes the category into the query string", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getProductByCategory("Storage & Racks");

    expect(new URL(calledUrl()).searchParams.get("category")).toBe("Storage & Racks");
  });

  it("throws on a failed response", async () => {
    fetchMock.mockResolvedValue(fail(500));

    await expect(getProductByCategory("storage")).rejects.toThrow();
  });
});

describe("getSubCategories", () => {
  it("encodes the category into the path, not a query", async () => {
    fetchMock.mockResolvedValue(ok([]));

    await getSubCategories("Storage & Racks");

    // A raw "&" or "/" here would break the route match.
    expect(calledUrl()).toBe(`${API_URL}/api/products/subcategories/Storage%20%26%20Racks`);
  });

  it("throws on a failed response", async () => {
    fetchMock.mockResolvedValue(fail(500));

    await expect(getSubCategories("storage")).rejects.toThrow(/subcategories/i);
  });
});

describe("searchProducts", () => {
  const result = {
    products: [],
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
    aggregations: { brands: [], categories: [], priceRange: { min: 0, max: 100000 } },
  };

  it("sends no query at all for an empty filter set", async () => {
    fetchMock.mockResolvedValue(ok(result));

    await searchProducts({});

    expect(calledUrl()).toBe(`${API_URL}/api/products/search`);
  });

  it("serialises every supplied filter", async () => {
    fetchMock.mockResolvedValue(ok(result));

    await searchProducts({
      search: "rack",
      category: "storage",
      brand: "arb",
      vehicle: "Thar",
      productType: "part",
      sortBy: "price-asc",
      page: 2,
      limit: 24,
    });

    const params = new URL(calledUrl()).searchParams;
    expect(params.get("search")).toBe("rack");
    expect(params.get("category")).toBe("storage");
    expect(params.get("brand")).toBe("arb");
    expect(params.get("vehicle")).toBe("Thar");
    expect(params.get("productType")).toBe("part");
    expect(params.get("sortBy")).toBe("price-asc");
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("24");
  });

  it("sends a minPrice of 0 rather than dropping it as falsy", async () => {
    fetchMock.mockResolvedValue(ok(result));

    await searchProducts({ minPrice: 0, maxPrice: 5000 });

    const params = new URL(calledUrl()).searchParams;
    expect(params.get("minPrice")).toBe("0");
    expect(params.get("maxPrice")).toBe("5000");
  });

  it("omits price bounds that were not supplied", async () => {
    fetchMock.mockResolvedValue(ok(result));

    await searchProducts({ search: "rack" });

    const params = new URL(calledUrl()).searchParams;
    expect(params.has("minPrice")).toBe(false);
    expect(params.has("maxPrice")).toBe(false);
  });

  it("throws when the search endpoint fails", async () => {
    fetchMock.mockResolvedValue(fail(500));

    await expect(searchProducts({})).rejects.toThrow(/failed to search products/i);
  });
});

describe("authenticated requests", () => {
  it("attaches the bearer token from the cookie when placing an order", async () => {
    setCookie("jwt-abc");
    fetchMock.mockResolvedValue(ok({ id: 1 }));

    await createOrder({ address: {} as never, paymentMethod: "cod" } as never);

    expect((calledInit().headers as Record<string, string>).Authorization).toBe("Bearer jwt-abc");
  });

  it("omits the Authorization header entirely when no cookie is present", async () => {
    fetchMock.mockResolvedValue(ok({ id: 1 }));

    await createOrder({ address: {} as never, paymentMethod: "cod" } as never);

    // An "Authorization: Bearer undefined" header would be rejected as malformed.
    expect(calledInit().headers).not.toHaveProperty("Authorization");
  });

  it("sends credentials so the HttpOnly cookie reaches the API too", async () => {
    fetchMock.mockResolvedValue(ok({ id: 1 }));

    await createOrder({ address: {} as never, paymentMethod: "cod" } as never);

    expect(calledInit().credentials).toBe("include");
  });

  it("posts the payload as JSON", async () => {
    fetchMock.mockResolvedValue(ok({ id: 1 }));
    const payload = { address: { city: "Bengaluru" }, paymentMethod: "cod" };

    await createOrder(payload as never);

    expect(calledInit().method).toBe("POST");
    expect(JSON.parse(calledInit().body as string)).toEqual(payload);
  });

  it("surfaces the API's own error message when an order fails", async () => {
    fetchMock.mockResolvedValue(fail(400, { message: "Your cart is empty." }));

    await expect(createOrder({} as never)).rejects.toThrow("Your cart is empty.");
  });

  it("falls back to a generic message when the API sends no message", async () => {
    fetchMock.mockResolvedValue(fail(500, {}));

    await expect(createOrder({} as never)).rejects.toThrow(/failed to place order/i);
  });

  it("attaches the token when creating a payment order", async () => {
    setCookie("jwt-abc");
    fetchMock.mockResolvedValue(ok({ orderId: "order_xyz" }));

    await createPaymentOrder({ address: {} as never });

    expect((calledInit().headers as Record<string, string>).Authorization).toBe("Bearer jwt-abc");
  });

  it("surfaces a failed signature verification message", async () => {
    fetchMock.mockResolvedValue(
      fail(400, { message: "Payment signature verification failed." })
    );

    await expect(
      verifyPayment({
        razorpayOrderId: "order_xyz",
        razorpayPaymentId: "pay_abc",
        razorpaySignature: "forged",
        address: {} as never,
      })
    ).rejects.toThrow(/signature verification failed/i);
  });

  it("sends a DELETE with the token when removing a product", async () => {
    setCookie("jwt-admin");
    fetchMock.mockResolvedValue(ok({}));

    await deleteProduct(10);

    expect(calledUrl()).toBe(`${API_URL}/api/products/10`);
    expect(calledInit().method).toBe("DELETE");
    expect((calledInit().headers as Record<string, string>).Authorization).toBe("Bearer jwt-admin");
  });

  it("throws when a delete is rejected", async () => {
    fetchMock.mockResolvedValue(fail(403));

    await expect(deleteProduct(10)).rejects.toThrow(/failed to delete product/i);
  });
});
