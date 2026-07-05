"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateProductsCtrl = exports.getProductStatsCtrl = exports.getProductsAdminCtrl = exports.getNavMetadata = exports.getSubCategories = exports.editProduct = exports.removeProduct = exports.createNewProduct = exports.getProduct = exports.getProducts = void 0;
const product_service_1 = require("../services/product.service");
const getProducts = async (req, res) => {
    try {
        const category = req.query.category;
        const subCategory = req.query.subCategory;
        const vehicle = req.query.vehicle;
        const brand = req.query.brand;
        const products = await (0, product_service_1.getAllProducts)(category, subCategory, vehicle, brand);
        res.json(products);
    }
    catch (error) {
        console.error("Error in getProducts controller:", error);
        res.status(500).json({ message: error.message || "Failed to fetch products" });
    }
};
exports.getProducts = getProducts;
//
// Get the Product by ID 
//
const getProduct = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    const product = await (0, product_service_1.getProductById)(id);
    if (!product) {
        return res.status(404).json({
            message: "Product not Found",
        });
    }
    res.json(product);
};
exports.getProduct = getProduct;
//
/// Add new Product
//
const createNewProduct = async (req, res) => {
    const product = await (0, product_service_1.createProduct)(req.body);
    res.status(201).json(product);
};
exports.createNewProduct = createNewProduct;
//
/// Delete the Product from the Database
///
const removeProduct = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    await (0, product_service_1.deleteProduct)(id);
    res.json({
        message: "Product Deleted Successfully"
    });
};
exports.removeProduct = removeProduct;
//
/// Update the Product in the Database
//
const editProduct = async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid product ID" });
    }
    const data = req.body;
    const product = await (0, product_service_1.updateProduct)(id, data);
    res.json(product);
};
exports.editProduct = editProduct;
const getSubCategories = async (req, res) => {
    const { category } = req.params;
    if (typeof category !== 'string') {
        return res.status(400).json({ message: "Invalid category" });
    }
    const subcategories = await (0, product_service_1.subCategories)(category);
    res.json(subcategories);
};
exports.getSubCategories = getSubCategories;
const getNavMetadata = async (req, res) => {
    try {
        const metadata = await (0, product_service_1.getNavigationMetadata)();
        res.json(metadata);
    }
    catch (error) {
        console.error("Failed to fetch navigation metadata:", error);
        res.status(500).json({ message: "Failed to fetch navigation metadata" });
    }
};
exports.getNavMetadata = getNavMetadata;
// ─── Admin: Paginated product listing ────────────────────────────────────────
const getProductsAdminCtrl = async (req, res) => {
    try {
        const result = await (0, product_service_1.getProductsAdmin)({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 15,
            search: req.query.search,
            category: req.query.category,
            status: req.query.status,
            stock: req.query.stock,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        });
        res.json(result);
    }
    catch (error) {
        console.error("Failed to fetch admin products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};
exports.getProductsAdminCtrl = getProductsAdminCtrl;
// ─── Admin: Product stats ────────────────────────────────────────────────────
const getProductStatsCtrl = async (req, res) => {
    try {
        const stats = await (0, product_service_1.getProductStats)();
        res.json(stats);
    }
    catch (error) {
        console.error("Failed to fetch product stats:", error);
        res.status(500).json({ message: "Failed to fetch product stats" });
    }
};
exports.getProductStatsCtrl = getProductStatsCtrl;
// ─── Admin: Bulk update products ─────────────────────────────────────────────
const bulkUpdateProductsCtrl = async (req, res) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || !ids.length) {
            return res.status(400).json({ message: "Product IDs array is required" });
        }
        if (!['activate', 'deactivate', 'delete'].includes(action)) {
            return res.status(400).json({ message: "Action must be activate, deactivate, or delete" });
        }
        const result = await (0, product_service_1.bulkUpdateProducts)(ids.map(Number), action);
        res.json(result);
    }
    catch (error) {
        console.error("Failed to bulk update products:", error);
        res.status(500).json({ message: error.message || "Failed to bulk update products" });
    }
};
exports.bulkUpdateProductsCtrl = bulkUpdateProductsCtrl;
//# sourceMappingURL=product.controller.js.map