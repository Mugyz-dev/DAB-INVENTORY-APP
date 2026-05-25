import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();

  const link = ({ isActive }) =>
    'nav-link' + (isActive ? ' active fw-semibold' : '');

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
        <Link className="navbar-brand fw-bold" to="/">DAB Enterprise</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><NavLink to="/" end className={link}>Dashboard</NavLink></li>
            <li className="nav-item"><NavLink to="/products" className={link}>Products</NavLink></li>
            <li className="nav-item"><NavLink to="/sales" className={link}>Sales</NavLink></li>
            {isAdmin && <>
              <li className="nav-item"><NavLink to="/categories" className={link}>Categories</NavLink></li>
              <li className="nav-item"><NavLink to="/suppliers" className={link}>Suppliers</NavLink></li>
              <li className="nav-item"><NavLink to="/inventory" className={link}>Inventory</NavLink></li>
              <li className="nav-item"><NavLink to="/users" className={link}>Users</NavLink></li>
              <li className="nav-item"><NavLink to="/reports" className={link}>Reports</NavLink></li>
            </>}
          </ul>
          <span className="text-light me-3">{user?.full_name} ({user?.role})</span>
          <button className="btn btn-outline-light btn-sm"
                  onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </div>
      </nav>
      <main className="container-fluid py-4 flex-grow-1"><Outlet /></main>
      <footer className="text-center text-muted py-3 small border-top">
        © {new Date().getFullYear()} DAB Enterprise Ltd
      </footer>
    </div>
  );
}
