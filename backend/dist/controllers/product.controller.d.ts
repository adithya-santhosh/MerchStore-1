import { Response, Request } from "express";
export declare const getProducts: (req: Request, res: Response) => Promise<void>;
export declare const getProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createNewProduct: (req: Request, res: Response) => Promise<void>;
export declare const removeProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const editProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getSubCategories: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getNavMetadata: (req: Request, res: Response) => Promise<void>;
export declare const getProductsAdminCtrl: (req: Request, res: Response) => Promise<void>;
export declare const getProductStatsCtrl: (req: Request, res: Response) => Promise<void>;
export declare const bulkUpdateProductsCtrl: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=product.controller.d.ts.map