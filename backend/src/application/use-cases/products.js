import { Product } from '../../domain/entities/Product.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export const makeProducts = ({ products }) => ({
  list: (filters) => products.list(filters),
  get: async (id) => { const p = await products.findById(id); if (!p) throw new DomainError('Producto no encontrado.', 404); return p; },
  create: async (data) => { Product.validate(data); return products.create(data); },
  update: async (id, data) => {
    const current = await products.findById(id);
    if (!current) throw new DomainError('Producto no encontrado.', 404);
    const merged = { ...current, ...data };
    Product.validate(merged);
    return products.update(id, data);
  },
  delete: async (id) => { if (!(await products.delete(id))) throw new DomainError('Producto no encontrado o ya asociado a un pedido.', 409); return { message: 'Producto eliminado.' }; },
});
