import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { analyticsApi } from '../services/api.js';
import './Dashboard.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(
    value || 0
  );

export default function Analytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    analyticsApi
      .getAnalytics(days)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <AdminLayout title="Analytics" label="Insights">
      <div className="dashboard-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="page-toolbar">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading ? (
          <div className="state-card">Loading analytics...</div>
        ) : data ? (
          <>
            <div className="dashboard-stats-grid">
              <div className="dashboard-stat-card"><span>Page Views</span><strong>{data.pageViews}</strong></div>
              <div className="dashboard-stat-card"><span>Unique Visitors</span><strong>{data.uniqueVisitors}</strong></div>
              <div className="dashboard-stat-card"><span>Product Views</span><strong>{data.productViews}</strong></div>
              <div className="dashboard-stat-card"><span>Add to Cart</span><strong>{data.addToCartEvents}</strong></div>
              <div className="dashboard-stat-card"><span>Orders</span><strong>{data.orders}</strong></div>
              <div className="dashboard-stat-card"><span>Revenue</span><strong>{formatPrice(data.revenue)}</strong></div>
              <div className="dashboard-stat-card"><span>Conversion</span><strong>{data.conversionRate}%</strong></div>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <h3>Top Pages</h3>
                <ul className="dashboard-list">
                  {(data.topPages || []).map((row) => (
                    <li key={row.path}>{row.path} — {row.count}</li>
                  ))}
                </ul>
              </section>
              <section className="dashboard-panel">
                <h3>Top Viewed Products</h3>
                <ul className="dashboard-list">
                  {(data.topViewedProducts || []).map((row) => (
                    <li key={row.slug}>{row.slug} — {row.count}</li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
