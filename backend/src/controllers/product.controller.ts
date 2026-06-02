import { Response, Request } from "express";
import { getAllProducts } from "../services/product.service";

export const getProducts = async (req:Request, res:Response) =>{
    
        const products = await getAllProducts();
        res.json(products);
    };
