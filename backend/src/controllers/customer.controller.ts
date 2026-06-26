import { Request, Response } from "express";
import { getAllCustomers, getCustomerById, getCustomerStats } from "../services/customer.service";

// ─── List customers (paginated) ──────────────────────────────────────────────

export const listCustomers = async (req: Request, res: Response) => {
  try {
    const result = await getAllCustomers({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 15,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as string,
    });
    res.json(result);
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

// ─── Get single customer detail ──────────────────────────────────────────────

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    const customer = await getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(customer);
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    res.status(500).json({ message: "Failed to fetch customer" });
  }
};

// ─── Customer stats ──────────────────────────────────────────────────────────

export const getCustomerStatsCtrl = async (req: Request, res: Response) => {
  try {
    const stats = await getCustomerStats();
    res.json(stats);
  } catch (error) {
    console.error("Failed to fetch customer stats:", error);
    res.status(500).json({ message: "Failed to fetch customer stats" });
  }
};
