import { Request, Response } from "express";
export declare const getCart: (req: Request, res: Response) => Promise<void>;
export declare const addToCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateQuantity: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeFromCart: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=cart.controller.d.ts.map