const db = require('../config/db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

async function fetchSales(from, to) {
  const where = [];
  const params = [];
  if (from) { where.push('s.created_at >= ?'); params.push(from); }
  if (to)   { where.push('s.created_at <= ?'); params.push(to); }
  const [rows] = await db.query(
    `SELECT s.id, s.invoice_number, s.created_at, s.customer_name,
            s.total, s.payment_method, u.full_name AS cashier
     FROM sales s JOIN users u ON u.id = s.user_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY s.created_at DESC`, params);
  return rows;
}

exports.salesPdf = async (req, res, next) => {
  try {
    const rows = await fetchSales(req.query.from, req.query.to);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);
    doc.fontSize(18).text('DAB Enterprise Ltd — Sales Report', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#555').text(
      `Period: ${req.query.from || 'all'}  →  ${req.query.to || 'now'}    Generated: ${new Date().toLocaleString()}`,
      { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    const cols = ['Invoice', 'Date', 'Customer', 'Cashier', 'Pay', 'Total'];
    const widths = [90, 100, 110, 100, 50, 70];
    let x = doc.x, y = doc.y;
    doc.font('Helvetica-Bold');
    cols.forEach((c, i) => doc.text(c, x + widths.slice(0,i).reduce((a,b)=>a+b,0), y));
    doc.moveDown();
    doc.font('Helvetica');
    let total = 0;
    rows.forEach(r => {
      y = doc.y;
      const row = [r.invoice_number, new Date(r.created_at).toLocaleString(),
                   r.customer_name || '-', r.cashier, r.payment_method,
                   Number(r.total).toFixed(2)];
      row.forEach((c, i) => doc.text(String(c), x + widths.slice(0,i).reduce((a,b)=>a+b,0), y, { width: widths[i] - 4 }));
      doc.moveDown();
      total += Number(r.total);
    });
    doc.moveDown();
    doc.font('Helvetica-Bold').text(`TOTAL: ${total.toFixed(2)}`, { align: 'right' });
    doc.end();
  } catch (e) { next(e); }
};

exports.salesExcel = async (req, res, next) => {
  try {
    const rows = await fetchSales(req.query.from, req.query.to);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Sales');
    ws.columns = [
      { header: 'Invoice', key: 'invoice_number', width: 18 },
      { header: 'Date', key: 'created_at', width: 22 },
      { header: 'Customer', key: 'customer_name', width: 22 },
      { header: 'Cashier', key: 'cashier', width: 22 },
      { header: 'Payment', key: 'payment_method', width: 12 },
      { header: 'Total', key: 'total', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow(r));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
};

exports.inventoryExcel = async (_req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT p.sku, p.name, c.name AS category, s.name AS supplier,
              p.cost_price, p.selling_price, p.quantity, p.reorder_level
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ORDER BY p.name`);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Inventory');
    ws.columns = [
      { header: 'SKU', key: 'sku', width: 14 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 16 },
      { header: 'Supplier', key: 'supplier', width: 22 },
      { header: 'Cost', key: 'cost_price', width: 12 },
      { header: 'Price', key: 'selling_price', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Reorder Level', key: 'reorder_level', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow(r));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
};

exports.invoicePdf = async (req, res, next) => {
  try {
    const [[sale]] = await db.query(
      `SELECT s.*, u.full_name AS cashier FROM sales s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
      [req.params.id]
    );
    if (!sale) return res.status(404).json({ message: 'Not found' });
    const [items] = await db.query(
      `SELECT si.*, p.name AS product_name, p.sku
       FROM sale_items si JOIN products p ON p.id = si.product_id WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sale.invoice_number}.pdf"`);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(20).text('DAB Enterprise Ltd', { align: 'left' });
    doc.fontSize(10).fillColor('#666').text('Inventory & Sales — Tax Invoice');
    doc.moveDown();
    doc.fillColor('#000').fontSize(12);
    doc.text(`Invoice: ${sale.invoice_number}`);
    doc.text(`Date: ${new Date(sale.created_at).toLocaleString()}`);
    doc.text(`Cashier: ${sale.cashier}`);
    if (sale.customer_name) doc.text(`Customer: ${sale.customer_name}`);
    if (sale.customer_phone) doc.text(`Phone: ${sale.customer_phone}`);
    doc.text(`Payment: ${sale.payment_method}`);
    doc.moveDown();

    const x = doc.x;
    const widths = [40, 70, 200, 60, 70, 80];
    const heads = ['#','SKU','Product','Qty','Unit','Total'];
    let y = doc.y;
    doc.font('Helvetica-Bold');
    heads.forEach((h,i)=>doc.text(h, x + widths.slice(0,i).reduce((a,b)=>a+b,0), y));
    doc.moveDown(); doc.font('Helvetica');

    items.forEach((it,idx)=>{
      y = doc.y;
      const row = [idx+1, it.sku, it.product_name, it.quantity,
                   Number(it.unit_price).toFixed(2), Number(it.line_total).toFixed(2)];
      row.forEach((c,i)=>doc.text(String(c), x + widths.slice(0,i).reduce((a,b)=>a+b,0), y, { width: widths[i]-4 }));
      doc.moveDown();
    });

    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text(`Subtotal: ${Number(sale.subtotal).toFixed(2)}`, { align: 'right' });
    doc.text(`Tax:      ${Number(sale.tax).toFixed(2)}`, { align: 'right' });
    doc.text(`TOTAL:    ${Number(sale.total).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#666')
       .text('Thank you for your business.', { align: 'center' });
    doc.end();
  } catch (e) { next(e); }
};
