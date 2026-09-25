import { tokens } from '../../../security/JwtTokenService.js';

export function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    req.user = tokens.verify(token);
    next();
  } catch { res.status(401).json({ error: 'La sesión expiró o no es válida.' }); }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Esta operación requiere permisos de administrador.' });
  next();
}
