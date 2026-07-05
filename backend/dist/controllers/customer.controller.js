"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerStatsCtrl = exports.getCustomer = exports.listCustomers = void 0;
const customer_service_1 = require("../services/customer.service");
// ─── List customers (paginated) ──────────────────────────────────────────────
const listCustomers = async (req, res) => {
    try {
        const result = await (0, customer_service_1.getAllCustomers)({
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 15,
            search: req.query.search,
            sortBy: req.query.sortBy,
            sortOrder: req.query.sortOrder,
        });
        res.json(result);
    }
    catch (error) {
        console.error("Failed to fetch customers:", error);
        res.status(500).json({ message: "Failed to fetch customers" });
    }
};
exports.listCustomers = listCustomers;
// ─── Get single customer detail ──────────────────────────────────────────────
const getCustomer = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ message: "Invalid customer ID" });
        }
        const customer = await (0, customer_service_1.getCustomerById)(id);
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }
        res.json(customer);
    }
    catch (error) {
        console.error("Failed to fetch customer:", error);
        res.status(500).json({ message: "Failed to fetch customer" });
    }
};
exports.getCustomer = getCustomer;
// ─── Customer stats ──────────────────────────────────────────────────────────
const getCustomerStatsCtrl = async (req, res) => {
    try {
        const stats = await (0, customer_service_1.getCustomerStats)();
        res.json(stats);
    }
    catch (error) {
        console.error("Failed to fetch customer stats:", error);
        res.status(500).json({ message: "Failed to fetch customer stats" });
    }
};
exports.getCustomerStatsCtrl = getCustomerStatsCtrl;
//# sourceMappingURL=customer.controller.js.map