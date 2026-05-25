import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const blank = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  supplier_id: '',
  unit: 'kg',
  animal_type: '',
  cut_type: '',
  storage_type: 'fresh',
  storage_location: '',
  batch_number: '',
  slaughter_date: '',
  expiry_date: '',
  barcode: '',
  cost_price: 0,
  selling_price: 0,
  quantity: 0,
  reorder_level: 5,
};

const fmtQty = (value, unit) => `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit || ''}`.trim();

export default function Products() {
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [sups, setSups] = useState([]);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const [show, setShow] = useState(false);

  const load = () => api.get('/products', { params: { q } }).then(r => setList(r.data));
  useEffect(() => { load(); }, [q]);
  useEffect(() => {
    api.get('/categories').then(r => setCats(r.data));
    api.get('/suppliers').then(r => setSups(r.data));
  }, []);

  async function save(e) {
    e.preventDefault();
    const payload = {
      ...form,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      slaughter_date: form.slaughter_date || null,
      expiry_date: form.expiry_date || null,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level),
    };
    if (editId) await api.put(`/products/${editId}`, payload);
    else await api.post('/products', payload);
    setForm(blank);
    setEditId(null);
    setShow(false);
    load();
  }

  async function del(id) {
    if (confirm('Delete this meat item?')) {
      await api.delete(`/products/${id}`);
      load();
    }
  }

  function edit(p) {
    setEditId(p.id);
    setForm({
      ...blank,
      ...p,
      category_id: p.category_id || '',
      supplier_id: p.supplier_id || '',
      slaughter_date: p.slaughter_date ? String(p.slaughter_date).slice(0, 10) : '',
      expiry_date: p.expiry_date ? String(p.expiry_date).slice(0, 10) : '',
    });
    setShow(true);
  }

  const inp = (k, ph, type = 'text', props = {}) => (
    <input
      type={type}
      className="form-control mb-2"
      placeholder={ph}
      value={form[k] ?? ''}
      onChange={e => setForm({ ...form, [k]: e.target.value })}
      {...props}
    />
  );

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Meat Inventory</h4>
        <div className="d-flex gap-2">
          <input
            className="form-control form-control-sm"
            placeholder="Search meat, SKU, animal, cut, batch"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{ width: 320 }}
          />
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditId(null); setForm(blank); setShow(true); }}>
              + New Meat Item
            </button>
          )}
        </div>
      </div>

      <table className="table table-striped table-hover bg-white shadow-sm">
        <thead>
          <tr>
            <th>SKU</th><th>Meat</th><th>Animal</th><th>Cut</th><th>Storage</th>
            <th className="text-end">Price</th><th className="text-end">Stock</th><th>Expiry</th><th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(p => (
            <tr key={p.id} className={Number(p.quantity) <= Number(p.reorder_level) ? 'table-warning' : ''}>
              <td>{p.sku}</td>
              <td>
                <div className="fw-semibold">{p.name}</div>
                <div className="text-muted small">{p.category_name || '-'} {p.batch_number ? `| Batch ${p.batch_number}` : ''}</div>
              </td>
              <td>{p.animal_type || '-'}</td>
              <td>{p.cut_type || '-'}</td>
              <td>{p.storage_type} {p.storage_location ? `- ${p.storage_location}` : ''}</td>
              <td className="text-end">{Number(p.selling_price).toLocaleString()} / {p.unit}</td>
              <td className="text-end">{fmtQty(p.quantity, p.unit)}</td>
              <td>{p.expiry_date ? new Date(p.expiry_date).toLocaleDateString() : '-'}</td>
              <td className="text-end">
                {isAdmin && (
                  <>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => edit(p)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => del(p.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan="9" className="text-center text-muted">No meat items</td></tr>}
        </tbody>
      </table>

      {show && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-xl">
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Meat Item' : 'New Meat Item'}</h5>
                <button type="button" className="btn-close" onClick={() => setShow(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4">
                    {inp('sku', 'SKU *')}
                    {inp('name', 'Meat name *')}
                    <textarea
                      className="form-control mb-2"
                      placeholder="Description"
                      value={form.description || ''}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                    />
                    <select className="form-control mb-2" value={form.category_id || ''} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                      <option value="">Category</option>
                      {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="form-control mb-2" value={form.supplier_id || ''} onChange={e => setForm({ ...form, supplier_id: e.target.value })}>
                      <option value="">Supplier</option>
                      {sups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <select className="form-control mb-2" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="g">Gram (g)</option>
                      <option value="piece">Piece</option>
                      <option value="pack">Pack</option>
                    </select>
                    {inp('animal_type', 'Animal type, e.g. Beef')}
                    {inp('cut_type', 'Cut type, e.g. Ribs')}
                    <select className="form-control mb-2" value={form.storage_type} onChange={e => setForm({ ...form, storage_type: e.target.value })}>
                      <option value="fresh">Fresh</option>
                      <option value="chilled">Chilled</option>
                      <option value="frozen">Frozen</option>
                      <option value="dry">Dry</option>
                    </select>
                    {inp('storage_location', 'Storage location')}
                    {inp('batch_number', 'Batch number')}
                  </div>

                  <div className="col-md-4">
                    <label className="form-label small mb-0">Slaughter date</label>
                    {inp('slaughter_date', '', 'date')}
                    <label className="form-label small mb-0">Expiry date</label>
                    {inp('expiry_date', '', 'date')}
                    {inp('barcode', 'Barcode / label code')}
                    <div className="row">
                      <div className="col">{inp('cost_price', 'Cost', 'number', { min: '0', step: '0.01' })}</div>
                      <div className="col">{inp('selling_price', 'Price per unit *', 'number', { min: '0', step: '0.01' })}</div>
                    </div>
                    <div className="row">
                      <div className="col">{inp('quantity', 'Initial stock', 'number', { min: '0', step: '0.001' })}</div>
                      <div className="col">{inp('reorder_level', 'Low stock alert', 'number', { min: '0', step: '0.001' })}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>Cancel</button>
                <button className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
