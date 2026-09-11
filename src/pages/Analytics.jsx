import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { analyticsApi } from '../services/api.js';
import './Analytics.css';

const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 Days' },
  { value: 'last30', label: 'Last 30 Days' },
  { value: 'last90', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
];

const SOURCE_HINT =
  'Each visitor is counted once from their first event in this range. Unknown means that event had no classified source.';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatNumber = (value) => new Intl.NumberFormat('en-PK').format(Number(value) || 0);

const formatPercent = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}%`;
};

const formatRangeLabel = (startYmd, endYmd) => {
  if (!startYmd || !endYmd) return '';
  const fmt = (ymd) => {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(Date.UTC(year, month - 1, day));
  };
  if (startYmd === endYmd) return fmt(startYmd);
  return `${fmt(startYmd)} – ${fmt(endYmd)}`;
};

const formatChartDate = (ymd) => {
  if (!ymd) return '';
  const [year, month, day] = ymd.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(Date.UTC(year, month - 1, day));
};

function MetricTip({ text }) {
  return (
    <span className="analytics-tip" tabIndex={0} aria-label={text}>
      i
      <span className="analytics-tip-bubble" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function EmptyState({ title, body }) {
  return (
    <div className="analytics-empty">
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
    </div>
  );
}

function ChangeBadge({ comparison }) {
  if (!comparison || !comparison.hasPrevious) {
    return <span className="analytics-kpi-change analytics-kpi-flat">No previous data</span>;
  }

  const { direction, changePercent } = comparison;
  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const className =
    direction === 'up' ? 'analytics-kpi-up' : direction === 'down' ? 'analytics-kpi-down' : 'analytics-kpi-flat';

  return (
    <span className={`analytics-kpi-change ${className}`}>
      {arrow} {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

function KpiCard({ label, value, comparison, tip }) {
  return (
    <article className="analytics-kpi-card">
      <div className="analytics-kpi-top">
        <span className="analytics-kpi-label">{label}</span>
        {tip ? <MetricTip text={tip} /> : null}
      </div>
      <strong className="analytics-kpi-value">{value}</strong>
      <ChangeBadge comparison={comparison} />
    </article>
  );
}

function TimeSeriesChart({
  rows,
  series,
  formatValue = formatNumber,
  emptyTitle,
  emptyBody,
}) {
  const [hover, setHover] = useState(null);
  const hasData = series.some((item) => (item.values || []).some((value) => Number(value) > 0));

  if (!rows.length || !hasData) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  const width = 920;
  const height = 260;
  const padding = { top: 18, right: 18, bottom: 36, left: 72 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(1, ...series.flatMap((item) => item.values.map((value) => Number(value) || 0)));
  const niceMax = maxValue;
  const pointCount = rows.length;
  const xFor = (index) =>
    padding.left + (pointCount <= 1 ? plotWidth / 2 : (index / (pointCount - 1)) * plotWidth);
  const yFor = (value) => padding.top + plotHeight - (Number(value) / niceMax) * plotHeight;
  const labelStep = pointCount > 14 ? Math.ceil(pointCount / 7) : 1;

  const buildLine = (values) =>
    values
      .map((value, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}`)
      .join(' ');

  const buildArea = (values) => {
    const line = values
      .map((value, index) => `${xFor(index).toFixed(2)},${yFor(value).toFixed(2)}`)
      .join(' L ');
    return `M ${xFor(0).toFixed(2)},${(padding.top + plotHeight).toFixed(2)} L ${line} L ${xFor(pointCount - 1).toFixed(2)},${(padding.top + plotHeight).toFixed(2)} Z`;
  };

  const handleMove = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    const index = Math.min(pointCount - 1, Math.max(0, Math.round(ratio * (pointCount - 1))));
    setHover({
      index,
      left: `${(xFor(index) / width) * 100}%`,
    });
  };

  const ticks = [0, niceMax / 2, niceMax];

  return (
    <div className="analytics-chart-wrap">
      <svg
        className="analytics-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Analytics time series"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {ticks.map((tick, tickIndex) => (
          <g key={`tick-${tickIndex}`}>
            <line
              className="analytics-chart-grid"
              x1={padding.left}
              x2={width - padding.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
            />
            <text className="analytics-chart-axis" x={8} y={yFor(tick) + 3}>
              {formatValue(tick)}
            </text>
          </g>
        ))}
        {series.map((item) =>
          item.fill ? (
            <path key={`${item.key}-area`} d={buildArea(item.values)} fill={item.fill} opacity="0.18" />
          ) : null
        )}
        {series.map((item) => (
          <path
            key={item.key}
            d={buildLine(item.values)}
            fill="none"
            stroke={item.color}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
        {hover ? (
          <line
            x1={xFor(hover.index)}
            x2={xFor(hover.index)}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke="#c4bbb0"
            strokeDasharray="3 3"
          />
        ) : null}
        {rows.map((row, index) =>
          index % labelStep === 0 || index === pointCount - 1 ? (
            <text
              key={row.date}
              className="analytics-chart-axis"
              x={xFor(index)}
              y={height - 10}
              textAnchor="middle"
            >
              {formatChartDate(row.date)}
            </text>
          ) : null
        )}
      </svg>
      {hover ? (
        <div className="analytics-chart-tooltip" style={{ left: hover.left, top: 28 }}>
          <strong>{formatChartDate(rows[hover.index].date)}</strong>
          {series.map((item) => (
            <div key={item.key}>
              <span>{item.label}</span>
              <span>{formatValue(item.values[hover.index])}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="analytics-legend">
        {series.map((item) => (
          <span key={item.key} className="analytics-legend-item">
            <span className="analytics-legend-swatch" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Funnel({ funnel }) {
  const stages = funnel?.stages || [];
  const hasActivity = stages.some((stage) => Number(stage.count) > 0);

  if (!hasActivity) {
    return (
      <EmptyState
        title="No conversion activity yet"
        body="Visitor, product-view, cart, and checkout events in this range will appear as a funnel."
      />
    );
  }

  const maxCount = Math.max(1, ...stages.map((stage) => Number(stage.count) || 0));

  return (
    <div className="analytics-funnel">
      {stages.map((stage, index) => (
        <div key={stage.key}>
          <div className="analytics-funnel-stage">
            <div className="analytics-funnel-main">
              <div className="analytics-funnel-label">
                <span>{stage.label}</span>
                <strong>{formatNumber(stage.count)}</strong>
              </div>
              <div className="analytics-funnel-track">
                <div
                  className="analytics-funnel-fill"
                  style={{ width: `${Math.max(4, (stage.count / maxCount) * 100)}%` }}
                />
              </div>
            </div>
            <div className="analytics-funnel-rates">
              <span>{formatPercent(stage.percentOfVisitors)} of visitors</span>
              {index > 0 ? (
                <span>
                  {stage.percentOfPrevious == null ? '—' : formatPercent(stage.percentOfPrevious)} from previous
                </span>
              ) : null}
            </div>
          </div>
          {index < stages.length - 1 ? <div className="analytics-funnel-arrow">↓</div> : null}
        </div>
      ))}
      <p className="analytics-funnel-note">
        Left % uses unique visitors as the denominator. Right % uses the previous stage and can exceed 100% when events
        are tracked independently. Checkout completed counts purchase events. Orders from records:{' '}
        <strong>{formatNumber(funnel.orders || 0)}</strong>.
      </p>
    </div>
  );
}

function BreakdownList({ rows, labelKey, emptyTitle, emptyBody, unknownNote }) {
  const hasData = (rows || []).some((row) => Number(row.visitors) > 0);
  if (!hasData) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <div>
      <div className="analytics-breakdown">
        {rows.map((row) => (
          <div key={row[labelKey]} className="analytics-breakdown-row">
            <span>{row.label || row[labelKey]}</span>
            <div className="analytics-breakdown-track">
              <div className="analytics-breakdown-fill" style={{ width: `${Math.min(100, row.percent || 0)}%` }} />
            </div>
            <strong>
              {formatNumber(row.visitors)} · {formatPercent(row.percent)}
            </strong>
          </div>
        ))}
      </div>
      {unknownNote ? <p className="analytics-footnote">{unknownNote}</p> : null}
    </div>
  );
}

function productLabel(row) {
  return row.title || row.slug || row.sku || 'Untitled product';
}

function deriveFunnel(data) {
  if (data?.funnel?.stages?.length) return data.funnel;

  const visitors = Number(data?.traffic?.uniqueVisitors) || 0;
  const stagesInput = [
    { key: 'visitors', label: 'Visitors', count: visitors },
    { key: 'productViews', label: 'Product Views', count: Number(data?.productViews) || 0 },
    { key: 'addToCart', label: 'Add to Cart', count: Number(data?.sales?.addToCart) || 0 },
    { key: 'checkoutStarted', label: 'Checkout Started', count: Number(data?.sales?.checkoutStarted) || 0 },
    { key: 'checkoutCompleted', label: 'Checkout Completed', count: Number(data?.sales?.checkoutCompleted) || 0 },
  ];

  return {
    orders: Number(data?.sales?.orders) || 0,
    stages: stagesInput.map((stage, index) => {
      const previous = index === 0 ? null : stagesInput[index - 1];
      return {
        ...stage,
        percentOfVisitors: visitors > 0 ? Math.round((stage.count / visitors) * 1000) / 10 : null,
        percentOfPrevious:
          index === 0 ? 100 : previous?.count > 0 ? Math.round((stage.count / previous.count) * 1000) / 10 : null,
      };
    }),
  };
}

function deriveTopProducts(products = {}) {
  if (Array.isArray(products.top) && products.top.length) return products.top;

  const map = new Map();
  const rowFor = (key) => {
    const k = String(key || '').trim();
    if (!k) return null;
    if (!map.has(k)) {
      map.set(k, {
        key: k,
        slug: null,
        title: null,
        sku: null,
        image: null,
        views: 0,
        addToCart: 0,
        orders: 0,
        revenue: 0,
        conversionRate: null,
      });
    }
    return map.get(k);
  };

  for (const item of products.topViewed || []) {
    const row = rowFor(item.slug || item.productId);
    if (!row) continue;
    row.views = item.views || item.count || 0;
    row.slug = item.slug || row.slug;
    row.title = item.title || row.title;
    row.image = item.image || row.image;
  }

  for (const item of products.topAddedToCart || []) {
    const row = rowFor(item.productSlug || item.key);
    if (!row) continue;
    row.addToCart = item.count || item.addToCart || 0;
    row.slug = item.productSlug || row.slug;
    row.title = item.title || row.title;
    row.image = item.image || row.image;
  }

  for (const item of products.topPurchased || []) {
    const row = rowFor(item.productId || item.sku || item.title);
    if (!row) continue;
    row.orders = item.orders || 0;
    row.revenue = item.revenue || 0;
    row.title = item.title || row.title;
    row.sku = item.sku || row.sku;
    row.image = item.image || row.image;
  }

  return [...map.values()].map((row) => ({
    ...row,
    conversionRate: row.views > 0 ? Math.round((row.orders / row.views) * 1000) / 10 : null,
  }));
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState('last30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loadedKey, setLoadedKey] = useState('');
  const [error, setError] = useState('');
  const [salesMetric, setSalesMetric] = useState('revenue');
  const [productSort, setProductSort] = useState({ key: 'revenue', dir: 'desc' });

  const customIncomplete = range === 'custom' && (!from || !to);
  const fetchKey = range === 'custom' ? `custom:${from}:${to}` : range;
  const loading = !customIncomplete && loadedKey !== fetchKey;
  const displayError = customIncomplete
    ? 'Select both From and To dates for a custom range.'
    : error;

  useEffect(() => {
    if (range === 'custom' && (!from || !to)) {
      return undefined;
    }

    const params = range === 'custom' ? { range: 'custom', from, to } : { range };
    const requestKey = range === 'custom' ? `custom:${from}:${to}` : range;
    let cancelled = false;

    analyticsApi
      .getAnalytics(params)
      .then((response) => {
        if (cancelled) return;
        setData(response.data);
        setError('');
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(null);
        setError(err.message || 'Failed to load analytics');
        setLoadedKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [range, from, to]);

  const traffic = data?.traffic || {};
  const sales = data?.sales || {};
  const comparison = data?.comparison?.kpis || {};
  const daily = data?.daily || [];
  const topProducts = deriveTopProducts(data?.products || {});
  const funnel = deriveFunnel(data);

  const sortedProducts = useMemo(() => {
    const rows = [...topProducts];
    const { key, dir } = productSort;
    rows.sort((a, b) => {
      const left = a[key] ?? -1;
      const right = b[key] ?? -1;
      if (left === right) return 0;
      return dir === 'asc' ? left - right : right - left;
    });
    return rows;
  }, [topProducts, productSort]);

  const toggleSort = (key) => {
    setProductSort((current) =>
      current.key === key ? { key, dir: current.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' }
    );
  };

  const conversionValue =
    (traffic.uniqueVisitors || 0) === 0 ? '—' : formatPercent(sales.conversionRate, 2);
  const aovValue = (sales.orders || 0) === 0 ? '—' : formatPrice(sales.averageOrderValue);

  return (
    <AdminLayout title="Analytics" label="Insights">
      <div className="analytics-page">
        <div className="analytics-intro">
          <p className="analytics-subtitle">
            Understand your store performance and customer activity.
          </p>
          <div className="analytics-live" title="Distinct visitors with a page view in the last 5 minutes">
            <span className="analytics-live-dot" />
            {formatNumber(data?.realtime?.activeVisitorsLast5Min || 0)} browsing now
          </div>
        </div>

        {displayError ? <div className="alert-banner alert-error">{displayError}</div> : null}

        <div className="analytics-toolbar">
          <div className="analytics-range-pills" role="tablist" aria-label="Date range">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`analytics-range-pill ${range === option.value ? 'analytics-range-pill-active' : ''}`}
                onClick={() => setRange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {range === 'custom' ? (
            <div className="analytics-custom-dates">
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label="From date" />
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label="To date" />
            </div>
          ) : null}
          <div className="analytics-tz">
            <strong>{data?.timezone || 'Asia/Karachi'}</strong>
            <span>
              {data?.range
                ? `${formatRangeLabel(data.range.startYmd, data.range.endYmd)}`
                : 'Timezone-aware daily totals'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="analytics-skeleton-grid" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="analytics-skeleton-card" />
            ))}
          </div>
        ) : data && !customIncomplete ? (
          <>
            <div className="analytics-kpi-grid">
              <KpiCard
                label="Revenue"
                value={formatPrice(sales.revenue)}
                comparison={comparison.revenue}
                tip="Sum of order.total for non-cancelled orders in this range."
              />
              <KpiCard
                label="Orders"
                value={formatNumber(sales.orders)}
                comparison={comparison.orders}
                tip="Non-cancelled orders created in this range."
              />
              <KpiCard
                label="Conversion Rate"
                value={conversionValue}
                comparison={comparison.conversionRate}
                tip="Orders ÷ unique visitors × 100. Shown as — when there are no visitors."
              />
              <KpiCard
                label="Average Order Value"
                value={aovValue}
                comparison={comparison.averageOrderValue}
                tip="Revenue ÷ non-cancelled orders. Shown as — when there are no orders."
              />
              <KpiCard
                label="Visitors"
                value={formatNumber(traffic.uniqueVisitors)}
                comparison={comparison.uniqueVisitors}
                tip="Distinct visitor IDs in this range, falling back to session ID when needed."
              />
              <KpiCard
                label="Page Views"
                value={formatNumber(traffic.pageViews)}
                comparison={comparison.pageViews}
                tip="Counted pageview events after short-window dedupe."
              />
            </div>
            {data.comparison?.range ? (
              <p className="analytics-footnote" style={{ marginTop: -12 }}>
                Changes compare with {formatRangeLabel(data.comparison.range.startYmd, data.comparison.range.endYmd)}.
                New {formatNumber(traffic.newVisitors)} · Returning {formatNumber(traffic.returningVisitors)} · Sessions{' '}
                {formatNumber(traffic.sessions)}
              </p>
            ) : null}

            <section className="analytics-section">
              <div className="analytics-section-header">
                <div>
                  <h3>Sales overview</h3>
                  <p className="analytics-section-copy">
                    Daily totals from non-cancelled orders, grouped in {data.timezone}.
                  </p>
                </div>
                <div className="analytics-metric-toggle" role="tablist" aria-label="Sales metric">
                  <button
                    type="button"
                    className={salesMetric === 'revenue' ? 'active' : ''}
                    onClick={() => setSalesMetric('revenue')}
                  >
                    Revenue
                  </button>
                  <button
                    type="button"
                    className={salesMetric === 'orders' ? 'active' : ''}
                    onClick={() => setSalesMetric('orders')}
                  >
                    Orders
                  </button>
                </div>
              </div>
              <TimeSeriesChart
                rows={daily}
                series={[
                  salesMetric === 'revenue'
                    ? {
                        key: 'revenue',
                        label: 'Revenue',
                        color: '#967259',
                        fill: '#967259',
                        values: daily.map((row) => row.revenue || 0),
                      }
                    : {
                        key: 'orders',
                        label: 'Orders',
                        color: '#1a1a1a',
                        fill: '#1a1a1a',
                        values: daily.map((row) => row.orders || 0),
                      },
                ]}
                formatValue={salesMetric === 'revenue' ? formatPrice : formatNumber}
                emptyTitle="No sales data yet"
                emptyBody="Orders placed in this range will appear here. Cancelled orders are excluded."
              />
            </section>

            <section className="analytics-section">
              <div className="analytics-section-header">
                <div>
                  <h3>Traffic overview</h3>
                  <p className="analytics-section-copy">
                    Visitors, sessions, and page views from tracked storefront events only.
                  </p>
                </div>
              </div>
              <TimeSeriesChart
                rows={daily}
                series={[
                  {
                    key: 'uniqueVisitors',
                    label: 'Visitors',
                    color: '#967259',
                    values: daily.map((row) => row.uniqueVisitors || 0),
                  },
                  {
                    key: 'sessions',
                    label: 'Sessions',
                    color: '#c4a484',
                    values: daily.map((row) => row.sessions || row.visits || 0),
                  },
                  {
                    key: 'pageViews',
                    label: 'Page Views',
                    color: '#3d3d3d',
                    values: daily.map((row) => row.pageViews || 0),
                  },
                ]}
                emptyTitle="No traffic data yet"
                emptyBody="Page views and sessions are recorded after analytics tracking was deployed — earlier history is not estimated."
              />
            </section>

            <div className="analytics-grid-2">
              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>Conversion funnel</h3>
                    <p className="analytics-section-copy">
                      Event-based path from visitors to checkout. Orders are shown separately because they come from
                      order records.
                    </p>
                  </div>
                </div>
                <Funnel funnel={funnel} />
              </section>
              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>Devices</h3>
                    <p className="analytics-section-copy">Share of unique visitors by first device in this range.</p>
                  </div>
                </div>
                <BreakdownList
                  rows={(data.devices || []).map((row) => ({
                    ...row,
                    label: row.device
                      ? row.device.charAt(0).toUpperCase() + row.device.slice(1)
                      : 'Unknown',
                  }))}
                  labelKey="device"
                  emptyTitle="No device data yet"
                  emptyBody="Device mix appears once visitors are tracked in this range."
                  unknownNote="Unknown is used when the first event in range had no classified user agent."
                />
              </section>
            </div>

            <section className="analytics-section">
              <div className="analytics-section-header">
                <div>
                  <h3>Top products</h3>
                  <p className="analytics-section-copy">
                    Views and add-to-cart from events; orders and revenue from non-cancelled line items. Conversion is
                    orders ÷ views.
                  </p>
                </div>
              </div>
              {sortedProducts.length ? (
                <div className="analytics-table-wrap">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="num">
                          <button type="button" onClick={() => toggleSort('views')}>
                            Views
                          </button>
                        </th>
                        <th className="num">
                          <button type="button" onClick={() => toggleSort('addToCart')}>
                            Add to Cart
                          </button>
                        </th>
                        <th className="num">
                          <button type="button" onClick={() => toggleSort('orders')}>
                            Orders
                          </button>
                        </th>
                        <th className="num">
                          <button type="button" onClick={() => toggleSort('revenue')}>
                            Revenue
                          </button>
                        </th>
                        <th className="num">
                          <button type="button" onClick={() => toggleSort('conversionRate')}>
                            Conversion
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedProducts.map((row) => (
                        <tr key={row.key}>
                          <td>
                            <div className="analytics-product-cell">
                              {row.image ? (
                                <img
                                  className="analytics-product-thumb"
                                  src={row.image}
                                  alt=""
                                  onError={(event) => {
                                    event.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="analytics-product-placeholder" aria-hidden="true" />
                              )}
                              <div>
                                <span className="analytics-product-name" title={productLabel(row)}>
                                  {productLabel(row)}
                                </span>
                                {row.slug ? <span className="analytics-product-slug">{row.slug}</span> : null}
                              </div>
                            </div>
                          </td>
                          <td className="num">{formatNumber(row.views)}</td>
                          <td className="num">{formatNumber(row.addToCart)}</td>
                          <td className="num">{formatNumber(row.orders)}</td>
                          <td className="num">{formatPrice(row.revenue)}</td>
                          <td className="num">{row.conversionRate == null ? '—' : formatPercent(row.conversionRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No product data for this period"
                  body="Product views, carts, and purchases in this range will appear in this table."
                />
              )}
            </section>

            <div className="analytics-grid-2">
              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>Top pages</h3>
                    <p className="analytics-section-copy">Most viewed storefront paths in this range.</p>
                  </div>
                </div>
                {(data.topPages || []).length ? (
                  <div className="analytics-table-wrap">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Page</th>
                          <th className="num">Views</th>
                          <th className="num">Unique Visitors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topPages.map((row) => (
                          <tr key={row.path}>
                            <td>
                              <span className="analytics-path" title={row.path}>
                                {row.path}
                              </span>
                            </td>
                            <td className="num">{formatNumber(row.pageViews)}</td>
                            <td className="num">{formatNumber(row.uniqueVisitors)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No page views yet" body="Paths with pageview events will be listed here." />
                )}
              </section>

              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>Traffic sources</h3>
                    <p className="analytics-section-copy">First-touch source for each unique visitor.</p>
                  </div>
                </div>
                <BreakdownList
                  rows={data.sources || []}
                  labelKey="source"
                  emptyTitle="No traffic sources yet"
                  emptyBody="Direct, search, social, referral, and campaign visits will show once events are tracked."
                  unknownNote={SOURCE_HINT}
                />
              </section>
            </div>

            <div className="analytics-grid-2">
              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>Locations</h3>
                    <p className="analytics-section-copy">
                      Country only, from hosting edge headers. Percent is of all unique visitors.
                    </p>
                  </div>
                </div>
                {(data.locations || []).length ? (
                  <div className="analytics-table-wrap">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Country</th>
                          <th className="num">Visitors</th>
                          <th className="num">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.locations.map((row) => (
                          <tr key={row.country}>
                            <td>{row.country}</td>
                            <td className="num">{formatNumber(row.visitors)}</td>
                            <td className="num">{formatPercent(row.percent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No location data yet"
                    body="Countries appear only when the host provides a country header. That data is not estimated."
                  />
                )}
              </section>

              <section className="analytics-section">
                <div className="analytics-section-header">
                  <div>
                    <h3>UTM campaigns</h3>
                    <p className="analytics-section-copy">
                      From stored campaign parameters on analytics events. Order and revenue attribution is not
                      available.
                    </p>
                  </div>
                </div>
                {(data.utmCampaigns || []).length ? (
                  <div className="analytics-table-wrap">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Campaign</th>
                          <th className="num">Visitors</th>
                          <th className="num">Sessions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.utmCampaigns.map((row) => (
                          <tr key={`${row.campaign}-${row.source}-${row.medium}`}>
                            <td>
                              <span className="analytics-product-name">{row.campaign}</span>
                              <span className="analytics-product-slug">
                                {[row.source, row.medium].filter(Boolean).join(' / ') || 'No source / medium'}
                              </span>
                            </td>
                            <td className="num">{formatNumber(row.visitors)}</td>
                            <td className="num">{formatNumber(row.sessions)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    title="No campaign traffic recorded"
                    body="UTM campaigns appear when visits include utm_campaign. Orders and revenue are omitted because orders do not store UTM fields."
                  />
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
