import { Response, Request } from "express";
import { getAllProducts, getProductById, createProduct, deleteProduct, updateProduct, subCategories, getNavigationMetadata, getProductsAdmin, getProductStats, bulkUpdateProducts } from "../services/product.service";

export const getProducts = async (req:Request, res:Response) =>{
        const category = req.query.category as string;
        const subCategory = req.query.subCategory as string;
        const vehicle = req.query.vehicle as string;
        const brand = req.query.brand as string;
        const products = await getAllProducts(category, subCategory, vehicle, brand);
        res.json(products);
    };

//
// Get the Product by ID 
//

export const getProduct = async (req:Request, res:Response) =>{
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await getProductById(id);

    if (!product){
        return res.status(404).json({
            message: "Product not Found",
        });
    }
    res.json(product);
}

//
/// Add new Product
//
export const createNewProduct = async(req:Request, res:Response) =>{
    const product = await createProduct(req.body);

    res.status(201).json(product);
};
//
/// Delete the Product from the Database
///
export const removeProduct = async(req:Request, res:Response) =>{
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    await deleteProduct(id);
    res.json({
        message:"Product Deleted Successfully"
    })
}
//
/// Update the Product in the Database
//
export const editProduct = async (req:Request, res:Response) =>{
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }

    const data = req.body;
    const product = await updateProduct(id, data);
    res.json(product);
}


export const getSubCategories = async (req:Request, res:Response) =>{
    const {category} = req.params;
    if (typeof category !== 'string') {
        return res.status(400).json({ message: "Invalid category" });
    }
    const subcategories = await subCategories(category);
    res.json(subcategories)
}

export const getNavMetadata = async (req: Request, res: Response) => {
    try {
        const metadata = await getNavigationMetadata();
        res.json(metadata);
    } catch (error) {
        console.error("Failed to fetch navigation metadata:", error);
        res.status(500).json({ message: "Failed to fetch navigation metadata" });
    }
}

// ─── Admin: Paginated product listing ────────────────────────────────────────

export const getProductsAdminCtrl = async (req: Request, res: Response) => {
    try {
        const result = await getProductsAdmin({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 15,
            search: req.query.search as string,
            category: req.query.category as string,
            status: req.query.status as string,
            stock: req.query.stock as string,
            sortBy: req.query.sortBy as string,
            sortOrder: req.query.sortOrder as string,
        });
        res.json(result);
    } catch (error) {
        console.error("Failed to fetch admin products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

// ─── Admin: Product stats ────────────────────────────────────────────────────

export const getProductStatsCtrl = async (req: Request, res: Response) => {
    try {
        const stats = await getProductStats();
        res.json(stats);
    } catch (error) {
        console.error("Failed to fetch product stats:", error);
        res.status(500).json({ message: "Failed to fetch product stats" });
    }
};

// ─── Admin: Bulk update products ─────────────────────────────────────────────

export const bulkUpdateProductsCtrl = async (req: Request, res: Response) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ message: "Product IDs array is required" });
        }
        if (!['activate', 'deactivate', 'delete'].includes(action)) {
            return res.status(400).json({ message: "Action must be activate, deactivate, or delete" });
        }
        const result = await bulkUpdateProducts(ids.map(Number), action);
        res.json(result);
    } catch (error: any) {
        console.error("Failed to bulk update products:", error);
        res.status(500).json({ message: error.message || "Failed to bulk update products" });
    }
};