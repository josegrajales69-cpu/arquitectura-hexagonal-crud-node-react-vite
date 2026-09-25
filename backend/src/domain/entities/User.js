import { DomainError } from '../errors/DomainError.js';

export class User {
  static validateRegistration({ name, email, password }) {
    if (!name?.trim() || name.trim().length < 2) throw new DomainError('El nombre debe tener al menos 2 caracteres.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '')) throw new DomainError('El correo no tiene un formato válido.');
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password ?? '')) {
      throw new DomainError('La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.');
    }
  }
}
