import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { promoCodeApi } from '../services/api.js';
import './PromoCodes.css';

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const formatDiscount = (promo) => {
  if (promo.discountType === 'percentage') {
    return `${promo.discountValue}%`;
  }

  return `Rs. ${Number(promo.discountValue).toLocaleString('en-IN')}`;
};

const formatUsage = (promo) => {
  const used = promo.usedCount ?? 0;

  if (promo.usageLimit === undefined || promo.usageLimit === null) {
    return `${used} / ∞`;
  }

  return `${used} / ${promo.usageLimit}`;
};

export default function PromoCodes() {
  const [promoCodes, setPromoCodes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    promoCodeApi
      .getPromoCodes({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      })
      .then((response) => {
        if (isMounted) {
          setPromoCodes(response.data?.promoCodes || []);
          setPagination(response.data?.pagination || null);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load promo codes');
          setPromoCodes([]);
          setPagination(null);
        }
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

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (event) => {
    setLoading(true);
    setPage(1);
    setStatusFilter(event.target.value);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (pagination && nextPage > pagination.totalPages)) {
      return;
    }

    setLoading(true);
    setPage(nextPage);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await promoCodeApi.deletePromoCode(deleteTarget._id);
      setSuccessMessage(`Promo code "${deleteTarget.code}" deleted successfully.`);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete promo code');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Promo Codes" label="Marketing">
      <div className="promo-codes-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search by code..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusChange}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>

          <Link to="/promo-codes/new" className="btn-primary">
            Add Promo Code
          </Link>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading promo codes...</div>
        ) : promoCodes.length === 0 ? (
          <div className="state-card">
            {search || statusFilter
              ? 'No promo codes match your filters.'
              : 'No promo codes yet. Create your first promo code to get started.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCodes.map((promo) => (
                    <tr key={promo._id}>
                      <td>
                        <div className="promo-code-cell">
                          <strong>{promo.code}</strong>
                          {promo.description && (
                            <span className="promo-code-description">{promo.description}</span>
                          )}
                        </div>
                      </td>
                      <td>{formatDiscount(promo)}</td>
                      <td>{formatUsage(promo)}</td>
                      <td>{formatDate(promo.startDate)}</td>
                      <td>{formatDate(promo.endDate)}</td>
                      <td>
                        <span className={`status-badge status-${promo.status}`}>
                          {promo.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/promo-codes/${promo._id}/edit`} className="btn-text">
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="btn-text btn-text-danger"
                            onClick={() => setDeleteTarget(promo)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
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
            )}
          </>
        )}

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete promo code"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.code}"? This action cannot be undone.`
              : ''
          }
          confirmLabel={deleting ? 'Deleting...' : 'Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      </div>
    </AdminLayout>
  );
}
