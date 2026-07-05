"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.editSystemSettings = exports.getSystemSettings = void 0;
const settings_service_1 = require("../services/settings.service");
const getSystemSettings = async (req, res) => {
    try {
        const settings = await (0, settings_service_1.getSettings)();
        res.json(settings);
    }
    catch (error) {
        console.error("Error in getSystemSettings controller:", error);
        res.status(500).json({ message: error.message || "Failed to load settings" });
    }
};
exports.getSystemSettings = getSystemSettings;
const editSystemSettings = async (req, res) => {
    try {
        const settings = await (0, settings_service_1.updateSettings)(req.body);
        res.json(settings);
    }
    catch (error) {
        console.error("Error in editSystemSettings controller:", error);
        res.status(500).json({ message: error.message || "Failed to update settings" });
    }
};
exports.editSystemSettings = editSystemSettings;
//# sourceMappingURL=settings.controller.js.map