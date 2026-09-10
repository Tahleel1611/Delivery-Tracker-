import nodemailer from 'nodemailer';

type NotificationEmail = {
  to: string;
  orderRef: string;
  orderId: string;
  sellerName: string;
  status: 'OUT_FOR_DELIVERY' | 'DELIVERED';
};

function getTransporter() {
  if (process.env.EMAIL_SERVER) return nodemailer.createTransport(process.env.EMAIL_SERVER);
  return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
}

export async function sendDeliveryNotification(email: NotificationEmail) {
  const baseUrl = process.env.TRACKING_WEB_BASE_URL ?? 'http://localhost:3001';
  const orderUrl = `${baseUrl}/buyer/orders/${encodeURIComponent(email.orderId)}`;
  const subject = email.status === 'OUT_FOR_DELIVERY'
    ? `Your order #${email.orderRef} from ${email.sellerName} is on the way!`
    : `Your order #${email.orderRef} has been successfully delivered.`;
  const text = email.status === 'OUT_FOR_DELIVERY'
    ? `Your order #${email.orderRef} from ${email.sellerName} is on the way! Track it here: ${orderUrl}`
    : `Your order #${email.orderRef} has been successfully delivered. View order details: ${orderUrl}`;

  const result = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM ?? 'OMS <no-reply@example.com>',
    to: email.to,
    subject,
    text,
    html: `<p>${text.replace(orderUrl, `<a href="${orderUrl}">View your order</a>`)}</p>`
  });
  return result.messageId;
}