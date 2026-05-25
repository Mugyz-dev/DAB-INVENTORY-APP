const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, is_active, created_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, email, password, role } = req.body;
    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'Email already used' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (full_name,email,password_hash,role) VALUES (?,?,?,?)',
      [full_name, email, hash, role]
    );
    res.status(201).json({ id: r.insertId, full_name, email, role });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, role, is_active, password } = req.body;
    const fields = [];
    const values = [];
    if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
    if (role !== undefined) { fields.push('role = ?'); values.push(role); }
    if (is_active !== undefined) { fields.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (password) { fields.push('password_hash = ?'); values.push(await bcrypt.hash(password, 10)); }
    if (!fields.length) return res.status(400).json({ message: 'Nothing to update' });
    values.push(req.params.id);
    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
};
