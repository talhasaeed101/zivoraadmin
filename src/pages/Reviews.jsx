import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { reviewApi } from '../services/api.js';
import './Reviews.css';

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

const getProductLabel = (review) => {
  if (review.product && typeof review.product === 'object') {
    return review.product.title || '—';
  }

  return '—';
};

const getCustomerLabel = (review) => {
  if (review.customer && typeof review.customer === 'object') {
    return review.customer.name || review.customer.email || '—';
  }

  return '—';
};

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionReviewId, setActionReviewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    reviewApi
      .getReviews({
        search: search || undefined,
        status: statusFilter || undefined,
        rating: ratingFilter || undefined,
        page,
        limit: 10,
        sort: 'newest',
      })
      .then((response) => {
        if (isMounted) {
          setReviews(response.data?.reviews || []);
          setPagination(response.data?.pagination || null);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load reviews');
          setReviews([]);
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
  }, [search, statusFilter, ratingFilter, page, reloadKey]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusFilterChange = (event) => {
    setLoading(true);
    setPage(1);
    setStatusFilter(event.target.value);
  };

  const handleRatingFilterChange = (event) => {
    setLoading(true);
    setPage(1);
    setRatingFilter(event.target.value);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (pagination && nextPage > pagination.totalPages)) {
      return;
    }

    setLoading(true);
    setPage(nextPage);
  };

  const handleStatusUpdate = async (reviewId, status) => {
    setActionReviewId(reviewId);
    setError('');
    setSuccessMessage('');

    try {
      await reviewApi.updateReviewStatus(reviewId, { status });
      setSuccessMessage(`Review ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated'} successfully.`);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to update review status');
    } finally {
      setActionReviewId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setError('');
    setSuccessMessage('');

    try {
      await reviewApi.deleteReview(deleteTarget._id);
      setSuccessMessage('Review deleted successfully.');
      setDeleteTarget(null);
      setLoading(true);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setError(err.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout title="Reviews" label="Moderation">
      <div className="reviews-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search product, customer, or review..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              className="filter-select"
              value={ratingFilter}
              onChange={handleRatingFilterChange}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="state-card">
            {search || statusFilter || ratingFilter
              ? 'No reviews match your filters.'
              : 'No reviews yet.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer</th>
                    <th>Rating</th>
                    <th>Review Title</th>
                    <th>Status</th>
                    <th>Likes / Dislikes</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => {
                    const isBusy = actionReviewId === review._id;

                    return (
                      <tr key={review._id}>
                        <td>
                          <div className="review-product-cell">
                            {review.product?.images?.[0] && (
                              <img
                                src={review.product.images[0]}
                                alt={getProductLabel(review)}
                                className="review-product-thumb"
                              />
                            )}
                            <span>{getProductLabel(review)}</span>
                          </div>
                        </td>
                        <td>{getCustomerLabel(review)}</td>
                        <td>{review.rating}/5</td>
                        <td>{review.title || '—'}</td>
                        <td>
                          <span className={`status-badge status-badge-${review.status}`}>
                            {review.status}
                          </span>
                        </td>
                        <td>
                          {review.likes ?? 0} / {review.dislikes ?? 0}
                        </td>
                        <td>{formatDate(review.createdAt)}</td>
                        <td>
                          <div className="table-actions">
                            <Link to={`/reviews/${review._id}`} className="btn-text">
                              View
                            </Link>
                            {review.status !== 'approved' && (
                              <button
                                type="button"
                                className="btn-text"
                                disabled={isBusy}
                                onClick={() => handleStatusUpdate(review._id, 'approved')}
                              >
                                Approve
                              </button>
                            )}
                            {review.status !== 'rejected' && (
                              <button
                                type="button"
                                className="btn-text btn-text-danger"
                                disabled={isBusy}
                                onClick={() => handleStatusUpdate(review._id, 'rejected')}
                              >
                                Reject
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-text btn-text-danger"
                              disabled={isBusy}
                              onClick={() => setDeleteTarget(review)}
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

            {pagination && pagination.totalPages > 1 && (
              <div className="reviews-pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <span className="reviews-pagination-meta">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!pagination.hasNextPage}
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
          title="Delete Review"
          message={
            deleteTarget
              ? `Are you sure you want to delete the review "${deleteTarget.title || 'Untitled'}" by ${getCustomerLabel(deleteTarget)}? This action cannot be undone.`
              : ''
          }
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>
    </AdminLayout>
  );
}
