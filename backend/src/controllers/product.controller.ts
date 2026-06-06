import { Response, Request } from "express";
import { getAllProducts, getProductById, createProduct, deleteProduct, updateProduct } from "../services/product.service";

export const getProducts = async (req:Request, res:Response) =>{
        const category = req.query.category as string
        const products = await getAllProducts(category);
        res.json(products);
    };

//
// Get the Product by ID 
//

export const getProduct = async (req:Request, res:Response) =>{
    const id = Number(req.params.id);

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
    const data = req.body;
    const product = await updateProduct(id, data);
    res.json(product);
}
