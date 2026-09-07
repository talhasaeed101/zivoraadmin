import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ADMIN_PANEL_ROLES } from '../constants/roles.js';
import { hasAnyRole } from '../constants/permissions.js';
import NotificationBell from './NotificationBell.jsx';
import './AdminLayout.css';

/**
 * All nav items use ADMIN_PANEL_ROLES intentionally.
 * Backend currently allows every panel role on these modules — do not invent
 * STAFF/MANAGER hide rules without matching backend middleware.
 */
const navLinks = [
  { label: 'Dashboard', to: '/', roles: ADMIN_PANEL_ROLES },
  { label: 'Analytics', to: '/analytics', roles: ADMIN_PANEL_ROLES },
  { label: 'Categories', to: '/categories', roles: ADMIN_PANEL_ROLES },
  { label: 'Products', to: '/products', roles: ADMIN_PANEL_ROLES },
  { label: 'Orders', to: '/orders', roles: ADMIN_PANEL_ROLES },
  { label: 'Customers', to: '/customers', roles: ADMIN_PANEL_ROLES },
  { label: 'Reviews', to: '/reviews', roles: ADMIN_PANEL_ROLES },
  { label: 'Promo Codes', to: '/promo-codes', roles: ADMIN_PANEL_ROLES },
  { label: 'Campaigns', to: '/campaigns', roles: ADMIN_PANEL_ROLES },
  { label: 'Tickets', to: '/tickets', roles: ADMIN_PANEL_ROLES },
  { label: 'Messages', to: '/messages', roles: ADMIN_PANEL_ROLES },
  { label: 'Newsletter', to: '/newsletter', roles: ADMIN_PANEL_ROLES },
  { label: 'Back In Stock', to: '/back-in-stock', roles: ADMIN_PANEL_ROLES },
];

export default function AdminLayout({ title, label = 'Admin Panel', children }) {
  const navigate = useNavigate();
  const { admin, role, logout } = useAuth();

  const visibleLinks = navLinks.filter((link) => hasAnyRole(role, link.roles));

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
          {visibleLinks.map((link) => (
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
            <NotificationBell />
            <div className="header-admin">
              <span className="header-admin-name">{admin?.name || 'Admin'}</span>
              <span className="header-admin-email">{admin?.email}</span>
              {role ? <span className="header-admin-role">{role}</span> : null}
            </div>
          </div>
        </header>

        <section className="dashboard-content">{children}</section>
      </div>
    </div>
  );
}
