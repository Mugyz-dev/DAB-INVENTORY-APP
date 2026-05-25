const db = require('../config/db');

exports.summary = async (_req, res, next) => {
  try {
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) AS total_products FROM products');
    const [[{ low_stock }]] = await db.query('SELECT COUNT(*) AS low_stock FROM products WHERE quantity <= reorder_level');
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) AS total_users FROM users');
    const [[today]] = await db.query(
      `SELECT COALESCE(SUM(total),0) AS today_sales, COUNT(*) AS today_orders
       FROM sales WHERE DATE(created_at) = CURDATE()`
    );
    const [topProducts] = await db.query(
      `SELECT p.name, SUM(si.quantity) AS qty_sold, SUM(si.line_total) AS revenue
       FROM sale_items si JOIN products p ON p.id = si.product_id
       JOIN sales s ON s.id = si.sale_id
       WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY p.id, p.name ORDER BY revenue DESC LIMIT 5`
    );
    const [salesByDay] = await db.query(
      `SELECT DATE(created_at) AS day, SUM(total) AS revenue
       FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY day`
    );
    res.json({
      total_products, low_stock, total_users,
      today_sales: Number(today.today_sales),
      today_orders: today.today_orders,
      top_products: topProducts,
      sales_by_day: salesByDay,
    });
  } catch (e) { next(e); }
};
