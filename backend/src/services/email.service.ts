import { Resend } from "resend";
import logger from "../lib/logger";
import {
  getWelcomeEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  getPasswordResetEmailHtml,
  getEmailVerificationHtml,
  getContactNotificationEmailHtml,
  getAdminNewOrderEmailHtml,
  getSupplierNewOrderEmailHtml,
  getSupplierOrderStatusEmailHtml,
} from "./emailTemplates";

// Lazy-initialize Resend SDK using environment variable
const getResendClient = (): Resend | null => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("[EmailService] RESEND_API_KEY is not set. Email notifications will be logged to console in dev mode.");
    return null;
  }
  return new Resend(apiKey);
};

const getFromAddress = (): string => {
  return process.env.EMAIL_FROM || "OffRoad World <onboarding@resend.dev>";
};

const getFrontendUrl = (): string => {
  return process.env.FRONTEND_URL || "http://localhost:3000";
};

const getContactNotificationEmail = (): string | null => {
  return process.env.CONTACT_NOTIFICATION_EMAIL || null;
};

const getAdminNotificationEmail = (): string | null => {
  return process.env.ADMIN_NOTIFICATION_EMAIL || null;
};

// ─── Email Methods ─────────────────────────────────────────────────────────────

export interface SendWelcomeParams {
  to: string;
  name: string;
}

