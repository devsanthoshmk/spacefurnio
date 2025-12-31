/**
 * ===========================================
 * EMAIL SERVICE
 * ===========================================
 * Uses Resend SDK (works with Cloudflare Workers)
 * https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/
 *
 * Required env variables:
 * - RESEND_API_KEY: Your Resend API key
 * - EMAIL_FROM: Sender email (e.g., 'Spacefurnio <noreply@spacefurnio.in>')
 */

import { Resend } from 'resend';

/**
 * Send magic link email
 * @param {Object} env - Environment bindings
 * @param {string} to - Recipient email
 * @param {string} magicLinkUrl - Magic link URL
 */
export async function sendMagicLinkEmail(env, to, magicLinkUrl) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Sign in to Spacefurnio</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #eee;">
                  <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 700;">
                    Spacefurnio
                  </h1>
                  <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
                    Premium Furniture for Modern Living
                  </p>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 22px;">
                    Sign in to your account
                  </h2>
                  <p style="margin: 0 0 30px; color: #444; font-size: 16px; line-height: 1.6;">
                    Click the button below to sign in to your Spacefurnio account. This link will expire in 15 minutes.
                  </p>

                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${magicLinkUrl}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          Sign In
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 30px 0 0; color: #888; font-size: 14px; line-height: 1.6;">
                    If you didn't request this email, you can safely ignore it.
                  </p>

                  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

                  <p style="margin: 0; color: #888; font-size: 12px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                    <br>
                    <a href="${magicLinkUrl}" style="color: #666; word-break: break-all;">
                      ${magicLinkUrl}
                    </a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #888; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Spacefurnio. All rights reserved.
                    <br>
                    <a href="https://spacefurnio.in" style="color: #666;">spacefurnio.in</a>
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

  const text = `
Sign in to Spacefurnio

Click this link to sign in to your account:
${magicLinkUrl}

This link will expire in 15 minutes.

If you didn't request this email, you can safely ignore it.

© ${new Date().getFullYear()} Spacefurnio
  `.trim();

  await sendEmail(env, {
    to,
    subject: 'Sign in to Spacefurnio',
    html,
    text
  });
}

/**
 * Send order confirmation email
 * @param {Object} env - Environment bindings
 * @param {string} to - Recipient email
 * @param {Object} order - Order details
 */
export async function sendOrderConfirmationEmail(env, to, order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;">
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-weight: 600;">${item.product_name}</p>
        <p style="margin: 4px 0 0; color: #666; font-size: 14px;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">
        ₹${item.total_price.toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Order Confirmation - Spacefurnio</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid #eee;">
                  <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 700;">
                    Order Confirmed! 🎉
                  </h1>
                  <p style="margin: 8px 0 0; color: #666; font-size: 14px;">
                    Thank you for shopping with Spacefurnio
                  </p>
                </td>
              </tr>

              <!-- Order Info -->
              <tr>
                <td style="padding: 30px 40px;">
                  <table width="100%">
                    <tr>
                      <td>
                        <p style="margin: 0; color: #888; font-size: 14px;">Order Number</p>
                        <p style="margin: 4px 0 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">${order.order_number}</p>
                      </td>
                      <td style="text-align: right;">
                        <p style="margin: 0; color: #888; font-size: 14px;">Order Date</p>
                        <p style="margin: 4px 0 0; color: #1a1a1a; font-size: 14px;">${new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <table width="100%">
                    ${itemsHtml}
                  </table>
                </td>
              </tr>

              <!-- Totals -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <table width="100%" style="background-color: #fafafa; border-radius: 8px; padding: 20px;">
                    <tr>
                      <td style="padding: 8px 0;">Subtotal</td>
                      <td style="text-align: right;">₹${order.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                    ${order.discount_total > 0 ? `
                    <tr>
                      <td style="padding: 8px 0; color: #16a34a;">Discount</td>
                      <td style="text-align: right; color: #16a34a;">-₹${order.discount_total.toLocaleString('en-IN')}</td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 8px 0;">Shipping</td>
                      <td style="text-align: right;">${order.shipping_total === 0 ? 'FREE' : '₹' + order.shipping_total.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;">Tax (GST)</td>
                      <td style="text-align: right;">₹${order.tax_total.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td style="padding: 16px 0 0; font-size: 18px; font-weight: 700; border-top: 1px solid #ddd;">Total</td>
                      <td style="text-align: right; padding: 16px 0 0; font-size: 18px; font-weight: 700; border-top: 1px solid #ddd;">₹${order.total.toLocaleString('en-IN')}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <h3 style="margin: 0 0 12px; font-size: 16px;">Shipping Address</h3>
                  <p style="margin: 0; color: #444; line-height: 1.6;">
                    ${order.shipping_address.first_name} ${order.shipping_address.last_name}<br>
                    ${order.shipping_address.address_line1}<br>
                    ${order.shipping_address.address_line2 ? order.shipping_address.address_line2 + '<br>' : ''}
                    ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.postal_code}<br>
                    ${order.shipping_address.phone}
                  </p>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 0 40px 40px; text-align: center;">
                  <a href="${env.FRONTEND_URL}/orders/${order.id}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                    View Order Details
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #fafafa; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="margin: 0 0 8px; color: #666; font-size: 14px;">
                    Questions? Contact us at <a href="mailto:support@spacefurnio.in" style="color: #1a1a1a;">support@spacefurnio.in</a>
                  </p>
                  <p style="margin: 0; color: #888; font-size: 12px;">
                    © ${new Date().getFullYear()} Spacefurnio. All rights reserved.
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

  await sendEmail(env, {
    to,
    subject: `Order Confirmed - ${order.order_number}`,
    html,
    text: `Your order ${order.order_number} has been confirmed. Total: ₹${order.total.toLocaleString('en-IN')}`
  });
}

/**
 * Send email using Resend SDK
 * @param {Object} env - Environment bindings
 * @param {Object} options - Email options
 */
async function sendEmail(env, { to, subject, html, text }) {
  const resend = new Resend(env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM || 'Spacefurnio <noreply@spacefurnio.in>',
    to: [to],
    subject,
    html,
    text
  });

  if (error) {
    console.error('Email send failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log('Email sent successfully:', data.id);
  return data;
}

export default { sendMagicLinkEmail, sendOrderConfirmationEmail, sendEmail };
