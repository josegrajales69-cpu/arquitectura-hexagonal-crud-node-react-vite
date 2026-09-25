import bcrypt from 'bcryptjs';

export const passwords = {
  hash: (value) => bcrypt.hash(value, 12),
  compare: (value, hash) => bcrypt.compare(value, hash),
};
