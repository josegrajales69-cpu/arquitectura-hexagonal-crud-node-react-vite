const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const money = (value) => new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
}).format(Number(value));

const itemRows = (items = []) => items.map((item) => `
  <tr>
    <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.product_name)}</td>
    <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:center">${Number(item.quantity)}</td>
    <td style="padding:10px;border-bottom:1px solid #e5e7eb;text-align:right">${money(item.line_total_mxn)}</td>
  </tr>`).join('');

const orderTable = (order) => `
  <table style="width:100%;border-collapse:collapse;margin:20px 0">
    <thead><tr><th style="text-align:left;padding:10px">Producto</th><th>Cantidad</th><th style="text-align:right">Importe</th></tr></thead>
    <tbody>${itemRows(order.items)}</tbody>
    <tfoot><tr><th colspan="2" style="text-align:right;padding:12px">Total</th><th style="text-align:right">${money(order.total_mxn)}</th></tr></tfoot>
  </table>`;

const shell = (title, content) => `<!doctype html><html lang="es"><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
  <main style="max-width:680px;margin:24px auto;background:#fff;padding:28px;border-radius:12px">
    <p style="color:#537520;font-weight:bold;letter-spacing:2px">NEXUS · PC GAMING</p><h1>${escapeHtml(title)}</h1>${content}
  </main></body></html>`;

export function orderConfirmationEmail({ customer, order, paymentInstructions }) {
  const instructions = escapeHtml(paymentInstructions).replace(/\n/g, '<br>');
  return {
    subject: `Pedido #${order.id} recibido · Pendiente de pago`,
    text: `Hola ${customer.name},\n\nRecibimos tu pedido #${order.id}. Estado: Pendiente de Pago.\n${order.items.map((item) => `${item.quantity} × ${item.product_name}: ${money(item.line_total_mxn)}`).join('\n')}\nTotal: ${money(order.total_mxn)}\n\nInstrucciones de pago:\n${paymentInstructions}\n\nNEXUS PC Gaming`,
    html: shell('¡Recibimos tu pedido!', `<p>Hola ${escapeHtml(customer.name)},</p><p>Tu pedido <strong>#${order.id}</strong> fue registrado con estado <strong>Pendiente de Pago</strong>.</p>${orderTable(order)}<h2>Instrucciones de pago</h2><p style="white-space:normal;line-height:1.7">${instructions}</p><p>Cuando se confirme el pago, actualizaremos el estado de tu pedido.</p>`),
  };
}

export function adminNewOrderEmail({ customer, order }) {
  return {
    subject: `Nuevo pedido #${order.id} · NEXUS`,
    text: `Se recibió el pedido #${order.id}. Cliente: ${customer.name} (${customer.email}). Total: ${money(order.total_mxn)}. Estado: Pendiente de Pago.`,
    html: shell('Nuevo pedido recibido', `<p>Se registró el pedido <strong>#${order.id}</strong>.</p><p>Cliente: ${escapeHtml(customer.name)} (${escapeHtml(customer.email)})</p><p>Estado: <strong>Pendiente de Pago</strong></p>${orderTable(order)}`),
  };
}
