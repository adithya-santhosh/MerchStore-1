export const getWelcomeEmailHtml = (name: string, frontendUrl: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MerchStore</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 32px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">MerchStore</h1>
                <p style="margin: 6px 0 0 0; color: #e0f2fe; font-size: 14px; font-weight: 500;">Premium Auto Parts & Automotive Merch</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h2 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 22px;">Welcome aboard, ${name}! 👋</h2>
                <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                  Thank you for registering at MerchStore. Your account has been successfully created. Explore our curated catalog of OEM & aftermarket performance parts, car accessories, and exclusive merch tailored for your vehicle.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${frontendUrl}" style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);">
                    Start Exploring Shop
                  </a>
                </div>
                <p style="margin: 0; color: #64748b; font-size: 13px; text-align: center; line-height: 1.5;">
                  If you have any questions or need assistance with vehicle compatibility, feel free to reply to this email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; border-top: 1px solid #334155;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">© ${new Date().getFullYear()} MerchStore Inc. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const getOrderConfirmationEmailHtml = (order: any, frontendUrl: string): string => {
  const itemsHtml = (order.items || [])
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #f8fafc; font-size: 14px;">
          ${item.productName}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #94a3b8; font-size: 14px; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #334155; color: #38bdf8; font-size: 14px; text-align: right; font-weight: 600;">
          ₹${Number(item.totalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </td>
      </tr>
    `
    )
    .join("");

  const address = order.shippingAddress;
  const addressStr = address
    ? `${address.addressLine1}${address.addressLine2 ? ", " + address.addressLine2 : ""}, ${address.city}, ${address.state} - ${address.postalCode}`
    : "Address on file";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${order.orderNumber}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Order Confirmed! 🎉</h1>
                <p style="margin: 6px 0 0 0; color: #ecfdf5; font-size: 14px;">Order #${order.orderNumber}</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px;">
                  Thank you for your order! We have received your order details and are preparing it for shipment.
                </p>

                <!-- Order Table -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse; background-color: #0f172a; border-radius: 8px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #334155;">
                      <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Item</th>
                      <th style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Qty</th>
                      <th style="padding: 12px; text-align: right; color: #94a3b8; font-size: 12px; text-transform: uppercase;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <!-- Summary & Totals -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;">Subtotal:</td>
                    <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">₹${Number(order.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  ${
                    Number(order.discountAmount) > 0
                      ? `<tr>
                    <td style="padding: 4px 0; color: #10b981; font-size: 14px;">Discount:</td>
                    <td style="padding: 4px 0; color: #10b981; font-size: 14px; text-align: right;">-₹${Number(order.discountAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    Number(order.taxAmount) > 0
                      ? `<tr>
                    <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;">Tax:</td>
                    <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">₹${Number(order.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>`
                      : ""
                  }
                  ${
                    Number(order.shippingCost) > 0
                      ? `<tr>
                    <td style="padding: 4px 0; color: #94a3b8; font-size: 14px;">Shipping:</td>
                    <td style="padding: 4px 0; color: #f8fafc; font-size: 14px; text-align: right;">₹${Number(order.shippingCost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>`
                      : ""
                  }
                  <tr style="border-top: 1px solid #334155;">
                    <td style="padding: 12px 0 0 0; color: #f8fafc; font-size: 16px; font-weight: 700;">Grand Total:</td>
                    <td style="padding: 12px 0 0 0; color: #38bdf8; font-size: 18px; font-weight: 700; text-align: right;">₹${Number(order.totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                </table>

                <!-- Shipping Address Card -->
                <div style="background-color: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #334155; margin-bottom: 24px;">
                  <h4 style="margin: 0 0 8px 0; color: #38bdf8; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h4>
                  <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">${addressStr}</p>
                </div>

                <div style="text-align: center; margin-top: 28px;">
                  <a href="${frontendUrl}/orders/${order.id}" style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                    View Order Details
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; border-top: 1px solid #334155;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">Thank you for shopping with MerchStore!</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const getOrderStatusEmailHtml = (order: any, newStatus: string, frontendUrl: string): string => {
  const statusColors: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: "#0284c7", text: "#e0f2fe" },
    PROCESSING: { bg: "#6366f1", text: "#e0e7ff" },
    SHIPPED: { bg: "#8b5cf6", text: "#f3e8ff" },
    DELIVERED: { bg: "#10b981", text: "#ecfdf5" },
    CANCELLED: { bg: "#ef4444", text: "#fef2f2" }
  };

  const badgeStyle = statusColors[newStatus] || { bg: "#475569", text: "#f8fafc" };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Status Update - ${order.orderNumber}</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <!-- Header -->
            <tr>
              <td style="background-color: #1e293b; padding: 28px; text-align: center; border-bottom: 1px solid #334155;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Order Status Update</h1>
                <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 14px;">Order #${order.orderNumber}</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 32px; text-align: center;">
                <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px;">
                  Your order status has been updated to:
                </p>
                <div style="margin-bottom: 28px;">
                  <span style="background-color: ${badgeStyle.bg}; color: ${badgeStyle.text}; font-weight: 700; font-size: 16px; padding: 10px 24px; border-radius: 20px; display: inline-block; letter-spacing: 1px;">
                    ${newStatus}
                  </span>
                </div>
                <p style="margin: 0 0 28px 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                  ${
                    newStatus === "SHIPPED"
                      ? "Your items are on the way! You can track package updates in your account dashboard."
                      : newStatus === "DELIVERED"
                      ? "Your package has been delivered! We hope you enjoy your purchase."
                      : "We are keeping your order updated at every step of the fulfillment process."
                  }
                </p>
                <div>
                  <a href="${frontendUrl}/orders/${order.id}" style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">
                    Track Order
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; border-top: 1px solid #334155;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">© ${new Date().getFullYear()} MerchStore</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const getPasswordResetEmailHtml = (name: string, resetUrl: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); padding: 28px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Password Reset Request</h1>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 36px 32px;">
                <h3 style="margin: 0 0 16px 0; color: #f8fafc; font-size: 18px;">Hello ${name || "Customer"},</h3>
                <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                  We received a request to reset your password for your MerchStore account. Click the button below to choose a new password. This link is valid for <strong>60 minutes</strong>.
                </p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${resetUrl}" style="background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                    Reset Password
                  </a>
                </div>
                <p style="margin: 0 0 16px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  If the button above does not work, copy and paste the following link into your web browser:
                </p>
                <p style="margin: 0 0 24px 0; font-size: 12px; word-break: break-all;">
                  <a href="${resetUrl}" style="color: #38bdf8;">${resetUrl}</a>
                </p>
                <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.5;">
                  If you did not request a password reset, please ignore this email. Your password will remain unchanged.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color: #0f172a; padding: 20px 32px; text-align: center; border-top: 1px solid #334155;">
                <p style="margin: 0; color: #64748b; font-size: 12px;">© ${new Date().getFullYear()} MerchStore Security</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};

export const getEmailVerificationHtml = (name: string, verifyUrl: string): string => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e2e8f0;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155;">
            <tr>
              <td style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); padding: 28px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800;">Confirm Your Email</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <p style="margin: 0 0 16px 0; color: #e2e8f0; font-size: 16px;">Hi ${name},</p>
                <p style="margin: 0 0 24px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Confirm this email address so we can send you order confirmations and delivery updates. This link is valid for 24 hours.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${verifyUrl}" style="background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                    Confirm Email Address
                  </a>
                </div>
                <p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 12px; line-height: 1.6;">
                  If the button doesn't work, paste this into your browser:<br>
                  <span style="color: #38bdf8; word-break: break-all;">${verifyUrl}</span>
                </p>
                <p style="margin: 20px 0 0 0; color: #64748b; font-size: 12px; line-height: 1.6;">
                  Didn't create an account? You can safely ignore this email — nothing will happen without confirmation.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