export const sendWelcomeEmail = async (params: SendWelcomeParams): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getWelcomeEmailHtml(params.name, getFrontendUrl());

    if (!resend) {
      logger.info(`[EmailService DEV] Welcome Email queued for ${params.to}`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: "Welcome to OffRoad World",
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send welcome email");
    } else {
      logger.info(`[EmailService SUCCESS] Welcome email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendWelcomeEmail");
  }
};

export interface SendOrderConfirmationParams {
  to: string;
  order: any;
}

export const sendOrderConfirmationEmail = async (params: SendOrderConfirmationParams): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getOrderConfirmationEmailHtml(params.order, getFrontendUrl());

    if (!resend) {
      logger.info(`[EmailService DEV] Order Confirmation Email queued for ${params.to} (Order #${params.order.orderNumber})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: `Order #${params.order.orderNumber} confirmed`,
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send order confirmation email");
    } else {
      logger.info(`[EmailService SUCCESS] Order confirmation sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendOrderConfirmationEmail");
  }
};

export interface SendOrderStatusParams {
  to: string;
  order: any;
  newStatus: string;
}

export const sendOrderStatusEmail = async (params: SendOrderStatusParams): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getOrderStatusEmailHtml(params.order, params.newStatus, getFrontendUrl());

    if (!resend) {
      logger.info(`[EmailService DEV] Order Status Email queued for ${params.to} (Order #${params.order.orderNumber} -> ${params.newStatus})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: `Order #${params.order.orderNumber} is now ${params.newStatus.toLowerCase()}`,
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send order status email");
    } else {
      logger.info(`[EmailService SUCCESS] Order status email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendOrderStatusEmail");
  }
};

export interface SendPasswordResetParams {
  to: string;
  name: string;
  resetUrl: string;
}

export const sendPasswordResetEmail = async (params: SendPasswordResetParams): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getPasswordResetEmailHtml(params.name, params.resetUrl);

    if (!resend) {
      logger.info(`[EmailService DEV] Password Reset Email queued for ${params.to} (${params.resetUrl})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: "Reset your OffRoad World password",
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send password reset email");
    } else {
      logger.info(`[EmailService SUCCESS] Password reset email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendPasswordResetEmail");
  }
};

export interface SendEmailVerificationParams {
  to: string;
  name: string;
  verifyUrl: string;
}

export const sendEmailVerification = async (params: SendEmailVerificationParams): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getEmailVerificationHtml(params.name, params.verifyUrl);

    if (!resend) {
      logger.info(`[EmailService DEV] Verification Email queued for ${params.to} (${params.verifyUrl})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: "Confirm your email address",
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send verification email");
    } else {
      logger.info(`[EmailService SUCCESS] Verification email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendEmailVerification");
  }
};

export interface SendContactNotificationParams {
  name: string;
  email: string;
  message: string;
}

export const sendContactNotification = async (params: SendContactNotificationParams): Promise<void> => {
  try {
    const to = getContactNotificationEmail();
    if (!to) {
      logger.warn(
        "[EmailService] CONTACT_NOTIFICATION_EMAIL is not set. The message is saved but no one was notified."
      );
      return;
    }

    const resend = getResendClient();
    const html = getContactNotificationEmailHtml(params);

    if (!resend) {
      logger.info(`[EmailService DEV] Contact notification queued for ${to} (from ${params.email})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      // Lets the person monitoring the inbox hit Reply and land straight in
      // the visitor's mailbox, instead of copy-pasting their address out of
      // the message body.
      replyTo: params.email,
      subject: `New contact form message from ${params.name}`,
      html
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send contact notification");
    } else {
      logger.info(`[EmailService SUCCESS] Contact notification sent to ${to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendContactNotification");
  }
};

// ─── Admin: New Order Notification ──────────────────────────────────────────

export const sendAdminNewOrderNotification = async (order: any): Promise<void> => {
  try {
    const to = getAdminNotificationEmail();
    if (!to) {
      logger.warn(
        "[EmailService] ADMIN_NOTIFICATION_EMAIL is not set. No admin order notification will be sent."
      );
      return;
    }

    const resend = getResendClient();
    const html = getAdminNewOrderEmailHtml({
      order,
      adminUrl: getFrontendUrl(),
    });

    if (!resend) {
      logger.info(`[EmailService DEV] Admin new-order notification queued for ${to} (Order #${order.orderNumber})`);
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [to],
      subject: `🛍️ New Order #${order.orderNumber} — ${order.user?.firstName ?? "Guest"} (₹${Number(order.totalAmount ?? 0).toLocaleString("en-IN")})`,
      html,
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send admin new-order notification");
    } else {
      logger.info(`[EmailService SUCCESS] Admin new-order notification sent to ${to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendAdminNewOrderNotification");
  }
};

// ─── Supplier: new order and later status changes ────────────────────────────

export const sendSupplierNewOrderEmail = async (params: {
  to: string;
  order: any;
  items: any[];
}): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getSupplierNewOrderEmailHtml(params.order, params.items, getFrontendUrl());

    if (!resend) {
      logger.info(
        `[EmailService DEV] Supplier new-order email queued for ${params.to} (Order #${params.order.orderNumber})`
      );
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: `Order #${params.order.orderNumber} to fulfill`,
      html,
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send supplier new-order email");
    } else {
      logger.info(`[EmailService SUCCESS] Supplier new-order email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendSupplierNewOrderEmail");
  }
};

export const sendSupplierOrderStatusEmail = async (params: {
  to: string;
  order: any;
  items: any[];
  newStatus: string;
}): Promise<void> => {
  try {
    const resend = getResendClient();
    const html = getSupplierOrderStatusEmailHtml(params.order, params.items, params.newStatus, getFrontendUrl());

    if (!resend) {
      logger.info(
        `[EmailService DEV] Supplier status email queued for ${params.to} (Order #${params.order.orderNumber} -> ${params.newStatus})`
      );
      return;
    }

    const response = await resend.emails.send({
      from: getFromAddress(),
      to: [params.to],
      subject: `Order #${params.order.orderNumber} is now ${params.newStatus.toLowerCase()}`,
      html,
    });

    if (response.error) {
      logger.error({ err: response.error }, "[EmailService ERROR] Failed to send supplier status email");
    } else {
      logger.info(`[EmailService SUCCESS] Supplier status email sent to ${params.to} (ID: ${response.data?.id})`);
    }
  } catch (error) {
    logger.error({ err: error }, "[EmailService ERROR] Exception in sendSupplierOrderStatusEmail");
  }
};
