import test from 'node:test';
import assert from 'node:assert/strict';
import { makeOrders } from './orders.js';
import { orderConfirmationEmail, adminNewOrderEmail } from '../../infrastructure/adapters/outbound/emailTemplates.js';

const sampleOrder = {
  id: 7,
  status: 'pending',
  total_mxn: '1250.00',
  created_at: '2026-10-02T12:00:00.000Z',
  items: [{ product_id: 3, product_name: 'GPU de prueba', quantity: 1, unit_price_mxn: '1250.00', line_total_mxn: '1250.00' }],
};

test('crear pedido notifica cliente y admin después de persistir, manteniendo estado pending', async () => {
  const events = [];
  const useCase = makeOrders({
    orders: { create: async () => { events.push('persisted'); return sampleOrder; } },
    adminEmail: 'admin@example.test',
    paymentInstructions: 'Instrucciones ficticias.',
    emailService: {
      sendOrderConfirmation: async ({ to, order }) => { events.push(`customer:${to}:${order.status}`); },
      sendAdminOrderNotification: async ({ to, order }) => { events.push(`admin:${to}:${order.status}`); },
    },
    logger: { error() {} },
  });
  const result = await useCase.create({ id: 11, name: 'Ana Demo', email: 'ana@example.test' }, [{ productId: 3, quantity: 1 }]);
  assert.deepEqual(events, ['persisted', 'customer:ana@example.test:pending', 'admin:admin@example.test:pending']);
  assert.equal(result.status, 'pending');
  assert.deepEqual(result.email_notifications, { customer: 'sent', admin: 'sent' });
  assert.equal(result.payment_instructions, 'Instrucciones ficticias.');
});

test('fallo de correo no borra ni oculta un pedido ya persistido', async () => {
  const useCase = makeOrders({
    orders: { create: async () => sampleOrder },
    adminEmail: 'admin@example.test',
    emailService: {
      sendOrderConfirmation: async () => { throw new Error('SMTP offline'); },
      sendAdminOrderNotification: async () => {},
    },
    logger: { error() {} },
  });
  const result = await useCase.create({ id: 11, name: 'Ana Demo', email: 'ana@example.test' }, [{ productId: 3, quantity: 1 }]);
  assert.equal(result.id, 7);
  assert.deepEqual(result.email_notifications, { customer: 'failed', admin: 'sent' });
});

test('plantillas incluyen partidas e instrucciones y escapan contenido de usuario', () => {
  const customer = { name: '<img src=x onerror=alert(1)>', email: 'ana@example.test' };
  const confirmation = orderConfirmationEmail({ customer, order: sampleOrder, paymentInstructions: 'No pagar <script>alert(1)</script>' });
  const admin = adminNewOrderEmail({ customer, order: sampleOrder });
  assert.match(confirmation.subject, /Pendiente de pago/);
  assert.match(confirmation.html, /Pendiente de Pago/);
  assert.match(confirmation.html, /&lt;script&gt;/);
  assert.doesNotMatch(confirmation.html, /<script>/);
  assert.doesNotMatch(admin.html, /<img src=x/);
  assert.match(confirmation.text, /GPU de prueba/);
});
