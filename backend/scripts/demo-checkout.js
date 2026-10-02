import cors from 'cors';
import express from 'express';
import nodemailer from 'nodemailer';
import { makeOrders } from '../src/application/use-cases/orders.js';
import { NodemailerAdapter } from '../src/infrastructure/adapters/outbound/NodemailerAdapter.js';

// Local-only evidence harness: demo identities, products, and in-memory orders.
// It reuses the real order use case and Nodemailer adapter but never connects to PostgreSQL.
const account = await nodemailer.createTestAccount();
const transporter = nodemailer.createTransport({
  host: account.smtp.host,
  port: account.smtp.port,
  secure: account.smtp.secure,
  auth: { user: account.user, pass: account.pass },
});
const adapter = new NodemailerAdapter({ transporter, from: 'NEXUS Demo <nexus@example.test>' });
const emailService = {
  async sendOrderConfirmation(message) {
    const info = await adapter.sendOrderConfirmation(message);
    console.log(`Vista previa correo cliente: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  },
  async sendAdminOrderNotification(message) {
    const info = await adapter.sendAdminOrderNotification(message);
    console.log(`Vista previa correo administrador: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  },
};

const user = { id: 1, name: 'Cliente Demo', email: 'cliente.demo@example.test', role: 'customer' };
const products = [{
  id: 42,
  name: 'PC Gamer Demo · RTX 4060',
  category: 'PC armada',
  description: 'Artículo ficticio para demostrar checkout y notificaciones. Sin venta ni cobro real.',
  price_mxn: '2499.00',
  stock: 5,
  image_url: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80',
  source_url: '',
}];
const storedOrders = [];
let nextId = 9001;
const ordersRepository = {
  async create(userId, requestedItems) {
    const items = requestedItems.map(({ productId, quantity }) => {
      const product = products.find((entry) => entry.id === Number(productId));
      if (!product || Number(quantity) > product.stock) throw new Error('Producto demo agotado o no encontrado.');
      return {
        product_id: product.id,
        product_name: product.name,
        unit_price_mxn: product.price_mxn,
        quantity: Number(quantity),
        line_total_mxn: (Number(product.price_mxn) * Number(quantity)).toFixed(2),
      };
    });
    const order = {
      id: nextId++,
      user_id: userId,
      status: 'pending',
      total_mxn: items.reduce((sum, item) => sum + Number(item.line_total_mxn), 0).toFixed(2),
      created_at: new Date().toISOString(),
      items,
    };
    storedOrders.unshift(order);
    return order;
  },
  async list() { return storedOrders; },
  async findById(id) { return storedOrders.find((order) => order.id === Number(id)) || null; },
  async updateStatus() { return null; },
  async cancel() { return null; },
};
const orderUseCase = makeOrders({
  orders: ordersRepository,
  emailService,
  adminEmail: 'admin.demo@example.test',
  paymentInstructions: 'CORREO DE DEMOSTRACIÓN. No realices transferencias ni pagos. Esta compra y sus datos son ficticios.',
  logger: console,
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.get('/api/products', (_request, response) => response.json(products));
app.post('/api/auth/login', (_request, response) => response.json({
  token: 'local-demo-token-not-for-production',
  user,
}));
app.post('/api/auth/register', (_request, response) => response.status(201).json({
  token: 'local-demo-token-not-for-production',
  user,
}));
app.get('/api/orders', (_request, response) => response.json(storedOrders));
app.post('/api/orders', async (request, response) => {
  try {
    const result = await orderUseCase.create(user, request.body?.items);
    response.status(201).json(result);
  } catch (error) {
    response.status(error.statusCode || 400).json({ error: error.message });
  }
});

const port = Number(process.env.DEMO_PORT || 4001);
app.listen(port, '127.0.0.1', () => {
  console.log(`Checkout demo local: http://localhost:${port}/api (solo datos ficticios; sin PostgreSQL).`);
  console.log('Credenciales demo: cualquier correo y contraseña de 8+ caracteres.');
  console.log('Al registrar un pedido se enviarán dos mensajes de prueba a Ethereal.');
});
