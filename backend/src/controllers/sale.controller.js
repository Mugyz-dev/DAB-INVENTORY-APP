const db = require('../config/db');

function invoiceNumber() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${ymd}-${rnd}`;
}

exports.list = async (req, res, next) => {
  try {
    const where = [];
    const params = [];
    if (req.user.role !== 'admin') { where.push('s.user_id = ?'); params.push(req.user.id); }
    if (req.query.from) { where.push('s.created_at >= ?'); params.push(req.query.from); }
    if (req.query.to) { where.push('s.created_at <= ?'); params.push(req.query.to); }
    const sql = `
      SELECT s.*, u.full_name AS cashier
      FROM sales s JOIN users u ON u.id = s.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY s.id DESC LIMIT 500`;
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const [sRows] = await db.query(
      `SELECT s.*, u.full_name AS cashier FROM sales s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!sRows.length) return res.status(404).json({ message: 'Not found' });
    const sale = sRows[0];
    if (req.user.role !== 'admin' && sale.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const [items] = await db.query(
      `SELECT si.*, p.name AS product_name, p.sku
       FROM sale_items si JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`, [req.params.id]
    );
    res.json({ ...sale, items });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { customer_name, customer_phone, payment_method, tax_rate,
            discount, amount_paid, items } = req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: 'At least one item is required' });
    }
    await conn.beginTransaction();
    let subtotal = 0;
    const resolved = [];
    for (const it of items) {
      const qty = Number(it.quantity);
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Invalid item quantity');
      const [pRows] = await conn.query(
        'SELECT id,name,selling_price,quantity FROM products WHERE id = ? FOR UPDATE', [it.product_id]
      );
      if (!pRows.length) throw new Error(`Product ${it.product_id} not found`);
      const p = pRows[0];
      if (p.quantity < qty) throw new Error(`Insufficient stock for ${p.name}`);
      const unit = it.unit_price != null ? Number(it.unit_price) : Number(p.selling_price);
      const line = unit * qty;
      subtotal += line;
      resolved.push({ product_id: p.id, quantity: qty, unit_price: unit, line_total: line });
      await conn.query('UPDATE products SET quantity = quantity - ? WHERE id = ?', [qty, p.id]);
      await conn.query(
        'INSERT INTO inventory_movements (product_id,movement_type,quantity,note,user_id) VALUES (?,?,?,?,?)',
        [p.id, 'OUT', qty, 'Sale', req.user.id]
      );
    }
    const taxRate = Number(tax_rate || 0);
    const discountAmount = Math.min(Math.max(Number(discount || 0), 0), subtotal);
    const taxable = subtotal - discountAmount;
    const tax = +(taxable * taxRate / 100).toFixed(2);
    const total = +(taxable + tax).toFixed(2);
    const paid = payment_method === 'credit'
      ? Math.min(Math.max(Number(amount_paid || 0), 0), total)
      : Math.min(Math.max(Number(amount_paid || total), 0), total);
    const balance = +(total - paid).toFixed(2);
    const paymentStatus = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
    const inv = invoiceNumber();
    const [r] = await conn.query(
      `INSERT INTO sales (invoice_number,user_id,customer_name,customer_phone,subtotal,discount,
        tax,total,amount_paid,balance_due,payment_status,payment_method)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [inv, req.user.id, customer_name || null, customer_phone || null,
       subtotal, discountAmount, tax, total, paid, balance, paymentStatus, payment_method || 'cash']
    );
    for (const it of resolved) {
      await conn.query(
        'INSERT INTO sale_items (sale_id,product_id,quantity,unit_price,line_total) VALUES (?,?,?,?,?)',
        [r.insertId, it.product_id, it.quantity, it.unit_price, it.line_total]
      );
    }
    await conn.commit();
    res.status(201).json({
      id: r.insertId,
      invoice_number: inv,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      amount_paid: paid,
      balance_due: balance,
      payment_status: paymentStatus,
    });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ message: e.message });
  } finally { conn.release(); }
};
