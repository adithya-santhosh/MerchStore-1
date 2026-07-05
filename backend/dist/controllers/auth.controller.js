"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.becomeMember = exports.updateProfile = exports.me = exports.login = exports.register = void 0;
const auth_service_1 = require("../services/auth.service");
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const result = await (0, auth_service_1.registerUser)(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error("Error in register controller:", error);
        res.status(400).json({ message: error.message || "Registration failed" });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const result = await (0, auth_service_1.loginUser)(req.body);
        res.json(result);
    }
    catch (error) {
        console.error("Error in login controller:", error);
        res.status(401).json({ message: error.message || "Invalid credentials" });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const user = await (0, auth_service_1.getUserById)(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error("Error in me controller:", error);
        res.status(500).json({ message: "Failed to retrieve user details" });
    }
};
exports.me = me;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const { firstName, lastName, phone } = req.body;
        if (!firstName || !lastName) {
            return res.status(400).json({ message: "First name and last name are required" });
        }
        const updatedUser = await (0, auth_service_1.updateUserProfile)(req.user.id, { firstName, lastName, phone });
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error in updateProfile controller:", error);
        res.status(500).json({ message: error.message || "Failed to update profile" });
    }
};
exports.updateProfile = updateProfile;
const becomeMember = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const updatedUser = await (0, auth_service_1.becomeMemberUser)(req.user.id);
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Error in becomeMember controller:", error);
        res.status(500).json({ message: error.message || "Failed to activate membership" });
    }
};
exports.becomeMember = becomeMember;
//# sourceMappingURL=auth.controller.js.map