import React from 'react';
import { money } from '../../services/api.js';

export default function OrderList({ orders, user, onUpdate }) {
  return <div className="orders-list">{orders.length?orders.map(o=><div className="order-row" key={o.id}><span className="order-id">#{String(o.id).padStart(5,'0')}</span><span>{new Date(o.created_at).toLocaleDateString('es-MX')}</span><span>{(o.items||[]).length} artículos</span><b>{money(o.total_mxn)}</b><span className={`status status-${o.status}`}>{o.status}</span>{user.role==='admin'&&<select value={o.status} onChange={e=>onUpdate(o.id,e.target.value)}><option value="pending">pending</option><option value="paid">paid</option><option value="shipped">shipped</option><option value="cancelled">cancelled</option></select>}</div>):<p className="muted">Aún no tienes pedidos. Tu próximo setup empieza en el catálogo.</p>}</div>;
}
