import { DomainError } from '../errors/DomainError.js';

export class Order {
  static validateItems(items) {
    if (!Array.isArray(items) || !items.length) throw new DomainError('El pedido debe incluir al menos un producto.');
    for (const item of items) {
      if (!Number.isInteger(Number(item.productId)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1) {
        throw new DomainError('Cada artículo necesita un producto válido y una cantidad entera mayor que cero.');
      }
    }
  }

  static total(items) {
    const cents = items.reduce((sum, item) => sum + Math.round(Number(item.price_mxn) * 100) * Number(item.quantity), 0);
    return Number((cents / 100).toFixed(2));
  }
}
