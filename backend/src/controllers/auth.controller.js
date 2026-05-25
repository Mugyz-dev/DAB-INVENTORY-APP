const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res, next) => {
  try {
    const full_name = String(req.body.full_name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;

    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'Email already used' });

    const [[{ user_count }]] = await db.query(
      `SELECT COUNT(*) AS user_count
       FROM users
       WHERE is_active = 1 AND email NOT IN ('admin@dab.local','sales@dab.local')`
    );
    const role = user_count === 0 ? 'admin' : 'sales';
    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES (?,?,?,?)',
      [full_name, email, hash, role]
    );
    const token = jwt.sign(
      { id: result.insertId, email, role, full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    res.status(201).json({
      token,
      user: { id: result.insertId, full_name, email, role },
    });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!rows.length) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    });
  } catch (e) { next(e); }
};

exports.me = async (req, res) => res.json({ user: req.user });
