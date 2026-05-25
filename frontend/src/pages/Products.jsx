import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';

const blank = { sku:'', name:'', description:'', category_id:'', supplier_id:'',
  cost_price:0, selling_price:0, quantity:0, reorder_level:5 };

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
    const payload = { ...form,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      cost_price: Number(form.cost_price),
      selling_price: Number(form.selling_price),
      quantity: Number(form.quantity),
      reorder_level: Number(form.reorder_level) };
    if (editId) await api.put(`/products/${editId}`, payload);
    else await api.post('/products', payload);
    setForm(blank); setEditId(null); setShow(false); load();
  }
  async function del(id) { if(confirm('Delete?')) { await api.delete(`/products/${id}`); load(); } }
  function edit(p){ setEditId(p.id); setForm({...blank, ...p,
    category_id: p.category_id || '', supplier_id: p.supplier_id || ''}); setShow(true); }

  const inp = (k, ph, type='text') => <input type={type} className="form-control mb-2" placeholder={ph}
    value={form[k] ?? ''} onChange={e=>setForm({...form,[k]:e.target.value})}/>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Products</h4>
        <div className="d-flex gap-2">
          <input className="form-control form-control-sm" placeholder="Search by name / SKU"
            value={q} onChange={e=>setQ(e.target.value)} style={{ width: 240 }}/>
          {isAdmin && <button className="btn btn-primary btn-sm"
            onClick={()=>{setEditId(null); setForm(blank); setShow(true);}}>+ New Product</button>}
        </div>
      </div>

      <table className="table table-striped table-hover bg-white shadow-sm">
        <thead>
          <tr><th>SKU</th><th>Name</th><th>Category</th><th>Supplier</th>
              <th className="text-end">Price</th><th className="text-end">Qty</th><th></th></tr>
        </thead>
        <tbody>
          {list.map(p=>(
            <tr key={p.id} className={p.quantity <= p.reorder_level ? 'table-warning' : ''}>
              <td>{p.sku}</td><td>{p.name}</td><td>{p.category_name}</td><td>{p.supplier_name}</td>
              <td className="text-end">{Number(p.selling_price).toLocaleString()}</td>
              <td className="text-end">{p.quantity}</td>
              <td className="text-end">
                {isAdmin && <>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>edit(p)}>Edit</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={()=>del(p.id)}>Delete</button>
                </>}
              </td>
            </tr>
          ))}
          {!list.length && <tr><td colSpan="7" className="text-center text-muted">No products</td></tr>}
        </tbody>
      </table>

      {show && (
        <div className="modal show d-block" tabIndex="-1" style={{ background:'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg">
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">{editId ? 'Edit Product' : 'New Product'}</h5>
                <button type="button" className="btn-close" onClick={()=>setShow(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">{inp('sku','SKU *')}{inp('name','Name *')}
                    <textarea className="form-control mb-2" placeholder="Description"
                      value={form.description||''} onChange={e=>setForm({...form,description:e.target.value})}/>
                  </div>
                  <div className="col-md-6">
                    <select className="form-control mb-2" value={form.category_id||''}
                      onChange={e=>setForm({...form,category_id:e.target.value})}>
                      <option value="">— Category —</option>
                      {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select className="form-control mb-2" value={form.supplier_id||''}
                      onChange={e=>setForm({...form,supplier_id:e.target.value})}>
                      <option value="">— Supplier —</option>
                      {sups.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="row">
                      <div className="col">{inp('cost_price','Cost', 'number')}</div>
                      <div className="col">{inp('selling_price','Price *', 'number')}</div>
                    </div>
                    <div className="row">
                      <div className="col">{inp('quantity','Initial qty', 'number')}</div>
                      <div className="col">{inp('reorder_level','Reorder', 'number')}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Cancel</button>
                <button className="btn btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
