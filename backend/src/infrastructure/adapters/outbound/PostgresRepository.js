import { pool } from '../../config/database.js';
import { DomainError } from '../../../domain/errors/DomainError.js';
import { Order } from '../../../domain/entities/Order.js';

const users = {
  create: async (u) => (await pool.query('INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id,name,email,role,created_at', [u.name, u.email, u.password_hash, u.role ?? 'customer'])).rows[0],
  findByEmail: async (email) => (await pool.query('SELECT * FROM users WHERE email=$1', [email])).rows[0],
  findById: async (id) => (await pool.query('SELECT * FROM users WHERE id=$1', [id])).rows[0],
  list: async () => (await pool.query('SELECT id,name,email,role,created_at FROM users ORDER BY id')).rows,
  update: async (id, data) => {
    const current = await users.findById(id); if (!current) return null;
    const next = { name: data.name ?? current.name, email: data.email ?? current.email, role: data.role ?? current.role, password_hash: data.password_hash ?? current.password_hash };
    if (!['customer','admin'].includes(next.role)) throw new DomainError('Rol inválido.');
    return (await pool.query('UPDATE users SET name=$1,email=$2,role=$3,password_hash=$4 WHERE id=$5 RETURNING id,name,email,role,created_at', [next.name,next.email,next.role,next.password_hash,id])).rows[0];
  },
  delete: async (id) => (await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id])).rowCount > 0,
};

const products = {
  list: async ({ q = '', category = '' } = {}) => (await pool.query(`SELECT * FROM products WHERE ($1='' OR name ILIKE '%'||$1||'%' OR description ILIKE '%'||$1||'%') AND ($2='' OR category=$2) ORDER BY featured DESC,id`, [q, category])).rows,
  findById: async (id) => (await pool.query('SELECT * FROM products WHERE id=$1', [id])).rows[0],
  create: async (p) => (await pool.query('INSERT INTO products(name,category,description,price_mxn,stock,image_url,source_url,featured) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [p.name,p.category,p.description,p.price_mxn,p.stock,p.image_url,p.source_url ?? null,p.featured ?? false])).rows[0],
  update: async (id,p) => {
    const old = await products.findById(id);
    return (await pool.query('UPDATE products SET name=$1,category=$2,description=$3,price_mxn=$4,stock=$5,image_url=$6,source_url=$7,featured=$8 WHERE id=$9 RETURNING *', [p.name ?? old.name,p.category ?? old.category,p.description ?? old.description,p.price_mxn ?? old.price_mxn,p.stock ?? old.stock,p.image_url ?? old.image_url,p.source_url ?? old.source_url,p.featured ?? old.featured,id])).rows[0];
  },
  delete: async (id) => { try { return (await pool.query('DELETE FROM products WHERE id=$1 RETURNING id',[id])).rowCount > 0; } catch (e) { if (e.code === '23503') return false; throw e; } },
};

const orders = {
  create: async (userId, items) => {
    const db = await pool.connect();
    try {
      await db.query('BEGIN');
      const normalized = new Map();
      for (const item of items) normalized.set(Number(item.productId), (normalized.get(Number(item.productId)) ?? 0) + Number(item.quantity));
      const lines = [];
      for (const [productId, quantity] of normalized) {
        const product = (await db.query('UPDATE products SET stock=stock-$1 WHERE id=$2 AND stock >= $1 RETURNING *', [quantity, productId])).rows[0];
        if (!product) throw new DomainError('Producto inexistente o inventario insuficiente.', 409);
        lines.push({ product, quantity });
      }
      const domainLines = lines.map(({product,quantity}) => ({...product,quantity}));
      const total = Order.total(domainLines);
      const order = (await db.query('INSERT INTO orders(user_id,total_mxn) VALUES($1,$2) RETURNING *',[userId,total])).rows[0];
      for (const {product,quantity} of lines) await db.query('INSERT INTO order_items(order_id,product_id,product_name,unit_price_mxn,quantity,line_total_mxn) VALUES($1,$2,$3,$4,$5,$6)', [order.id,product.id,product.name,product.price_mxn,quantity,Number(product.price_mxn)*quantity]);
      await db.query('COMMIT');
      return { ...order, items: lines.map(({product,quantity}) => ({product_id:product.id,product_name:product.name,unit_price_mxn:product.price_mxn,quantity,line_total_mxn:Order.total([{...product,quantity}])})) };
    } catch (error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
  },
  findById: async (id) => {
    const order = (await pool.query('SELECT o.*,u.name AS customer_name,u.email AS customer_email FROM orders o JOIN users u ON u.id=o.user_id WHERE o.id=$1',[id])).rows[0];
    if (!order) return null;
    order.items = (await pool.query('SELECT product_id,product_name,unit_price_mxn,quantity,line_total_mxn FROM order_items WHERE order_id=$1',[id])).rows;
    return order;
  },
  list: async (userId) => {
    const list = (await pool.query(`SELECT o.*,u.name AS customer_name FROM orders o JOIN users u ON u.id=o.user_id WHERE ($1::bigint IS NULL OR o.user_id=$1) ORDER BY o.created_at DESC`,[userId])).rows;
    for (const order of list) order.items = (await pool.query('SELECT product_id,product_name,unit_price_mxn,quantity,line_total_mxn FROM order_items WHERE order_id=$1',[order.id])).rows;
    return list;
  },
  updateStatus: async (id,status) => (await pool.query('UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',[status,id])).rows[0],
  cancel: async (id,userId) => {
    const db=await pool.connect();
    try {
      await db.query('BEGIN');
      const order=(await db.query("SELECT * FROM orders WHERE id=$1 AND ($2::bigint IS NULL OR user_id=$2) AND status='pending' FOR UPDATE",[id,userId])).rows[0];
      if (!order) { await db.query('ROLLBACK'); return null; }
      const lines=(await db.query('SELECT product_id,quantity FROM order_items WHERE order_id=$1',[id])).rows;
      for (const line of lines) await db.query('UPDATE products SET stock=stock+$1 WHERE id=$2',[line.quantity,line.product_id]);
      const updated=(await db.query("UPDATE orders SET status='cancelled' WHERE id=$1 RETURNING *",[id])).rows[0];
      await db.query('COMMIT'); return updated;
    } catch(e) { await db.query('ROLLBACK'); throw e; } finally { db.release(); }
  },
};

export const postgresRepositories = { users, products, orders };
