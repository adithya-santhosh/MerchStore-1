import prisma from "../lib/prisma";

//
/// Function to Get All the Products from the Database
//
export const getAllProducts = async (categoryQuery?: string, subCategoryQuery?: string) => {
  const where: any = {};

  if (subCategoryQuery) {
    // If a subcategory query is specified, find the specific category record
    const subCat = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: subCategoryQuery },
          { name: subCategoryQuery }
        ]
      }
    });
    if (subCat) {
      where.categoryId = subCat.id;
    } else {
      // If the specified subcategory doesn't exist, return no products
      return [];
    }
  } else if (categoryQuery) {
    // If only the parent category is specified, find it and include its children categories
    const parentCat = await prisma.category.findFirst({
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
    } else {
      // If category doesn't exist, return no products
      return [];
    }
  }

  return await prisma.product.findMany({
    where,
    include: {
      category: true,
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
};

//
/// Function to Find the Product by Id number
//
export const getProductById = async (id: number) => {
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
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
};

//
//// Function to add The product to the Database
//
export const createProduct = async (data: any) => {
  const { images, ...productData } = data;
  const createData: any = { ...productData };

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
      create: images.map((img: any) => {
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
    let cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: categoryName },
          { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      }
    });
    if (!cat) {
      cat = await prisma.category.create({
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
    let subCat = await prisma.category.findFirst({
      where: {
        parentId,
        OR: [
          { name: subCatName },
          { slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      }
    });
    if (!subCat) {
      subCat = await prisma.category.create({
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

  return await prisma.product.create({
    data: createData,
    include: {
      images: true,
      category: true,
      brand: true
    }
  });
};

//
/// Delete the Product from the Database
//
export const deleteProduct = async (id: number) => {
  return await prisma.product.delete({
    where: { id }
  });
};

/// Update the Product in the database
export const updateProduct = async (id: number, data: any) => {
  const { images, ...productData } = data;
  const updateData: any = { ...productData };

  // Backwards compatibility for ImageURL
  if (productData.ImageURL) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
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
    await prisma.productImage.deleteMany({ where: { productId: id } });
    updateData.images = {
      create: images.map((img: any) => {
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
    let cat = await prisma.category.findFirst({
      where: {
        OR: [
          { name: categoryName },
          { slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      }
    });
    if (!cat) {
      cat = await prisma.category.create({
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
    let subCat = await prisma.category.findFirst({
      where: {
        parentId,
        OR: [
          { name: subCatName },
          { slug: subCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-') }
        ]
      }
    });
    if (!subCat) {
      subCat = await prisma.category.create({
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

  return await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: true,
      category: true,
      brand: true
    }
  });
};

export const subCategories = async (categorySlugOrName: string) => {
  const category = await prisma.category.findFirst({
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

  if (!category) return [];
  return category.children.map(child => child.name); // return subcategory names for controller compatibility
};