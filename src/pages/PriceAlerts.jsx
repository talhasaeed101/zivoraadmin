import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { priceAlertApi } from '../services/api.js';
import './Dashboard.css';
import './BackInStock.css';

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

const formatOption = (value) => {
  const trimmed = String(value || '').trim();
  return trimmed || '—';
};

const formatMoney = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price)) {
    return '—';
  }
  return `PKR ${price.toLocaleString('en-PK')}`;
};

const EMPTY_SUMMARY = { total: 0, pending: 0, sent: 0, cancelled: 0 };

export default function PriceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    priceAlertApi
      .getAlerts({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      })
      .then((response) => {
        if (!isMounted) return;
        setAlerts(response.data?.alerts || []);
        setPagination(response.data?.pagination || null);
        setSummary(response.data?.summary || EMPTY_SUMMARY);
        setError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load price alerts');
        setAlerts([]);
        setPagination(null);
        setSummary(EMPTY_SUMMARY);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [search, statusFilter, page, reloadKey]);

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      setDetailError('');
      return undefined;
    }

    let isMounted = true;
    setDetailLoading(true);
    setDetailError('');

    priceAlertApi
      .getAlert(selectedId)
      .then((response) => {
        if (!isMounted) return;
        setSelected(response.data || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setDetailError(err.message || 'Failed to load alert details');
        setSelected(null);
      })
      .finally(() => {
        if (isMounted) {
          setDetailLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  const refreshList = () => {
    setLoading(true);
    setReloadKey((current) => current + 1);
  };

  const patchLocalRow = (updated) => {
    if (!updated?._id && !updated?.id) return;
    const id = String(updated._id || updated.id);
    setAlerts((current) =>
      current.map((row) => (String(row._id || row.id) === id ? { ...row, ...updated } : row))
    );
    setSelected((current) =>
      current && String(current._id || current.id) === id ? { ...current, ...updated } : current
    );
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (event) => {
    setPage(1);
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (pagination && nextPage > pagination.totalPages)) {
      return;
    }
    setPage(nextPage);
  };

  const closeDetail = () => {
    setSelectedId(null);
    setSelected(null);
    setDetailError('');
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await priceAlertApi.cancel(cancelTarget._id || cancelTarget.id);
      const updated = response.data;
      setSuccessMessage('Price alert cancelled.');
      setCancelTarget(null);
      patchLocalRow(updated);
      refreshList();
    } catch (err) {
      setError(err.message || 'Failed to cancel alert');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    setError('');
    try {
      const id = deleteTarget._id || deleteTarget.id;
      await priceAlertApi.delete(id);
      setSuccessMessage('Price alert deleted.');
      setDeleteTarget(null);
      if (String(selectedId) === String(id)) {
        closeDetail();
      }
      refreshList();
    } catch (err) {
      setError(err.message || 'Failed to delete alert');
    } finally {
      setActionLoading(false);
    }
  };

  const productTitle = (row) => row?.product?.title || 'Unknown product';

  return (
    <AdminLayout title="Price Alerts" label="Marketing">
      <div className="back-in-stock-page">
        <div className="bis-summary-grid" aria-label="Alert summary">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Total</span>
            <strong className="dashboard-stat-value">{summary.total}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Pending</span>
            <strong className="dashboard-stat-value">{summary.pending}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Sent</span>
            <strong className="dashboard-stat-value">{summary.sent}</strong>
          </div>
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-label">Cancelled</span>
            <strong className="dashboard-stat-value">{summary.cancelled}</strong>
          </div>
        </div>

        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search email or product..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select className="filter-select" value={statusFilter} onChange={handleStatusChange}>
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>
        </div>

        {successMessage ? (
          <div className="alert-banner alert-success">{successMessage}</div>
        ) : null}
        {error ? (
          <div className="alert-banner alert-error">
            <span>{error}</span>
            <button type="button" className="btn-text" onClick={refreshList}>
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="bis-skeleton-wrap" aria-busy="true" aria-label="Loading alerts">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="bis-skeleton-row" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="state-card">
            {search || statusFilter
              ? 'No alerts match your filters.'
              : 'No price drop alerts yet.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer email</th>
                    <th>Product</th>
                    <th>Watched price</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((row) => {
                    const id = row._id || row.id;
                    return (
                      <tr key={id}>
                        <td>
                          <button
                            type="button"
                            className="bis-link-btn"
                            onClick={() => setSelectedId(id)}
                          >
                            {row.email}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="bis-link-btn"
                            onClick={() => setSelectedId(id)}
                          >
                            {productTitle(row)}
                          </button>
                        </td>
                        <td>{formatMoney(row.subscribedPrice)}</td>
                        <td>
                          <span className={`status-badge status-${row.status}`}>{row.status}</span>
                        </td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td>{formatDate(row.sentAt)}</td>
                        <td>
                          <div className="table-actions">
                            {row.status === 'pending' ? (
                              <button
                                type="button"
                                className="btn-text"
                                onClick={() => setCancelTarget(row)}
                              >
                                Cancel
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn-text danger"
                              onClick={() => setDeleteTarget(row)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination ? (
              <div className="pagination-bar">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {pagination.page} of {pagination.totalPages || 1}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= (pagination.totalPages || 1)}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {selectedId ? (
        <div className="bis-drawer-overlay" onClick={closeDetail} role="presentation">
          <aside
            className="bis-drawer"
            role="dialog"
            aria-label="Price alert details"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="bis-drawer-header">
              <h2>Alert details</h2>
              <button type="button" className="bis-drawer-close" onClick={closeDetail}>
                ×
              </button>
            </div>
            {detailLoading ? (
              <p>Loading…</p>
            ) : detailError ? (
              <p className="bis-drawer-error">{detailError}</p>
            ) : selected ? (
              <dl className="bis-drawer-dl">
                <div>
                  <dt>Email</dt>
                  <dd>{selected.email}</dd>
                </div>
                <div>
                  <dt>Product</dt>
                  <dd>{productTitle(selected)}</dd>
                </div>
                <div>
                  <dt>Ring size</dt>
                  <dd>{formatOption(selected.ringSize)}</dd>
                </div>
                <div>
                  <dt>Metal color</dt>
                  <dd>{formatOption(selected.metalColor)}</dd>
                </div>
                <div>
                  <dt>Subscribed price</dt>
                  <dd>{formatMoney(selected.subscribedPrice)}</dd>
                </div>
                <div>
                  <dt>Last notified price</dt>
                  <dd>{formatMoney(selected.lastNotifiedPrice)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{selected.status}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(selected.createdAt)}</dd>
                </div>
                <div>
                  <dt>Sent</dt>
                  <dd>{formatDate(selected.sentAt)}</dd>
                </div>
              </dl>
            ) : null}
          </aside>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(cancelTarget)}
        title="Cancel price alert"
        message={
          cancelTarget
            ? `Cancel the price alert for ${cancelTarget.email}?`
            : ''
        }
        confirmLabel="Cancel alert"
        loadingLabel="Cancelling..."
        loading={actionLoading}
        onConfirm={handleCancelConfirm}
        onCancel={() => (!actionLoading ? setCancelTarget(null) : null)}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete price alert"
        message={
          deleteTarget
            ? `Permanently delete the alert for ${deleteTarget.email}?`
            : ''
        }
        confirmLabel="Delete"
        loadingLabel="Deleting..."
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => (!actionLoading ? setDeleteTarget(null) : null)}
      />
    </AdminLayout>
  );
}
