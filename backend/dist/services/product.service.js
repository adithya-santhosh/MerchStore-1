"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkUpdateProducts = exports.getProductStats = exports.getProductsAdmin = exports.getNavigationMetadata = exports.subCategories = exports.updateProduct = exports.deleteProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
// Helper function to map Prisma Product relations to frontend-compatible formats
const mapProduct = (product) => {
    if (!product)
        return null;
    let categoryName = "";
    let subCategoryName = null;
    if (product.category) {
        if (product.category.parent) {
            categoryName = product.category.parent.name;
            subCategoryName = product.category.name;
        }
        else {
            categoryName = product.category.name;
            subCategoryName = null;
        }
    }
    const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
    const ImageURL = primaryImage ? primaryImage.imageUrl : null;
    return {
        ...product,
        category: categoryName,
        subCategory: subCategoryName,
        ImageURL,
        price: product.price ? Number(product.price) : 0,
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        costPrice: product.costPrice ? Number(product.costPrice) : null,
        compatibleWith: product.compatibleWith?.map((cv) => ({
            id: cv.vehicle.id,
            make: cv.vehicle.make,
            model: cv.vehicle.model,
            yearFrom: cv.vehicle.yearFrom,
            yearTo: cv.vehicle.yearTo,
            bodyType: cv.vehicle.bodyType,
            engineType: cv.vehicle.engineType,
            notes: cv.notes
        })) || [],
    };
};
//
/// Function to Get All the Products from the Database
//
const getAllProducts = async (categoryQuery, subCategoryQuery, vehicleQuery, brandQuery) => {
    const where = {};
    if (brandQuery) {
        where.brand = {
            OR: [
                { slug: { equals: brandQuery, mode: 'insensitive' } },
                { name: { equals: brandQuery, mode: 'insensitive' } }
            ]
        };
    }
    if (vehicleQuery) {
        where.compatibleWith = {
            some: {
                vehicle: {
                    OR: [
                        { model: { equals: vehicleQuery, mode: 'insensitive' } },
                        { make: { equals: vehicleQuery, mode: 'insensitive' } }
                    ]
                }
            }
        };
    }
    if (subCategoryQuery) {
        // If a subcategory query is specified, find the specific category record
        const subCat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { slug: subCategoryQuery },
                    { name: subCategoryQuery }
                ]
            }
        });
        if (subCat) {
            where.categoryId = subCat.id;
        }
        else {
            // If the specified subcategory doesn't exist, return no products
            return [];
        }
    }
    else if (categoryQuery) {
        // If only the parent category is specified, find it and include its children categories
        const parentCat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { slug: categoryQuery },
                    { name: categoryQuery }
                ]
            },
            include: {
                children: true
            }
        });
        if (parentCat) {
            const categoryIds = [parentCat.id, ...parentCat.children.map(child => child.id)];
            where.categoryId = { in: categoryIds };
        }
        else {
            // If category doesn't exist, return no products
            return [];
        }
    }
    const products = await prisma_1.default.product.findMany({
        where,
        include: {
            category: {
                include: {
                    parent: true
                }
            },
            brand: true,
            images: true,
            attributes: true,
            compatibleWith: {
                include: {
                    vehicle: true
                }
            }
        }
    });
    return products.map(mapProduct);
};
exports.getAllProducts = getAllProducts;
//
/// Function to Find the Product by Id number
//
const getProductById = async (id) => {
    const product = await prisma_1.default.product.findUnique({
        where: { id },
        include: {
            category: {
                include: {
                    parent: true
                }
            },
            brand: true,
            images: true,
            attributes: true,
            compatibleWith: {
                include: {
                    vehicle: true
                }
            },
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });
    return product ? mapProduct(product) : null;
};
exports.getProductById = getProductById;
//
//// Function to add The product to the Database
//
const createProduct = async (data) => {
    const { images, ...productData } = data;
    const createData = { ...productData };
    const vehicleEntries = productData.compatibleWith || [];
    delete createData.compatibleWith;
    // Handle brand string lookup or creation
    if (!productData.brandId && productData.brand) {
        const brandName = productData.brand.trim();
        let brandObj = await prisma_1.default.brand.findUnique({
            where: { name: brandName }
        });
        if (!brandObj) {
            brandObj = await prisma_1.default.brand.create({
                data: {
                    name: brandName,
                    slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
            });
        }
        createData.brandId = brandObj.id;
    }
    delete createData.brand;
    // Backwards compatibility for ImageURL
    if (productData.ImageURL) {
        createData.images = {
            create: [{
                    imageUrl: productData.ImageURL,
                    isPrimary: true
                }]
        };
        delete createData.ImageURL;
    }
    // Handle images array if provided
    if (images && Array.isArray(images)) {
        createData.images = {
            create: images.map((img) => {
                if (typeof img === 'string') {
                    return { imageUrl: img };
                }
                return {
                    imageUrl: img.imageUrl,
                    altText: img.altText,
                    isPrimary: img.isPrimary || false,
                    sortOrder: img.sortOrder || 0
                };
            })
        };
    }
    // Backwards compatibility for category/subCategory string lookup
    if (!productData.categoryId && productData.category) {
        const categoryName = productData.category;
        let cat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { name: categoryName },
                    { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
                ]
            }
        });
        if (!cat) {
            cat = await prisma_1.default.category.create({
                data: {
                    name: categoryName,
                    slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
            });
        }
        createData.categoryId = cat.id;
        delete createData.category;
    }
    if (productData.subCategory && createData.categoryId) {
        const parentId = createData.categoryId;
        const subCatName = productData.subCategory;
        let subCat = await prisma_1.default.category.findFirst({
            where: {
                parentId,
                OR: [
                    { name: subCatName },
                    { slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
                ]
            }
        });
        if (!subCat) {
            subCat = await prisma_1.default.category.create({
                data: {
                    name: subCatName,
                    slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    parentId
                }
            });
        }
        createData.categoryId = subCat.id;
        delete createData.subCategory;
    }
    const product = await prisma_1.default.product.create({
        data: createData,
        include: {
            images: true,
            category: {
                include: {
                    parent: true
                }
            },
            brand: true
        }
    });
    // Link vehicle compatibilities
    if (vehicleEntries && Array.isArray(vehicleEntries)) {
        for (const entry of vehicleEntries) {
            const { make, model, yearFrom, yearTo, bodyType, engineType, notes } = entry;
            if (!make || !model)
                continue;
            let vehicle = await prisma_1.default.vehicle.findFirst({
                where: {
                    make: { equals: make.trim(), mode: 'insensitive' },
                    model: { equals: model.trim(), mode: 'insensitive' },
                    yearFrom: Number(yearFrom),
                    yearTo: yearTo ? Number(yearTo) : null,
                    bodyType: bodyType ? bodyType.trim() : null,
                    engineType: engineType ? engineType.trim() : null
                }
            });
            if (!vehicle) {
                vehicle = await prisma_1.default.vehicle.create({
                    data: {
                        make: make.trim(),
                        model: model.trim(),
                        yearFrom: Number(yearFrom),
                        yearTo: yearTo ? Number(yearTo) : null,
                        bodyType: bodyType ? bodyType.trim() : null,
                        engineType: engineType ? engineType.trim() : null
                    }
                });
            }
            await prisma_1.default.productVehicle.upsert({
                where: {
                    productId_vehicleId: {
                        productId: product.id,
                        vehicleId: vehicle.id
                    }
                },
                create: {
                    productId: product.id,
                    vehicleId: vehicle.id,
                    notes: notes || null
                },
                update: {
                    notes: notes || null
                }
            });
        }
    }
    // Refetch complete product with compatibleWith list
    const fullProduct = await prisma_1.default.product.findUnique({
        where: { id: product.id },
        include: {
            images: true,
            category: {
                include: {
                    parent: true
                }
            },
            brand: true,
            compatibleWith: {
                include: {
                    vehicle: true
                }
            }
        }
    });
    return mapProduct(fullProduct);
};
exports.createProduct = createProduct;
//
/// Delete the Product from the Database
//
const deleteProduct = async (id) => {
    return await prisma_1.default.product.delete({
        where: { id }
    });
};
exports.deleteProduct = deleteProduct;
/// Update the Product in the database
const updateProduct = async (id, data) => {
    const { images, ...productData } = data;
    const updateData = { ...productData };
    const vehicleEntries = productData.compatibleWith || [];
    delete updateData.compatibleWith;
    // Handle brand string lookup or creation
    if (!productData.brandId && productData.brand) {
        const brandName = productData.brand.trim();
        let brandObj = await prisma_1.default.brand.findUnique({
            where: { name: brandName }
        });
        if (!brandObj) {
            brandObj = await prisma_1.default.brand.create({
                data: {
                    name: brandName,
                    slug: brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
            });
        }
        updateData.brandId = brandObj.id;
    }
    delete updateData.brand;
    // Backwards compatibility for ImageURL
    if (productData.ImageURL) {
        await prisma_1.default.productImage.deleteMany({ where: { productId: id } });
        updateData.images = {
            create: [{
                    imageUrl: productData.ImageURL,
                    isPrimary: true
                }]
        };
        delete updateData.ImageURL;
    }
    // Handle images array update if provided
    if (images && Array.isArray(images)) {
        await prisma_1.default.productImage.deleteMany({ where: { productId: id } });
        updateData.images = {
            create: images.map((img) => {
                if (typeof img === 'string') {
                    return { imageUrl: img };
                }
                return {
                    imageUrl: img.imageUrl,
                    altText: img.altText,
                    isPrimary: img.isPrimary || false,
                    sortOrder: img.sortOrder || 0
                };
            })
        };
    }
    // Backwards compatibility for category/subCategory string lookup
    if (!productData.categoryId && productData.category) {
        const categoryName = productData.category;
        let cat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { name: categoryName },
                    { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
                ]
            }
        });
        if (!cat) {
            cat = await prisma_1.default.category.create({
                data: {
                    name: categoryName,
                    slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                }
            });
        }
        updateData.categoryId = cat.id;
        delete updateData.category;
    }
    if (productData.subCategory && updateData.categoryId) {
        const parentId = updateData.categoryId;
        const subCatName = productData.subCategory;
        let subCat = await prisma_1.default.category.findFirst({
            where: {
                parentId,
                OR: [
                    { name: subCatName },
                    { slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
                ]
            }
        });
        if (!subCat) {
            subCat = await prisma_1.default.category.create({
                data: {
                    name: subCatName,
                    slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    parentId
                }
            });
        }
        updateData.categoryId = subCat.id;
        delete updateData.subCategory;
    }
    const product = await prisma_1.default.product.update({
        where: { id },
        data: updateData,
        include: {
            images: true,
            category: {
                include: {
                    parent: true
                }
            },
            brand: true
        }
    });
    // Clear and update vehicle compatibilities
    await prisma_1.default.productVehicle.deleteMany({
        where: { productId: id }
    });
    if (vehicleEntries && Array.isArray(vehicleEntries)) {
        for (const entry of vehicleEntries) {
            const { make, model, yearFrom, yearTo, bodyType, engineType, notes } = entry;
            if (!make || !model)
                continue;
            let vehicle = await prisma_1.default.vehicle.findFirst({
                where: {
                    make: { equals: make.trim(), mode: 'insensitive' },
                    model: { equals: model.trim(), mode: 'insensitive' },
                    yearFrom: Number(yearFrom),
                    yearTo: yearTo ? Number(yearTo) : null,
                    bodyType: bodyType ? bodyType.trim() : null,
                    engineType: engineType ? engineType.trim() : null
                }
            });
            if (!vehicle) {
                vehicle = await prisma_1.default.vehicle.create({
                    data: {
                        make: make.trim(),
                        model: model.trim(),
                        yearFrom: Number(yearFrom),
                        yearTo: yearTo ? Number(yearTo) : null,
                        bodyType: bodyType ? bodyType.trim() : null,
                        engineType: engineType ? engineType.trim() : null
                    }
                });
            }
            await prisma_1.default.productVehicle.upsert({
                where: {
                    productId_vehicleId: {
                        productId: id,
                        vehicleId: vehicle.id
                    }
                },
                create: {
                    productId: id,
                    vehicleId: vehicle.id,
                    notes: notes || null
                },
                update: {
                    notes: notes || null
                }
            });
        }
    }
    // Refetch complete product with compatibleWith list
    const fullProduct = await prisma_1.default.product.findUnique({
        where: { id },
        include: {
            images: true,
            category: {
                include: {
                    parent: true
                }
            },
            brand: true,
            compatibleWith: {
                include: {
                    vehicle: true
                }
            }
        }
    });
    return mapProduct(fullProduct);
};
exports.updateProduct = updateProduct;
const subCategories = async (categorySlugOrName) => {
    const category = await prisma_1.default.category.findFirst({
        where: {
            OR: [
                { slug: categorySlugOrName },
                { name: categorySlugOrName }
            ]
        },
        include: {
            children: true
        }
    });
    if (!category)
        return [];
    return category.children.map(child => child.name); // return subcategory names for controller compatibility
};
exports.subCategories = subCategories;
const getNavigationMetadata = async () => {
    const categories = await prisma_1.default.category.findMany({
        where: { parentId: null, isActive: true },
        include: {
            children: {
                where: { isActive: true },
                orderBy: { sortOrder: "asc" }
            }
        },
        orderBy: { sortOrder: "asc" }
    });
    const brands = await prisma_1.default.brand.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" }
    });
    const vehicles = await prisma_1.default.vehicle.findMany({
        orderBy: [
            { make: "asc" },
            { model: "asc" }
        ]
    });
    return {
        categories,
        brands,
        vehicles
    };
};
exports.getNavigationMetadata = getNavigationMetadata;
// ─── ADMIN: Paginated product list with search/filter/sort ───────────────────
const getProductsAdmin = async (params) => {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const skip = (page - 1) * limit;
    const where = {};
    // Search across name, sku, description
    if (params.search?.trim()) {
        const q = params.search.trim();
        where.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
        ];
    }
    // Category filter
    if (params.category) {
        const cat = await prisma_1.default.category.findFirst({
            where: {
                OR: [
                    { slug: params.category },
                    { name: { equals: params.category, mode: 'insensitive' } }
                ]
            },
            include: { children: true }
        });
        if (cat) {
            const categoryIds = [cat.id, ...cat.children.map(c => c.id)];
            where.categoryId = { in: categoryIds };
        }
    }
    // Status filter
    if (params.status === 'active')
        where.isActive = true;
    if (params.status === 'inactive')
        where.isActive = false;
    // Stock filter
    if (params.stock === 'out-of-stock')
        where.stockQty = 0;
    if (params.stock === 'low-stock')
        where.stockQty = { gt: 0, lt: 5 };
    if (params.stock === 'in-stock')
        where.stockQty = { gte: 5 };
    // Sorting
    const validSortFields = ['name', 'price', 'createdAt', 'stockQty'];
    const sortBy = validSortFields.includes(params.sortBy || '') ? params.sortBy : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc';
    const [products, total] = await Promise.all([
        prisma_1.default.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
            include: {
                category: { include: { parent: true } },
                brand: true,
                images: true,
                attributes: true,
                compatibleWith: { include: { vehicle: true } },
            },
        }),
        prisma_1.default.product.count({ where }),
    ]);
    return {
        products: products.map(mapProduct),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
};
exports.getProductsAdmin = getProductsAdmin;
// ─── ADMIN: Product stats aggregate ──────────────────────────────────────────
const getProductStats = async () => {
    const [totalProducts, activeProducts, outOfStock, lowStock] = await Promise.all([
        prisma_1.default.product.count(),
        prisma_1.default.product.count({ where: { isActive: true } }),
        prisma_1.default.product.count({ where: { stockQty: 0 } }),
        prisma_1.default.product.count({ where: { stockQty: { gt: 0, lt: 5 } } }),
    ]);
    return {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        outOfStock,
        lowStock,
    };
};
exports.getProductStats = getProductStats;
// ─── ADMIN: Bulk update products ─────────────────────────────────────────────
const bulkUpdateProducts = async (ids, action) => {
    if (!ids.length)
        throw new Error('No product IDs provided');
    if (action === 'delete') {
        // Delete related records first, then products
        await prisma_1.default.productVehicle.deleteMany({ where: { productId: { in: ids } } });
        await prisma_1.default.productAttribute.deleteMany({ where: { productId: { in: ids } } });
        await prisma_1.default.productImage.deleteMany({ where: { productId: { in: ids } } });
        await prisma_1.default.cartItem.deleteMany({ where: { productId: { in: ids } } });
        await prisma_1.default.wishlistItem.deleteMany({ where: { productId: { in: ids } } });
        const result = await prisma_1.default.product.deleteMany({ where: { id: { in: ids } } });
        return { affected: result.count, action };
    }
    const isActive = action === 'activate';
    const result = await prisma_1.default.product.updateMany({
        where: { id: { in: ids } },
        data: { isActive },
    });
    return { affected: result.count, action };
};
exports.bulkUpdateProducts = bulkUpdateProducts;
//# sourceMappingURL=product.service.js.map