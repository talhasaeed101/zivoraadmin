import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminLayout.css';

const navLinks = [
  { label: 'Dashboard', to: '/' },
  { label: 'Categories', to: '/categories' },
  { label: 'Products', to: '/products' },
  { label: 'Orders', to: '/orders' },
  { label: 'Reviews', to: '/reviews' },
  { label: 'Promo Codes', to: '/promo-codes' },
];

export default function AdminLayout({ title, label = 'Admin Panel', children }) {
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h1 className="sidebar-logo">ZIVORA</h1>
          <span className="sidebar-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <button type="button" className="sidebar-link sidebar-link-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="header-label">{label}</p>
            <h2 className="header-title">{title}</h2>
          </div>

          <div className="header-actions">
            <div className="header-admin">
              <span className="header-admin-name">{admin?.name || 'Admin'}</span>
              <span className="header-admin-email">{admin?.email}</span>
            </div>
          </div>
        </header>

        <section className="dashboard-content">{children}</section>
      </div>
    </div>
  );
}
