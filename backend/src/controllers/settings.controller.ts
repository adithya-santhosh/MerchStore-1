import { Request, Response } from "express";
import { getSettings, updateSettings } from "../services/settings.service";

export const getSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error: any) {
    console.error("Error in getSystemSettings controller:", error);
    res.status(500).json({ message: error.message || "Failed to load settings" });
  }
};

export const editSystemSettings = async (req: Request, res: Response) => {
  try {
    const settings = await updateSettings(req.body);
    res.json(settings);
  } catch (error: any) {
    console.error("Error in editSystemSettings controller:", error);
    res.status(500).json({ message: error.message || "Failed to update settings" });
  }
};
