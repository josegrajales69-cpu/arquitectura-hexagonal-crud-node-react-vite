import nodemailer from 'nodemailer';
import { EmailServicePort } from '../../../application/ports/EmailServicePort.js';
import { adminNewOrderEmail, orderConfirmationEmail } from './emailTemplates.js';

export class NodemailerAdapter extends EmailServicePort {
  constructor({ transporter, from }) {
    super();
    this.transporter = transporter;
    this.from = from;
  }

  static fromEnvironment(env = process.env) {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM } = env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
      throw new Error('Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y EMAIL_FROM.');
    }
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return new NodemailerAdapter({ transporter, from: EMAIL_FROM });
  }

  async sendOrderConfirmation({ to, customer, order, paymentInstructions }) {
    const message = orderConfirmationEmail({ customer, order, paymentInstructions });
    return this.transporter.sendMail({ from: this.from, to, ...message });
  }

  async sendAdminOrderNotification({ to, customer, order }) {
    const message = adminNewOrderEmail({ customer, order });
    return this.transporter.sendMail({ from: this.from, to, ...message });
  }
}
