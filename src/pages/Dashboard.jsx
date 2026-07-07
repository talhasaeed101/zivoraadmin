import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AdminLayout from '../components/AdminLayout.jsx';
import { dashboardApi } from '../services/api.js';
import './Dashboard.css';

const formatPrice = (value) => {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value) => {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-PK').format(value);
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const formatRating = (value) => {
  if (value === undefined || value === null) {
    return '—';
  }

  return Number(value).toFixed(1);
};

const STAT_CARDS = [
  { key: 'totalRevenue', label: 'Total Revenue', format: 'currency' },
  { key: 'totalOrders', label: 'Total Orders', format: 'number' },
  { key: 'pendingOrders', label: 'Pending Orders', format: 'number' },
  { key: 'totalCustomers', label: 'Customers', format: 'number' },
  { key: 'totalProducts', label: 'Products', format: 'number' },
  { key: 'totalReviews', label: 'Reviews', format: 'number' },
  { key: 'activePromoCodes', label: 'Active Promo Codes', format: 'number' },
  { key: 'averageRating', label: 'Average Rating', format: 'rating' },
];

const QUICK_ACTIONS = [
  { label: 'Add Product', to: '/products/new' },
  { label: 'Add Category', to: '/categories/new' },
  { label: 'Create Promo Code', to: '/promo-codes/new' },
  { label: 'View Orders', to: '/orders' },
];

function StatCardSkeleton() {
  return (
    <div className="dashboard-stat-card dashboard-skeleton-card">
      <div className="dashboard-skeleton dashboard-skeleton-label" />
      <div className="dashboard-skeleton dashboard-skeleton-value" />
    </div>
  );
}

function formatStatValue(value, format) {
  if (format === 'currency') {
    return formatPrice(value);
  }

  if (format === 'rating') {
    return formatRating(value);
  }

  return formatNumber(value);
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [overview, setOverview] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [overviewResponse, recentOrdersResponse, topProductsResponse] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getRecentOrders(),
        dashboardApi.getTopProducts(),
      ]);

      setOverview(overviewResponse.data || null);
      setRecentOrders(recentOrdersResponse.data?.orders || []);
      setTopProducts(topProductsResponse.data?.products || []);
    } catch (err) {
      setOverview(null);
      setRecentOrders([]);
      setTopProducts([]);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <AdminLayout title="Dashboard" label="Admin Panel">
      <div className="dashboard-page">
        <div className="welcome-card">
          <h3>Welcome back, {admin?.name || 'Admin'}.</h3>
          <p>
            Here is a snapshot of your store performance, recent orders, and best-selling products.
          </p>
        </div>

        {error && (
          <div className="dashboard-error-banner">
            <p>{error}</p>
            <button type="button" className="btn-secondary" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Overview</h3>
          </div>

          <div className="dashboard-stats-grid">
            {loading
              ? STAT_CARDS.map((card) => <StatCardSkeleton key={card.key} />)
              : STAT_CARDS.map((card) => (
                  <div key={card.key} className="dashboard-stat-card">
                    <span className="dashboard-stat-label">{card.label}</span>
                    <strong className="dashboard-stat-value">
                      {formatStatValue(overview?.[card.key], card.format)}
                    </strong>
                  </div>
                ))}
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="dashboard-quick-actions">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to} className="dashboard-quick-action">
                {action.label}
              </Link>
            ))}
          </div>
        </section>

        <div className="dashboard-panels">
          <section className="dashboard-section dashboard-panel">
            <div className="dashboard-section-header">
              <h3>Recent Orders</h3>
              <Link to="/orders" className="dashboard-section-link">
                View all
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-table-skeleton">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="dashboard-skeleton dashboard-skeleton-row" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="state-card">No orders yet. Customer orders will appear here.</div>
            ) : (
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>
                          <div className="dashboard-customer-cell">
                            <strong>{order.customerName || '—'}</strong>
                            {order.customerEmail && (
                              <span>{order.customerEmail}</span>
                            )}
                          </div>
                        </td>
                        <td>{formatPrice(order.total)}</td>
                        <td>
                          <span className={`status-badge status-badge-${(order.paymentStatus || '').toLowerCase().replace(/\s+/g, '-')}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge status-badge-${order.orderStatus}`}>
                            {order.orderStatus}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>
                          <Link to={`/orders/${order._id}`} className="btn-text">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="dashboard-section dashboard-panel">
            <div className="dashboard-section-header">
              <h3>Top Products</h3>
              <Link to="/products" className="dashboard-section-link">
                View products
              </Link>
            </div>

            {loading ? (
              <div className="dashboard-top-products-skeleton">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="dashboard-top-product-card dashboard-skeleton-card">
                    <div className="dashboard-skeleton dashboard-skeleton-thumb" />
                    <div className="dashboard-top-product-meta">
                      <div className="dashboard-skeleton dashboard-skeleton-label" />
                      <div className="dashboard-skeleton dashboard-skeleton-value" />
                    </div>
                  </div>
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="state-card">
                No sales data yet. Top products will appear after orders are placed.
              </div>
            ) : (
              <div className="dashboard-top-products">
                {topProducts.map((product) => (
                  <div key={product.productId} className="dashboard-top-product-card">
                    <div className="dashboard-top-product-image-wrap">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="dashboard-top-product-image"
                        />
                      ) : (
                        <div className="dashboard-top-product-placeholder">No image</div>
                      )}
                    </div>
                    <div className="dashboard-top-product-meta">
                      <strong>{product.title}</strong>
                      <span className="dashboard-top-product-sku">{product.sku || '—'}</span>
                      <div className="dashboard-top-product-stats">
                        <span>{formatNumber(product.soldQuantity)} sold</span>
                        <span>{formatPrice(product.revenue)} revenue</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
