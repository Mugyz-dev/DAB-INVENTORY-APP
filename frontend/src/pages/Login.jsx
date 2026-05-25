import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function passwordChecks(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
}

export default function Login() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const checks = passwordChecks(form.password);
  const passwordStrong = Object.values(checks).every(Boolean);
  const emailLooksValid = !form.email || emailPattern.test(form.email);
  const passwordsMatch = !form.confirm_password || form.password === form.confirm_password;

  function update(key, value) {
    setForm({ ...form, [key]: value });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setErr('');
    setForm({ full_name: '', email: '', password: '', confirm_password: '' });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function submit(e) {
    e.preventDefault();
    setErr('');

    const email = form.email.trim().toLowerCase();
    if (!emailPattern.test(email)) {
      setErr('Enter a valid email address');
      return;
    }

    if (isRegister && !passwordStrong) {
      setErr('Password must be at least 8 characters and include uppercase, lowercase, and a number');
      return;
    }

    if (isRegister && form.password !== form.confirm_password) {
      setErr('Passwords do not match');
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        await register(form.full_name.trim(), email, form.password, form.confirm_password);
      } else {
        await login(email, form.password);
      }
      nav('/');
    } catch (e) {
      const validationMessage = e.response?.data?.errors?.[0]?.msg;
      setErr(validationMessage || e.response?.data?.message || (isRegister ? 'Account creation failed' : 'Login failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <form onSubmit={submit} className="card shadow-sm p-4" style={{ maxWidth: 430, width: '100%' }} noValidate>
        <h3 className="mb-1"> Didier's Choice</h3>
        <p className="text-muted small mb-3">Butcher Stock and Sales Management</p>

        <div className="btn-group w-100 mb-3" role="group" aria-label="Authentication mode">
          <button
            type="button"
            className={`btn btn-sm ${!isRegister ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => switchMode('login')}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`btn btn-sm ${isRegister ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => switchMode('register')}
          >
            Create account
          </button>
        </div>

        {err && <div className="alert alert-danger py-2">{err}</div>}

        {isRegister && (
          <div className="mb-3">
            <label className="form-label">Full name</label>
            <input
              className="form-control"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              required
              minLength="2"
              maxLength="120"
              autoComplete="name"
            />
          </div>
        )}

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className={`form-control ${emailLooksValid ? '' : 'is-invalid'}`}
            value={form.email}
            onChange={e => update('email', e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
          />
          {!emailLooksValid && <div className="invalid-feedback">Enter a valid email address.</div>}
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <div className="input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              value={form.password}
              onChange={e => update('password', e.target.value)}
              required
              minLength={isRegister ? 8 : 1}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {isRegister && (
          <>
            <div className="mb-3">
              <label className="form-label">Confirm password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`form-control ${passwordsMatch ? '' : 'is-invalid'}`}
                  value={form.confirm_password}
                  onChange={e => update('confirm_password', e.target.value)}
                  required
                  minLength="8"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
                {!passwordsMatch && <div className="invalid-feedback">Passwords do not match.</div>}
              </div>
            </div>

            <div className="small mb-3">
              <div className={checks.length ? 'text-success' : 'text-muted'}>At least 8 characters</div>
              <div className={checks.upper ? 'text-success' : 'text-muted'}>One uppercase letter</div>
              <div className={checks.lower ? 'text-success' : 'text-muted'}>One lowercase letter</div>
              <div className={checks.number ? 'text-success' : 'text-muted'}>One number</div>
              {form.confirm_password && passwordsMatch && <div className="text-success">Passwords match</div>}
            </div>
          </>
        )}

        <button className="btn btn-primary w-100" disabled={busy}>
          {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
        </button>

        {isRegister && (
          <p className="text-muted small mt-3 mb-0">
            The first account created becomes the administrator. Later accounts are created as sales users.
          </p>
        )}
      </form>
    </div>
  );
}
