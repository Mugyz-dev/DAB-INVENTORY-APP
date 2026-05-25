const db = require('../config/db');

exports.list = async (_req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(rows);
  } catch (e) { next(e); }
};
exports.create = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [dup] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
    if (dup.length) return res.status(409).json({ message: 'Category already exists' });
    const [r] = await db.query('INSERT INTO categories (name,description) VALUES (?,?)', [name, description || null]);
    res.status(201).json({ id: r.insertId, name, description });
  } catch (e) { next(e); }
};
exports.update = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    await db.query('UPDATE categories SET name = ?, description = ? WHERE id = ?', [name, description || null, req.params.id]);
    res.json({ message: 'Updated' });
  } catch (e) { next(e); }
};
exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
};
