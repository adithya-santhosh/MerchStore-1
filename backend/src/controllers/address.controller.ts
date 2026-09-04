import logger from "../lib/logger";
import { Request, Response } from "express";
import { getUserAddresses, createAddress, updateAddress, deleteAddress } from "../services/address.service";

// GET /api/addresses — requireAuth
export const getAddressesCtrl = async (req: Request, res: Response) => {
  try {
    const addresses = await getUserAddresses(req.user!.id);
    res.json(addresses);
  } catch (error: any) {
    logger.error({ err: error }, "Error fetching addresses");
    res.status(500).json({ message: "Failed to fetch addresses" });
  }
};

// POST /api/addresses — requireAuth, validate(createAddressSchema)
export const createAddressCtrl = async (req: Request, res: Response) => {
  try {
    const address = await createAddress(req.user!.id, req.body);
    res.status(201).json(address);
  } catch (error: any) {
    logger.error({ err: error }, "Error creating address");
    res.status(500).json({ message: error.message || "Failed to create address" });
  }
};

// PUT /api/addresses/:id — requireAuth, validate(updateAddressSchema)
export const updateAddressCtrl = async (req: Request, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    if (!addressId || addressId <= 0) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const address = await updateAddress(req.user!.id, addressId, req.body);
    res.json(address);
  } catch (error: any) {
    logger.error({ err: error }, "Error updating address");
    const statusCode = error.message.includes("not found") ? 404 : error.message.includes("own address") ? 403 : 500;
    res.status(statusCode).json({ message: error.message || "Failed to update address" });
  }
};

// DELETE /api/addresses/:id — requireAuth
export const deleteAddressCtrl = async (req: Request, res: Response) => {
  try {
    const addressId = Number(req.params.id);
    if (!addressId || addressId <= 0) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const result = await deleteAddress(req.user!.id, addressId);
    res.json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error deleting address");
    const statusCode = error.message.includes("not found")
      ? 404
      : error.message.includes("own address")
        ? 403
        : error.message.includes("past order")
          ? 409
          : 500;
    res.status(statusCode).json({ message: error.message || "Failed to delete address" });
  }
};
