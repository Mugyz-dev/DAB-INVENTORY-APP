const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, p.name AS product_name, p.sku, p.unit, u.full_name AS user_name
       FROM inventory_movements m
       JOIN products p ON p.id = m.product_id
       LEFT JOIN users u ON u.id = m.user_id
       ORDER BY m.id DESC LIMIT 200`
    );
    res.json(rows);
  } catch (e) { next(e); }
};

exports.move = async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const { product_id, movement_type, quantity, note } = req.body;
    const qty = Number(quantity);
    if (!['IN','OUT','ADJUST'].includes(movement_type)) {
      return res.status(400).json({ message: 'Invalid movement_type' });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    await conn.beginTransaction();
    const [pRows] = await conn.query('SELECT quantity FROM products WHERE id = ? FOR UPDATE', [product_id]);
    if (!pRows.length) { await conn.rollback(); return res.status(404).json({ message: 'Product not found' }); }
    let newQty = Number(pRows[0].quantity);
    if (movement_type === 'IN') newQty += qty;
    else if (movement_type === 'OUT') {
      if (qty > newQty) { await conn.rollback(); return res.status(400).json({ message: 'Insufficient stock' }); }
      newQty -= qty;
    } else { newQty = qty; } // ADJUST sets absolute value
    await conn.query('UPDATE products SET quantity = ? WHERE id = ?', [newQty, product_id]);
    await conn.query(
      'INSERT INTO inventory_movements (product_id,movement_type,quantity,note,user_id) VALUES (?,?,?,?,?)',
      [product_id, movement_type, qty, note || null, req.user.id]
    );
    await conn.commit();
    res.status(201).json({ message: 'Stock updated', new_quantity: newQty });
  } catch (e) { await conn.rollback(); next(e); }
  finally { conn.release(); }
};
