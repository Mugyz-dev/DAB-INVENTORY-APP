import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Categories() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);

  const load = () => api.get('/categories').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (editId) await api.put(`/categories/${editId}`, form);
    else await api.post('/categories', form);
    setForm({ name:'', description:'' }); setEditId(null); load();
  }
  async function del(id) {
    if (!confirm('Delete this category?')) return;
    await api.delete(`/categories/${id}`); load();
  }
  function edit(c) { setEditId(c.id); setForm({ name: c.name, description: c.description || '' }); }

  return (
    <div>
      <h4>Categories</h4>
      <div className="row">
        <div className="col-md-4">
          <form className="card card-body shadow-sm" onSubmit={save}>
            <h6>{editId ? 'Edit category' : 'New category'}</h6>
            <input className="form-control mb-2" placeholder="Name" required
              value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
            <textarea className="form-control mb-2" placeholder="Description"
              value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm">{editId ? 'Update' : 'Add'}</button>
              {editId && <button type="button" className="btn btn-link btn-sm"
                onClick={()=>{setEditId(null);setForm({name:'',description:''});}}>Cancel</button>}
            </div>
          </form>
        </div>
        <div className="col-md-8">
          <table className="table table-striped table-hover bg-white shadow-sm">
            <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
            <tbody>
              {list.map(c=>(
                <tr key={c.id}>
                  <td>{c.name}</td><td>{c.description}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>edit(c)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>del(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
