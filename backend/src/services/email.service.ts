import { Resend } from "resend";
import logger from "../lib/logger";
import {
  getWelcomeEmailHtml,
  getOrderConfirmationEmailHtml,
  getOrderStatusEmailHtml,
  getPasswordResetEmailHtml,
  getEmailVerificationHtml
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
  return process.env.EMAIL_FROM || "MerchStore <onboarding@resend.dev>";
};

const getFrontendUrl = (): string => {
  return process.env.FRONTEND_URL || "http://localhost:3000";
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
      subject: "Welcome to MerchStore! 🚗💨",
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
      subject: `Order Confirmation #${params.order.orderNumber} - MerchStore`,
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
      subject: `Order #${params.order.orderNumber} Update: ${params.newStatus}`,
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
      subject: "Reset Your MerchStore Password",
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
