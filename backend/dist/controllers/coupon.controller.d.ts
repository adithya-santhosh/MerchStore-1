import { Request, Response } from "express";
export declare const getCoupons: (req: Request, res: Response) => Promise<void>;
export declare const createNewCoupon: (req: Request, res: Response) => Promise<void>;
export declare const editCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const removeCoupon: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const validatePromoCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=coupon.controller.d.ts.map