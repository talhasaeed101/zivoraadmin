import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { analyticsApi } from '../services/api.js';
import './Dashboard.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value || 0);

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'thismonth', label: 'This Month' },
  { value: 'custom', label: 'Custom' },
];

function StatCard({ label, value }) {
  return (
    <div className="dashboard-stat-card">
      <span className="dashboard-stat-label">{label}</span>
      <strong className="dashboard-stat-value">{value}</strong>
    </div>
  );
}

function SimpleBarChart({ rows = [] }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.pageViews) || 0));
  if (!rows.length) {
    return <div className="state-card">No page-view data in this range yet.</div>;
  }

  return (
    <div className="analytics-bar-chart" aria-label="Daily page views">
      {rows.map((row) => {
        const height = Math.max(4, Math.round(((Number(row.pageViews) || 0) / max) * 120));
        return (
          <div key={row.date} className="analytics-bar-col" title={`${row.date}: ${row.pageViews} page views`}>
            <div className="analytics-bar" style={{ height: `${height}px` }} />
            <span className="analytics-bar-label">{String(row.date).slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('last30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const params =
      range === 'custom'
        ? { range: 'custom', from, to }
        : { range };

    if (range === 'custom' && (!from || !to)) {
      setLoading(false);
      setError('Select both From and To dates for a custom range.');
      return;
    }

    analyticsApi
      .getAnalytics(params)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [range, from, to]);

  const traffic = data?.traffic || {};
  const sales = data?.sales || {};

  return (
    <AdminLayout title="Analytics" label="Insights">
      <div className="dashboard-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="page-toolbar analytics-toolbar">
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {RANGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {range === 'custom' ? (
            <>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          ) : null}
          {data?.range ? (
            <span className="dashboard-stat-label">
              {data.range.label} · {data.range.startYmd} → {data.range.endYmd} · {data.timezone}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="state-card">Loading analytics...</div>
        ) : data ? (
          <>
            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Traffic</h3>
              </div>
              <div className="dashboard-stats-grid">
                <StatCard label="Visits" value={traffic.visits ?? 0} />
                <StatCard label="Unique Visitors" value={traffic.uniqueVisitors ?? 0} />
                <StatCard label="Page Views" value={traffic.pageViews ?? 0} />
                <StatCard label="Sessions" value={traffic.sessions ?? 0} />
                <StatCard label="New Visitors" value={traffic.newVisitors ?? 0} />
                <StatCard label="Returning Visitors" value={traffic.returningVisitors ?? 0} />
                <StatCard
                  label="Active (5 min)"
                  value={data.realtime?.activeVisitorsLast5Min ?? 0}
                />
              </div>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Sales</h3>
              </div>
              <div className="dashboard-stats-grid">
                <StatCard label="Orders" value={sales.orders ?? 0} />
                <StatCard label="Units Sold" value={sales.unitsSold ?? 0} />
                <StatCard label="Revenue" value={formatPrice(sales.revenue)} />
                <StatCard label="AOV" value={formatPrice(sales.averageOrderValue)} />
                <StatCard label="Add to Cart" value={sales.addToCart ?? 0} />
                <StatCard label="Checkout Started" value={sales.checkoutStarted ?? 0} />
                <StatCard label="Checkout Completed" value={sales.checkoutCompleted ?? 0} />
                <StatCard label="Conversion" value={`${sales.conversionRate ?? 0}%`} />
              </div>
              <p className="dashboard-stat-label" style={{ marginTop: 8 }}>
                Orders/revenue exclude cancelled orders. Website traffic is tracked events only (not
                fabricated history).
              </p>
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-header">
                <h3>Daily Traffic</h3>
              </div>
              <SimpleBarChart rows={data.daily || []} />
              <div className="admin-table-wrap" style={{ marginTop: 16 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Visits</th>
                      <th>Unique Visitors</th>
                      <th>Page Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.daily || []).map((row) => (
                      <tr key={row.date}>
                        <td>{row.date}</td>
                        <td>{row.visits}</td>
                        <td>{row.uniqueVisitors}</td>
                        <td>{row.pageViews}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <h3>Top Pages</h3>
                <ul className="dashboard-list">
                  {(data.topPages || []).map((row) => (
                    <li key={row.path}>
                      {row.path} — {row.pageViews} views · {row.uniqueVisitors} unique
                    </li>
                  ))}
                  {!data.topPages?.length ? <li>No page data yet.</li> : null}
                </ul>
              </section>
              <section className="dashboard-panel">
                <h3>Top Viewed Products</h3>
                <ul className="dashboard-list">
                  {(data.products?.topViewed || []).map((row) => (
                    <li key={row.slug}>
                      {row.slug} — {row.views} views · {row.uniqueViewers} unique
                    </li>
                  ))}
                  {!data.products?.topViewed?.length ? <li>No product views yet.</li> : null}
                </ul>
              </section>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <h3>Top Added to Cart</h3>
                <ul className="dashboard-list">
                  {(data.products?.topAddedToCart || []).map((row) => (
                    <li key={row.key}>
                      {row.productSlug || row.key} — {row.count}
                    </li>
                  ))}
                  {!data.products?.topAddedToCart?.length ? <li>No add-to-cart events yet.</li> : null}
                </ul>
              </section>
              <section className="dashboard-panel">
                <h3>Top Purchased</h3>
                <ul className="dashboard-list">
                  {(data.products?.topPurchased || []).map((row) => (
                    <li key={String(row.productId)}>
                      {row.title || row.sku || row.productId} — {row.units} units ·{' '}
                      {formatPrice(row.revenue)}
                    </li>
                  ))}
                  {!data.products?.topPurchased?.length ? <li>No purchases in range.</li> : null}
                </ul>
              </section>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <h3>Traffic Sources</h3>
                <ul className="dashboard-list">
                  {(data.sources || []).map((row) => (
                    <li key={row.source}>
                      {row.source} — {row.visitors} visitors ({row.percent}%)
                    </li>
                  ))}
                  {!data.sources?.length ? <li>No source data yet.</li> : null}
                </ul>
              </section>
              <section className="dashboard-panel">
                <h3>Devices</h3>
                <ul className="dashboard-list">
                  {(data.devices || []).map((row) => (
                    <li key={row.device}>
                      {row.device} — {row.visitors} visitors ({row.percent}%)
                    </li>
                  ))}
                  {!data.devices?.length ? <li>No device data yet.</li> : null}
                </ul>
              </section>
            </div>

            <div className="dashboard-panels">
              <section className="dashboard-panel">
                <h3>UTM Campaigns</h3>
                <ul className="dashboard-list">
                  {(data.utmCampaigns || []).map((row) => (
                    <li key={`${row.campaign}-${row.source}-${row.medium}`}>
                      {row.campaign}
                      {row.source ? ` · ${row.source}` : ''}
                      {row.medium ? ` / ${row.medium}` : ''} — {row.visitors} visitors
                    </li>
                  ))}
                  {!data.utmCampaigns?.length ? <li>No UTM campaigns in range.</li> : null}
                </ul>
              </section>
              <section className="dashboard-panel">
                <h3>Locations</h3>
                <ul className="dashboard-list">
                  {(data.locations || []).map((row) => (
                    <li key={`${row.country}-${row.region}`}>
                      {row.country}
                      {row.region ? ` · ${row.region}` : ''} — {row.visitors} visitors
                    </li>
                  ))}
                  {!data.locations?.length ? (
                    <li>No coarse location headers available yet.</li>
                  ) : null}
                </ul>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
