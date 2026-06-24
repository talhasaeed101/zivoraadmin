import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const renderStars = (rating) => {
  const value = Math.max(0, Math.min(5, Math.round(rating || 0)));
  return '★'.repeat(value) + '☆'.repeat(5 - value);
};

export default function ReviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    let isMounted = true;

    const loadReview = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const response = await reviewApi.getReview(id);
        const reviewData = response.data;

        if (isMounted) {
          setReview(reviewData);
          setStatus(reviewData.status || 'pending');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load review');
          setReview(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSaveStatus = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await reviewApi.updateReviewStatus(id, { status });
      setReview(response.data);
      setStatus(response.data.status || status);
      setSuccessMessage('Review status updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update review status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');

    try {
      await reviewApi.deleteReview(id);
      navigate('/reviews', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to delete review');
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const product = review?.product && typeof review.product === 'object' ? review.product : null;
  const customer = review?.customer && typeof review.customer === 'object' ? review.customer : null;

  return (
    <AdminLayout title="Review Details" label="Moderation">
      <div className="reviews-page">
        <div className="review-detail-toolbar">
          <Link to="/reviews" className="btn-text">
            Back to Reviews
          </Link>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading review details...</div>
        ) : !review ? (
          <div className="state-card">Review not found.</div>
        ) : (
          <>
            <div className="review-detail-grid">
              <section className="review-detail-card">
                <h3 className="review-detail-heading">Product</h3>
                <div className="review-product-detail">
                  {product?.images?.[0] && (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="review-detail-product-image"
                    />
                  )}
                  <div>
                    <strong>{product?.title || '—'}</strong>
                    {product?.slug && <span className="review-detail-slug">{product.slug}</span>}
                  </div>
                </div>
              </section>

              <section className="review-detail-card">
                <h3 className="review-detail-heading">Customer</h3>
                <div className="review-detail-meta">
                  <div>
                    <span className="review-detail-label">Name</span>
                    <strong>{customer?.name || '—'}</strong>
                  </div>
                  <div>
                    <span className="review-detail-label">Email</span>
                    <strong>{customer?.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="review-detail-label">Submitted</span>
                    <strong>{formatDate(review.createdAt)}</strong>
                  </div>
                </div>
              </section>

              <section className="review-detail-card review-detail-card-full">
                <h3 className="review-detail-heading">Review Content</h3>
                <div className="review-detail-content">
                  <div className="review-detail-rating-row">
                    <span className="review-detail-label">Overall Rating</span>
                    <strong className="review-stars">{renderStars(review.rating)}</strong>
                    <span className="review-rating-value">{review.rating}/5</span>
                  </div>
                  {review.title && <h4 className="review-detail-title">{review.title}</h4>}
                  <p className="review-detail-comment">{review.comment || 'No comment provided.'}</p>
                  <div className="review-detail-subratings">
                    <div>
                      <span className="review-detail-label">Sizing Rating</span>
                      <strong>{review.sizingRating ? `${review.sizingRating}/5` : '—'}</strong>
                    </div>
                    <div>
                      <span className="review-detail-label">Quality Rating</span>
                      <strong>{review.qualityRating ? `${review.qualityRating}/5` : '—'}</strong>
                    </div>
                    <div>
                      <span className="review-detail-label">Likes / Dislikes</span>
                      <strong>
                        {review.likes ?? 0} / {review.dislikes ?? 0}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <form className="admin-form-card review-status-form" onSubmit={handleSaveStatus}>
              <h3 className="review-detail-heading">Moderation</h3>

              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label htmlFor="reviewStatus">Status</label>
                  <select
                    id="reviewStatus"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                    disabled={saving}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Status'}
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setDeleteOpen(true)}
                  disabled={saving || deleting}
                >
                  Delete Review
                </button>
              </div>
            </form>
          </>
        )}

        <ConfirmModal
          open={deleteOpen}
          title="Delete Review"
          message={
            review
              ? `Are you sure you want to delete the review "${review.title || 'Untitled'}"? This action cannot be undone.`
              : ''
          }
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      </div>
    </AdminLayout>
  );
}
