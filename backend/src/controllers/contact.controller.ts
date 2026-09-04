import logger from "../lib/logger";
import { Request, Response } from "express";
import { submitContactMessage, getContactMessages } from "../services/contact.service";

// POST /api/contact — public
export const submitContactMessageCtrl = async (req: Request, res: Response) => {
  try {
    const result = await submitContactMessage(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    logger.error({ err: error }, "Error in submitContactMessage controller");
    res.status(500).json({ message: "Failed to send your message. Please try again." });
  }
};

// GET /api/contact — requireAuth, requireAdmin
export const getContactMessagesCtrl = async (_req: Request, res: Response) => {
  try {
    const messages = await getContactMessages();
    res.json(messages);
  } catch (error: any) {
    logger.error({ err: error }, "Error in getContactMessages controller");
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};
