import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { campaignApi } from '../services/api.js';
import './Campaigns.css';

const formatDateTime = (value, timeZone) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timeZone || 'UTC',
    timeZoneName: 'short',
  }).format(new Date(value));
};

const formatDiscount = (campaign) => {
  if (campaign.discountType === 'percentage') {
    return `${campaign.discountValue}%`;
  }

  return `Rs. ${Number(campaign.discountValue || 0).toLocaleString('en-IN')}`;
};

const formatTarget = (campaign) => {
  switch (campaign.targetType) {
    case 'products':
      return `Products (${campaign.targetProductIds?.length || 0})`;
    case 'categories':
      return `Categories (${campaign.targetCategoryIds?.length || 0})`;
    case 'variants':
      return `Variants (${campaign.targetVariantIds?.length || 0})`;
    default:
      return 'All products';
  }
};

const statusLabel = (campaign) => campaign.effectiveStatus || campaign.status || 'draft';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
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

    campaignApi
      .getCampaigns({
        search: search || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10,
      })
      .then((response) => {
        if (isMounted) {
          setCampaigns(response.data?.campaigns || []);
          setPagination(response.data?.pagination || null);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load campaigns');
          setCampaigns([]);
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
      await campaignApi.deleteCampaign(deleteTarget._id);
      setSuccessMessage(`Campaign "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Campaigns" label="Marketing">
      <div className="campaigns-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select className="filter-select" value={statusFilter} onChange={handleStatusChange}>
              <option value="">All Stored Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="ended">Ended</option>
              <option value="archived">Archived</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>

          <Link to="/campaigns/new" className="btn-primary">
            Add Campaign
          </Link>
        </div>

        {successMessage && <div className="alert-banner alert-success">{successMessage}</div>}
        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="state-card">
            {search || statusFilter
              ? 'No campaigns match your filters.'
              : 'No campaigns yet. Create your first campaign to get started.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campaign</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Discount</th>
                    <th>Target</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const effective = statusLabel(campaign);
                    return (
                      <tr key={campaign._id}>
                        <td>
                          <div className="campaign-cell">
                            <strong>{campaign.name}</strong>
                            {campaign.description ? (
                              <span className="campaign-description">{campaign.description}</span>
                            ) : null}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge status-campaign-${effective}`}>
                            {effective}
                          </span>
                          {campaign.status !== effective ? (
                            <div className="campaign-stored-status">stored: {campaign.status}</div>
                          ) : null}
                        </td>
                        <td>{formatDateTime(campaign.startAt, campaign.timezone)}</td>
                        <td>{formatDateTime(campaign.endAt, campaign.timezone)}</td>
                        <td>{formatDiscount(campaign)}</td>
                        <td>{formatTarget(campaign)}</td>
                        <td>{formatDateTime(campaign.createdAt, 'UTC')}</td>
                        <td>
                          <div className="table-actions">
                            <Link to={`/campaigns/${campaign._id}/edit`} className="btn-text">
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
                              onClick={() => setDeleteTarget(campaign)}
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

        <ConfirmModal
          open={Boolean(deleteTarget)}
          title="Delete campaign?"
          message={
            deleteTarget
              ? `Delete "${deleteTarget.name}"? This cannot be undone. Prefer Archive if you need history.`
              : ''
          }
          confirmLabel="Delete"
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      </div>
    </AdminLayout>
  );
}
