import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

const fmtQty = (value, unit) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit || ''}`.trim();

export default function NewSale() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    tax_rate: 0,
    discount: 0,
    amount_paid: '',
  });
  const [sel, setSel] = useState('');
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/products').then(r => setProducts(r.data)); }, []);

  function addItem() {
    const p = products.find(x => String(x.id) === String(sel));
    if (!p) return;
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return;
    const current = items.find(i => i.product_id === p.id)?.quantity || 0;
    if (current + q > Number(p.quantity)) {
      setErr(`Only ${fmtQty(p.quantity, p.unit)} in stock for ${p.name}`);
      return;
    }
    setErr('');
    const existing = items.find(i => i.product_id === p.id);
    if (existing) {
      setItems(items.map(i => i.product_id === p.id ? { ...i, quantity: +(i.quantity + q).toFixed(3) } : i));
    } else {
      setItems([...items, {
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        unit: p.unit,
        quantity: q,
        unit_price: Number(p.selling_price),
      }]);
    }
    setSel('');
    setQty(1);
  }

  const remove = (id) => setItems(items.filter(i => i.product_id !== id));
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const discount = Math.min(Math.max(Number(meta.discount || 0), 0), subtotal);
  const tax = +((subtotal - discount) * Number(meta.tax_rate || 0) / 100).toFixed(2);
  const total = subtotal - discount + tax;
  const paidPreview = meta.payment_method === 'credit'
    ? Number(meta.amount_paid || 0)
    : Number(meta.amount_paid || total);
  const balancePreview = Math.max(total - paidPreview, 0);

  async function submit() {
    if (!items.length) {
      setErr('Add at least one meat item');
      return;
    }
    try {
      const { data } = await api.post('/sales', {
        ...meta,
        tax_rate: Number(meta.tax_rate || 0),
        discount: Number(meta.discount || 0),
        amount_paid: meta.amount_paid === '' ? undefined : Number(meta.amount_paid),
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
      });
      alert(`Sale recorded: ${data.invoice_number}`);
      nav('/sales');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed');
    }
  }

  return (
    <div>
      <h4>New Butcher Sale</h4>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="row">
        <div className="col-md-8">
          <div className="card card-body shadow-sm mb-3">
            <div className="row g-2 align-items-end">
              <div className="col-md-7">
                <label className="form-label small mb-0">Meat item</label>
                <select className="form-control" value={sel} onChange={e => setSel(e.target.value)}>
                  <option value="">Select meat item</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={Number(p.quantity) <= 0}>
                      {p.sku} - {p.name} ({fmtQty(p.quantity, p.unit)}, {Number(p.selling_price).toLocaleString()} / {p.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small mb-0">Quantity / weight</label>
                <input type="number" min="0.001" step="0.001" className="form-control" value={qty}
                  onChange={e => setQty(e.target.value)} />
              </div>
              <div className="col-md-2">
                <button className="btn btn-primary w-100" onClick={addItem}>Add</button>
              </div>
            </div>
          </div>

          <table className="table bg-white shadow-sm">
            <thead>
              <tr>
                <th>SKU</th><th>Meat item</th><th className="text-end">Qty</th>
                <th className="text-end">Price</th><th className="text-end">Total</th><th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.product_id}>
                  <td>{i.sku}</td><td>{i.name}</td>
                  <td className="text-end">{fmtQty(i.quantity, i.unit)}</td>
                  <td className="text-end">{i.unit_price.toLocaleString()} / {i.unit}</td>
                  <td className="text-end">{(i.unit_price * i.quantity).toLocaleString()}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-danger" onClick={() => remove(i.product_id)}>x</button>
                  </td>
                </tr>
              ))}
              {!items.length && <tr><td colSpan="6" className="text-center text-muted">No items</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="col-md-4">
          <div className="card card-body shadow-sm">
            <h6>Customer and payment</h6>
            <input className="form-control mb-2" placeholder="Customer name"
              value={meta.customer_name} onChange={e => setMeta({ ...meta, customer_name: e.target.value })} />
            <input className="form-control mb-2" placeholder="Phone"
              value={meta.customer_phone} onChange={e => setMeta({ ...meta, customer_phone: e.target.value })} />
            <select className="form-control mb-2" value={meta.payment_method}
              onChange={e => setMeta({ ...meta, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="mobile">Mobile money</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="credit">Customer credit</option>
            </select>
            <input type="number" min="0" step="0.01" className="form-control mb-2" placeholder="Discount"
              value={meta.discount} onChange={e => setMeta({ ...meta, discount: e.target.value })} />
            <input type="number" min="0" step="0.01" className="form-control mb-2" placeholder="Tax %"
              value={meta.tax_rate} onChange={e => setMeta({ ...meta, tax_rate: e.target.value })} />
            <input type="number" min="0" step="0.01" className="form-control mb-3" placeholder="Amount paid"
              value={meta.amount_paid} onChange={e => setMeta({ ...meta, amount_paid: e.target.value })} />

            <div className="d-flex justify-content-between"><span>Subtotal</span><strong>{subtotal.toLocaleString()}</strong></div>
            <div className="d-flex justify-content-between"><span>Discount</span><strong>{discount.toLocaleString()}</strong></div>
            <div className="d-flex justify-content-between"><span>Tax</span><strong>{tax.toLocaleString()}</strong></div>
            <div className="d-flex justify-content-between border-top pt-2 mt-2 h5"><span>Total</span><span>{total.toLocaleString()}</span></div>
            <div className="d-flex justify-content-between text-muted"><span>Balance</span><strong>{balancePreview.toLocaleString()}</strong></div>

            <button className="btn btn-success mt-3" onClick={submit} disabled={!items.length}>Record sale</button>
          </div>
        </div>
      </div>
    </div>
  );
}
