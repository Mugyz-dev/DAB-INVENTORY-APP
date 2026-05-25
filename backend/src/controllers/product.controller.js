const db = require('../config/db');

const SELECT = `
  SELECT p.*, c.name AS category_name, s.name AS supplier_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
`;

exports.list = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const params = [];
    let where = '';
    if (q) {
      where = 'WHERE p.name LIKE ? OR p.sku LIKE ?';
      params.push(`%${q}%`, `%${q}%`);
    }
    const [rows] = await db.query(`${SELECT} ${where} ORDER BY p.id DESC`, params);
    res.json(rows);
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const [rows] = await db.query(`${SELECT} WHERE p.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { sku, name, description, category_id, supplier_id,
            cost_price, selling_price, quantity, reorder_level } = req.body;
    const [dup] = await db.query('SELECT id FROM products WHERE sku = ?', [sku]);
    if (dup.length) return res.status(409).json({ message: 'SKU already exists' });
    const [r] = await db.query(
      `INSERT INTO products (sku,name,description,category_id,supplier_id,
        cost_price,selling_price,quantity,reorder_level)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [sku, name, description || null, category_id || null, supplier_id || null,
       cost_price || 0, selling_price || 0, quantity || 0, reorder_level || 5]
    );
    res.status(201).json({ id: r.insertId });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { sku, name, description, category_id, supplier_id,
            cost_price, selling_price, reorder_level } = req.body;
    await db.query(
      `UPDATE products SET sku=?,name=?,description=?,category_id=?,supplier_id=?,
        cost_price=?,selling_price=?,reorder_level=? WHERE id=?`,
      [sku, name, description || null, category_id || null, supplier_id || null,
       cost_price || 0, selling_price || 0, reorder_level || 5, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { next(e); }
};

exports.lowStock = async (_req, res, next) => {
  try {
    const [rows] = await db.query(`${SELECT} WHERE p.quantity <= p.reorder_level ORDER BY p.quantity ASC`);
    res.json(rows);
  } catch (e) { next(e); }
};
