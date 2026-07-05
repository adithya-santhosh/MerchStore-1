import { Request, Response } from "express";
export declare const placeOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const listOrders: (req: Request, res: Response) => Promise<void>;
export declare const getOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminListOrders: (req: Request, res: Response) => Promise<void>;
export declare const adminGetOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminUpdateStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=order.controller.d.ts.map