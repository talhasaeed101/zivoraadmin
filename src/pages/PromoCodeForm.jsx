import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { promoCodeApi } from '../services/api.js';
import './PromoCodes.css';

const defaultForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  usageLimit: '',
  customerUsageLimit: '',
  startDate: '',
  endDate: '',
  status: 'active',
};

const toDateInputValue = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const toOptionalNumber = (value) => {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }

  return Number(value);
};

export default function PromoCodeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const loadPromoCode = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await promoCodeApi.getPromoCode(id);
        const promo = response.data;

        setForm({
          code: promo.code || '',
          description: promo.description || '',
          discountType: promo.discountType || 'percentage',
          discountValue: promo.discountValue ?? '',
          minOrderAmount: promo.minOrderAmount ?? '',
          maxDiscountAmount: promo.maxDiscountAmount ?? '',
          usageLimit: promo.usageLimit ?? '',
          customerUsageLimit: promo.customerUsageLimit ?? '',
          startDate: toDateInputValue(promo.startDate),
          endDate: toDateInputValue(promo.endDate),
          status: promo.status || 'active',
        });
      } catch (err) {
        setError(err.message || 'Failed to load promo code');
      } finally {
        setLoading(false);
      }
    };

    loadPromoCode();
  }, [id, isEditing]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === 'code' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: toOptionalNumber(form.minOrderAmount),
      maxDiscountAmount: toOptionalNumber(form.maxDiscountAmount),
      usageLimit: toOptionalNumber(form.usageLimit),
      customerUsageLimit: toOptionalNumber(form.customerUsageLimit),
      startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      status: form.status,
    };

    try {
      if (isEditing) {
        await promoCodeApi.updatePromoCode(id, payload);
      } else {
        await promoCodeApi.createPromoCode(payload);
      }

      navigate('/promo-codes', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to save promo code');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title={isEditing ? 'Edit Promo Code' : 'Add Promo Code'} label="Marketing">
        <div className="state-card">Loading promo code...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEditing ? 'Edit Promo Code' : 'Add Promo Code'} label="Marketing">
      <div className="promo-codes-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <form className="admin-form-card" onSubmit={handleSubmit}>
          <div className="admin-form-grid">
            <div className="admin-form-field">
              <label htmlFor="code">Code *</label>
              <input
                id="code"
                name="code"
                type="text"
                value={form.code}
                onChange={handleChange}
                required
                disabled={saving}
                placeholder="ZIVORA10"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                disabled={saving}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="admin-form-field admin-form-field-full">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                disabled={saving}
                rows={3}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="discountType">Discount Type *</label>
              <select
                id="discountType"
                name="discountType"
                value={form.discountType}
                onChange={handleChange}
                disabled={saving}
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div className="admin-form-field">
              <label htmlFor="discountValue">Discount Value *</label>
              <input
                id="discountValue"
                name="discountValue"
                type="number"
                min="0"
                step="0.01"
                value={form.discountValue}
                onChange={handleChange}
                required
                disabled={saving}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="minOrderAmount">Min Order Amount</label>
              <input
                id="minOrderAmount"
                name="minOrderAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.minOrderAmount}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="maxDiscountAmount">Max Discount Amount</label>
              <input
                id="maxDiscountAmount"
                name="maxDiscountAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.maxDiscountAmount}
                onChange={handleChange}
                disabled={saving}
                placeholder="For percentage discounts"
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="usageLimit">Usage Limit</label>
              <input
                id="usageLimit"
                name="usageLimit"
                type="number"
                min="0"
                step="1"
                value={form.usageLimit}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="customerUsageLimit">Customer Usage Limit</label>
              <input
                id="customerUsageLimit"
                name="customerUsageLimit"
                type="number"
                min="0"
                step="1"
                value={form.customerUsageLimit}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="startDate">Start Date</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={form.startDate}
                onChange={handleChange}
                disabled={saving}
              />
            </div>

            <div className="admin-form-field">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={form.endDate}
                onChange={handleChange}
                disabled={saving}
              />
            </div>
          </div>

          <div className="admin-form-actions">
            <Link to="/promo-codes" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isEditing ? 'Update Promo Code' : 'Create Promo Code'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
