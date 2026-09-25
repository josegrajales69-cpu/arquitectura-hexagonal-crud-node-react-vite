import jwt from 'jsonwebtoken';

export const tokens = {
  sign: ({ id, name, email, role }) => jwt.sign({ sub: id, name, email, role }, process.env.JWT_SECRET, { expiresIn: '8h' }),
  verify: (token) => jwt.verify(token, process.env.JWT_SECRET),
};
