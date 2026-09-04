import logger from "../lib/logger";
import prisma from "../lib/prisma";
import { sendContactNotification } from "./email.service";

interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export const submitContactMessage = async (data: ContactMessageInput) => {
  const saved = await prisma.contactMessage.create({ data });

  // Fire-and-forget, same pattern as the rest of the app's transactional
  // email: a failed notification must never fail the submission itself — the
  // message is already safely stored either way.
  sendContactNotification({
    name: saved.name,
    email: saved.email,
    message: saved.message,
  }).catch((err) => logger.error({ err }, "[ContactService] Notification email background error"));

  return { message: "Thanks for reaching out — we'll get back to you soon." };
};

/** Newest first — this is a small, low-volume inbox, not a paginated list. */
export const getContactMessages = async () => {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
};
