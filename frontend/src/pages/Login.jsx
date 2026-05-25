import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@dab.local');
  const [password, setPassword] = useState('Admin@123');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await login(email, password); nav('/'); }
    catch (e) { setErr(e.response?.data?.message || 'Login failed'); }
    finally { setBusy(false); }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <form onSubmit={submit} className="card shadow-sm p-4" style={{ maxWidth: 380, width: '100%' }}>
        <h3 className="mb-1">DAB Enterprise</h3>
        <p className="text-muted small mb-3">Inventory & Sales Management</p>
        {err && <div className="alert alert-danger py-2">{err}</div>}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-muted small mt-3 mb-0">Default admin: admin@dab.local / Admin@123</p>
      </form>
    </div>
  );
}
