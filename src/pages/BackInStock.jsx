import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { backInStockApi } from '../services/api.js';
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

const EMPTY_SUMMARY = { total: 0, pending: 0, sent: 0, cancelled: 0 };

export default function BackInStock() {
  const [subscriptions, setSubscriptions] = useState([]);
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
  const [resendTarget, setResendTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    backInStockApi
      .getSubscriptions({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      })
      .then((response) => {
        if (!isMounted) return;
        setSubscriptions(response.data?.subscriptions || []);
        setPagination(response.data?.pagination || null);
        setSummary(response.data?.summary || EMPTY_SUMMARY);
        setError('');
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to load back-in-stock subscriptions');
        setSubscriptions([]);
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

    backInStockApi
      .getSubscription(selectedId)
      .then((response) => {
        if (!isMounted) return;
        setSelected(response.data || null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setDetailError(err.message || 'Failed to load subscription details');
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
    setSubscriptions((current) =>
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
      const response = await backInStockApi.cancel(cancelTarget._id || cancelTarget.id);
      const updated = response.data;
      setSuccessMessage('Subscription cancelled.');
      setCancelTarget(null);
      patchLocalRow(updated);
      refreshList();
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendConfirm = async () => {
    if (!resendTarget) return;
    setActionLoading(true);
    setError('');
    try {
      const response = await backInStockApi.resend(resendTarget._id || resendTarget.id);
      const updated = response.data;
      setSuccessMessage('Notification resent successfully.');
      setResendTarget(null);
      patchLocalRow(updated);
      refreshList();
    } catch (err) {
      setError(err.message || 'Failed to resend notification');
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
      await backInStockApi.delete(id);
      setSuccessMessage('Subscription deleted.');
      setDeleteTarget(null);
      if (String(selectedId) === String(id)) {
        closeDetail();
      }
      refreshList();
    } catch (err) {
      setError(err.message || 'Failed to delete subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const productTitle = (row) => row?.product?.title || 'Unknown product';
  const productImage = (row) =>
    Array.isArray(row?.product?.images) ? row.product.images.find(Boolean) : null;

  return (
    <AdminLayout title="Back In Stock" label="Marketing">
      <div className="back-in-stock-page">
        <div className="bis-summary-grid" aria-label="Subscription summary">
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
          <div className="bis-skeleton-wrap" aria-busy="true" aria-label="Loading subscriptions">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="bis-skeleton-row" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="state-card">
            {search || statusFilter
              ? 'No subscriptions match your filters.'
              : 'No back-in-stock subscriptions yet.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer email</th>
                    <th>Product</th>
                    <th>Ring size</th>
                    <th>Metal color</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Sent</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((row) => {
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
                        <td>{formatOption(row.ringSize)}</td>
                        <td>{formatOption(row.metalColor)}</td>
                        <td>
                          <span className={`status-badge status-${row.status}`}>{row.status}</span>
                        </td>
                        <td>{formatDate(row.createdAt)}</td>
                        <td>{formatDate(row.sentAt)}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="btn-text"
                              onClick={() => setSelectedId(id)}
                            >
                              View
                            </button>
                            {row.status === 'pending' ? (
                              <button
                                type="button"
                                className="btn-text"
                                onClick={() => setCancelTarget(row)}
                              >
                                Cancel
                              </button>
                            ) : null}
                            {row.status !== 'cancelled' ? (
                              <button
                                type="button"
                                className="btn-text"
                                onClick={() => setResendTarget(row)}
                              >
                                Resend
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
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

            {pagination && pagination.totalPages > 1 ? (
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
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={page >= pagination.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        )}

        {selectedId ? (
          <div className="bis-drawer-overlay" role="presentation" onClick={closeDetail}>
            <aside
              className="bis-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Subscription details"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="bis-drawer-header">
                <h2>Subscription details</h2>
                <button type="button" className="bis-drawer-close" onClick={closeDetail} aria-label="Close">
                  ×
                </button>
              </div>

              {detailLoading ? (
                <div className="state-card">Loading details…</div>
              ) : detailError ? (
                <div className="alert-banner alert-error">{detailError}</div>
              ) : selected ? (
                <div className="bis-drawer-body">
                  <div className="bis-product-block">
                    {productImage(selected) ? (
                      <img
                        src={productImage(selected)}
                        alt={productTitle(selected)}
                        className="bis-product-image"
                      />
                    ) : (
                      <div className="bis-product-image bis-product-image-fallback">No image</div>
                    )}
                    <div>
                      <p className="bis-product-title">{productTitle(selected)}</p>
                      <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
                    </div>
                  </div>

                  <dl className="bis-detail-grid">
                    <div>
                      <dt>Customer email</dt>
                      <dd>{selected.email}</dd>
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
                      <dt>Created</dt>
                      <dd>{formatDate(selected.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Sent</dt>
                      <dd>{formatDate(selected.sentAt)}</dd>
                    </div>
                    <div>
                      <dt>Updated</dt>
                      <dd>{formatDate(selected.updatedAt)}</dd>
                    </div>
                  </dl>

                  <div className="bis-drawer-actions">
                    {selected.status === 'pending' ? (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setCancelTarget(selected)}
                      >
                        Cancel subscription
                      </button>
                    ) : null}
                    {selected.status !== 'cancelled' ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setResendTarget(selected)}
                      >
                        Resend notification
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => setDeleteTarget(selected)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        ) : null}

        <ConfirmModal
          open={Boolean(cancelTarget)}
          title="Cancel subscription?"
          message={
            cancelTarget
              ? `Cancel the pending notification for ${cancelTarget.email}? The record will be kept as cancelled.`
              : ''
          }
          confirmLabel="Cancel subscription"
          loadingLabel="Cancelling..."
          loading={actionLoading}
          onConfirm={handleCancelConfirm}
          onCancel={() => !actionLoading && setCancelTarget(null)}
        />

        <ConfirmModal
          open={Boolean(resendTarget)}
          title="Resend notification?"
          message={
            resendTarget
              ? `Send the back-in-stock email again to ${resendTarget.email}?`
              : ''
          }
          confirmLabel="Resend"
          loadingLabel="Sending..."
          loading={actionLoading}
          onConfirm={handleResendConfirm}
          onCancel={() => !actionLoading && setResendTarget(null)}
        />

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete subscription?"
          message={
            deleteTarget
              ? `Permanently delete the subscription for ${deleteTarget.email}? This cannot be undone.`
              : ''
          }
          confirmLabel="Delete"
          loadingLabel="Deleting..."
          loading={actionLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => !actionLoading && setDeleteTarget(null)}
        />
      </div>
    </AdminLayout>
  );
}
