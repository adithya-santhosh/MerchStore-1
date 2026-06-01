import { Response, Request } from "express";
import { getAllProducts } from "../services/product.service";

export const getProducts = (req:Request, res:Response) =>{
    
        const products = getAllProducts();
        res.json(products);
    };
