import nodemailer from 'nodemailer';
import { NodemailerAdapter } from '../src/infrastructure/adapters/outbound/NodemailerAdapter.js';

const account = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: account.smtp.host,
  port: account.smtp.port,
  secure: account.smtp.secure,
  auth: { user: account.user, pass: account.pass },
});
const mail = new NodemailerAdapter({ transporter, from: 'NEXUS Pruebas <nexus@example.test>' });
const customer = { id: 999, name: 'Cliente de prueba', email: 'cliente@example.test' };
const order = {
  id: 9001,
  status: 'pending',
  total_mxn: '2499.00',
  created_at: new Date().toISOString(),
  items: [{ product_id: 42, product_name: 'Producto de prueba', unit_price_mxn: '2499.00', quantity: 1, line_total_mxn: '2499.00' }],
};

const sent = await Promise.all([
  mail.sendOrderConfirmation({
    to: customer.email,
    customer,
    order,
    paymentInstructions: 'Correo de prueba únicamente. No realices pagos.',
  }),
  mail.sendAdminOrderNotification({ to: 'admin@example.test', customer, order }),
]);

console.log('Cuenta Ethereal de prueba creada. No se usaron pedidos ni clientes reales.');
for (const info of sent) console.log(`Vista previa: ${nodemailer.getTestMessageUrl(info)}`);
