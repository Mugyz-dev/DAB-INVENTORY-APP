import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Inventory() {
  const [list, setList] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ product_id:'', movement_type:'IN', quantity:1, note:'' });
  const load = () => api.get('/inventory').then(r => setList(r.data));
  useEffect(() => { load(); api.get('/products').then(r=>setProducts(r.data)); }, []);

  async function save(e) {
    e.preventDefault();
    await api.post('/inventory', { ...form, quantity: Number(form.quantity) });
    setForm({ product_id:'', movement_type:'IN', quantity:1, note:'' });
    load();
  }

  return (
    <div>
      <h4>Inventory Movements</h4>
      <form className="card card-body shadow-sm mb-3" onSubmit={save}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label small mb-0">Product</label>
            <select className="form-control" required value={form.product_id}
              onChange={e=>setForm({...form,product_id:e.target.value})}>
              <option value="">— Select —</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.sku} — {p.name} (stock: {p.quantity})</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-0">Type</label>
            <select className="form-control" value={form.movement_type}
              onChange={e=>setForm({...form,movement_type:e.target.value})}>
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
              <option value="ADJUST">ADJUST (set value)</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small mb-0">Quantity</label>
            <input type="number" min="1" className="form-control" value={form.quantity}
              onChange={e=>setForm({...form,quantity:e.target.value})}/>
          </div>
          <div className="col-md-3">
            <label className="form-label small mb-0">Note</label>
            <input className="form-control" value={form.note}
              onChange={e=>setForm({...form,note:e.target.value})}/>
          </div>
          <div className="col-md-1"><button className="btn btn-primary w-100">Save</button></div>
        </div>
      </form>

      <table className="table table-sm table-striped bg-white shadow-sm">
        <thead><tr><th>Date</th><th>Product</th><th>Type</th><th className="text-end">Qty</th><th>Note</th><th>User</th></tr></thead>
        <tbody>
          {list.map(m=>(
            <tr key={m.id}>
              <td>{new Date(m.created_at).toLocaleString()}</td>
              <td>{m.sku} — {m.product_name}</td>
              <td><span className={'badge ' + (m.movement_type==='IN'?'bg-success':m.movement_type==='OUT'?'bg-danger':'bg-secondary')}>{m.movement_type}</span></td>
              <td className="text-end">{m.quantity}</td>
              <td>{m.note}</td><td>{m.user_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
