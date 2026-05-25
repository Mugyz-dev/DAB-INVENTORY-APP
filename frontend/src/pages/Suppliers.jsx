import { useEffect, useState } from 'react';
import api from '../api/client';

const blank = { name:'', contact:'', phone:'', email:'', address:'' };

export default function Suppliers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const [editId, setEditId] = useState(null);
  const load = () => api.get('/suppliers').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    if (editId) await api.put(`/suppliers/${editId}`, form);
    else await api.post('/suppliers', form);
    setForm(blank); setEditId(null); load();
  }
  async function del(id) { if(confirm('Delete?')) { await api.delete(`/suppliers/${id}`); load(); } }
  function edit(s){ setEditId(s.id); setForm({...blank, ...s}); }
  const inp = (k, ph) => <input className="form-control mb-2" placeholder={ph}
    value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})}/>;

  return (
    <div>
      <h4>Suppliers</h4>
      <div className="row">
        <div className="col-md-4">
          <form className="card card-body shadow-sm" onSubmit={save}>
            <h6>{editId ? 'Edit supplier' : 'New supplier'}</h6>
            {inp('name','Name *')}{inp('contact','Contact person')}{inp('phone','Phone')}
            {inp('email','Email')}{inp('address','Address')}
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm">{editId ? 'Update' : 'Add'}</button>
              {editId && <button type="button" className="btn btn-link btn-sm"
                onClick={()=>{setEditId(null);setForm(blank);}}>Cancel</button>}
            </div>
          </form>
        </div>
        <div className="col-md-8">
          <table className="table table-striped bg-white shadow-sm">
            <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th></th></tr></thead>
            <tbody>
              {list.map(s=>(
                <tr key={s.id}>
                  <td>{s.name}</td><td>{s.contact}</td><td>{s.phone}</td><td>{s.email}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>edit(s)}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>del(s.id)}>Delete</button>
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
