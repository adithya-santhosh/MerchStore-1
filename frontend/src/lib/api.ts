import { Product } from "@/types/products";

//const API_URL = import.meta.env.VITE_API_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL!;

/// This function will go to backend and fetch all the product info
export async function getProducts() :Promise<Product []>{
  const response = await fetch(
    `${API_URL}/api/products`,
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
  const response = await fetch(
    `${API_URL}/api/products/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete product");
  }

  return response.json();
}

export async function createProduct(product: Omit<Product,"id" | "createdAt" |"updatedAt">){
  const response = await fetch(`${API_URL}/api/products`,{
    method :"POST",
    headers : {"Content-Type": "application/json",},
    body : JSON.stringify(product),
  });
  if (!response.ok){
    throw new Error("Failed to create the product");
  }
  return response.json();
}

export async function updateProduct(id: string | number, product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
  const response = await fetch(`${API_URL}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
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

