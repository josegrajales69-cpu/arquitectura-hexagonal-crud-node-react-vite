import { User } from '../../domain/entities/User.js';
import { DomainError } from '../../domain/errors/DomainError.js';
import { publicUser } from './auth.js';

export const makeUsers = ({ users, passwords }) => ({
  list: async () => (await users.list()).map(publicUser),
  get: async (id) => { const u = await users.findById(id); if (!u) throw new DomainError('Usuario no encontrado.', 404); return publicUser(u); },
  create: async (data) => {
    User.validateRegistration(data);
    if (await users.findByEmail(data.email.toLowerCase())) throw new DomainError('Ese correo ya está registrado.', 409);
    return publicUser(await users.create({ ...data, email: data.email.toLowerCase(), password_hash: await passwords.hash(data.password) }));
  },
  update: async (id, data) => {
    if (data.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(data.password)) throw new DomainError('La contraseña debe tener 8 caracteres, mayúscula, minúscula y número.');
    const update = { ...data };
    if (update.password) { update.password_hash = await passwords.hash(update.password); delete update.password; }
    if (update.email) update.email = update.email.toLowerCase();
    const user = await users.update(id, update);
    if (!user) throw new DomainError('Usuario no encontrado.', 404);
    return publicUser(user);
  },
  delete: async (id) => { if (!(await users.delete(id))) throw new DomainError('Usuario no encontrado.', 404); return { message: 'Usuario eliminado.' }; },
});
