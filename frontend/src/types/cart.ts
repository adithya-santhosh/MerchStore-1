export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  category: string;
  ImageURL: string | null;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: CartProduct;
}

export interface Cart {
  id: number;
  sessionToken: string;
  userId: number | null;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
