import { DomainError } from '../errors/DomainError.js';

export class Product {
  static validate({ name, category, description, price_mxn, stock, image_url }) {
    if (!name?.trim() || !category?.trim() || !description?.trim()) throw new DomainError('Completa nombre, categoría y descripción.');
    if (!Number.isFinite(Number(price_mxn)) || Number(price_mxn) < 0) throw new DomainError('El precio debe ser un número positivo.');
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) throw new DomainError('El inventario debe ser un entero igual o mayor que cero.');
    if (!image_url?.trim()) throw new DomainError('El producto necesita una imagen.');
  }
}
