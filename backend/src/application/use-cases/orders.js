import { Order } from '../../domain/entities/Order.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export const makeOrders = ({
  orders,
  emailService,
  adminEmail = '',
  paymentInstructions = 'Entorno de prueba: no realices transferencias. Solicita los datos de pago al administrador.',
  logger = console,
}) => ({
  list: (user) => orders.list(user.role === 'admin' ? null : user.id),
  get: async (id, user) => {
    const order = await orders.findById(id);
    if (!order) throw new DomainError('Pedido no encontrado.', 404);
    if (user.role !== 'admin' && Number(order.user_id) !== Number(user.id)) throw new DomainError('No tienes acceso a este pedido.', 403);
    return order;
  },
  create: async (user, items) => {
    Order.validateItems(items);
    const order = await orders.create(user.id, items);
    const customer = { id: user.id, name: user.name, email: user.email };
    const notifications = { customer: 'failed', admin: adminEmail ? 'failed' : 'skipped' };

    if (emailService && customer.email) {
      try {
        await emailService.sendOrderConfirmation({ to: customer.email, customer, order, paymentInstructions });
        notifications.customer = 'sent';
      } catch (error) {
        logger.error?.(`No se pudo enviar confirmación del pedido ${order.id}:`, error);
      }
    }
    if (emailService && adminEmail) {
      try {
        await emailService.sendAdminOrderNotification({ to: adminEmail, customer, order });
        notifications.admin = 'sent';
      } catch (error) {
        logger.error?.(`No se pudo notificar al administrador del pedido ${order.id}:`, error);
      }
    }

    return { ...order, payment_instructions: paymentInstructions, email_notifications: notifications };
  },
  updateStatus: async (id, status) => {
    if (!['pending', 'paid', 'shipped', 'cancelled'].includes(status)) throw new DomainError('Estado de pedido inválido.');
    const result = await orders.updateStatus(id, status);
    if (!result) throw new DomainError('Pedido no encontrado.', 404);
    return result;
  },
  cancel: async (id, user) => {
    const result = await orders.cancel(id, user.role === 'admin' ? null : user.id);
    if (!result) throw new DomainError('No se puede cancelar: revisa el pedido, el propietario y su estado.', 409);
    return result;
  },
});
