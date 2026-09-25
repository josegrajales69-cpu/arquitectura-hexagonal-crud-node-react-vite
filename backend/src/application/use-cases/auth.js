import { User } from '../../domain/entities/User.js';
import { DomainError } from '../../domain/errors/DomainError.js';

export const makeAuth = ({ users, passwords, tokens }) => ({
  register: async (input) => {
    User.validateRegistration(input);
    if (await users.findByEmail(input.email.toLowerCase())) throw new DomainError('Ese correo ya está registrado.', 409);
    const password_hash = await passwords.hash(input.password);
    const user = await users.create({ name: input.name.trim(), email: input.email.toLowerCase(), password_hash, role: 'customer' });
    return { user, token: tokens.sign(user) };
  },
  login: async ({ email, password }) => {
    const user = await users.findByEmail((email ?? '').toLowerCase());
    if (!user || !(await passwords.compare(password ?? '', user.password_hash))) throw new DomainError('Correo o contraseña incorrectos.', 401);
    return { user: publicUser(user), token: tokens.sign(user) };
  },
});

export const publicUser = ({ password_hash, ...user }) => user;
