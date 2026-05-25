import { useEffect, useState } from 'react';
import api from '../api/client';

const blank = { full_name:'', email:'', password:'', role:'sales' };

export default function Users() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blank);
  const [show, setShow] = useState(false);
  const load = () => api.get('/users').then(r => setList(r.data));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    await api.post('/users', form);
    setForm(blank); setShow(false); load();
  }
  async function toggle(u) {
    await api.put(`/users/${u.id}`, { is_active: !u.is_active });
    load();
  }
  async function del(id) { if(confirm('Delete?')) { await api.delete(`/users/${id}`); load(); } }

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <h4 className="mb-0">Users</h4>
        <button className="btn btn-primary btn-sm" onClick={()=>setShow(true)}>+ New User</button>
      </div>
      <table className="table table-striped bg-white shadow-sm">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th></th></tr></thead>
        <tbody>
          {list.map(u=>(
            <tr key={u.id}>
              <td>{u.full_name}</td><td>{u.email}</td>
              <td><span className={'badge ' + (u.role==='admin'?'bg-dark':'bg-secondary')}>{u.role}</span></td>
              <td>{u.is_active ? 'Yes' : 'No'}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-secondary me-1" onClick={()=>toggle(u)}>
                  {u.is_active ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>del(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {show && (
        <div className="modal show d-block" tabIndex="-1" style={{ background:'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <form className="modal-content" onSubmit={save}>
              <div className="modal-header">
                <h5 className="modal-title">New User</h5>
                <button type="button" className="btn-close" onClick={()=>setShow(false)}></button>
              </div>
              <div className="modal-body">
                <input className="form-control mb-2" placeholder="Full name" required
                  value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/>
                <input type="email" className="form-control mb-2" placeholder="Email" required
                  value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
                <input type="password" className="form-control mb-2" placeholder="Password (min 6)" required
                  value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
                <select className="form-control" value={form.role}
                  onChange={e=>setForm({...form,role:e.target.value})}>
                  <option value="sales">Sales Officer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShow(false)}>Cancel</button>
                <button className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
