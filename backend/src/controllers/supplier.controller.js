const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    const [dup] = await db.query('SELECT id FROM suppliers WHERE name = ?', [name]);
    if (dup.length) return res.status(409).json({ message: 'Supplier already exists' });
    const [r] = await db.query(
      'INSERT INTO suppliers (name,contact,phone,email,address) VALUES (?,?,?,?,?)',
      [name, contact || null, phone || null, email || null, address || null]
    );
    res.status(201).json({ id: r.insertId, name, contact, phone, email, address });
  } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try {
    const { name, contact, phone, email, address } = req.body;
    await db.query(
      'UPDATE suppliers SET name=?,contact=?,phone=?,email=?,address=? WHERE id=?',
      [name, contact || null, phone || null, email || null, address || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
};
