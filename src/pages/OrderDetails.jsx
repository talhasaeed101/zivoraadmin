import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { orderApi } from '../services/api.js';
import { buildCustomizationSummaryLines } from '../utils/customizationSummary.js';
import { ORDER_STATUS, ORDER_STATUS_LABELS, getAvailableNextStatuses } from '../constants/orderConstants.js';
import {
  SHIPPING_BOOKING_STATUS,
  SHIPPING_BOOKING_STATUS_OPTIONS,
  SHIPPING_COURIER,
  SHIPPING_COURIER_OPTIONS,
  SHIPPING_SHIPMENT_STATUS_LABELS,
  SHIPPING_SHIPMENT_STATUS_OPTIONS,
  POSTEX_TRACKING_URL,
  getShippingFormDefaults,
} from '../constants/shippingConstants.js';
import { useSocket } from '../context/SocketContext.jsx';
import './Orders.css';

const formatPrice = (value) => {
  if (value === undefined || value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
};

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

const getVariantLabel = (item) => {
  const parts = [item.ringSize, item.metalColor].filter(Boolean);
  return parts.length > 0 ? parts.join(' / ') : '—';
};

const formatPaymentMethod = (method) => {
  switch (method) {
    case 'cod':
      return 'Cash on Delivery';
    case 'bank_transfer':
      return 'Bank Transfer (UBL)';
    case 'online':
      return 'Online Payment';
    default:
      return method || '—';
  }
};

export default function OrderDetails() {
  const { id } = useParams();
  const { onOrderUpdated } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [form, setForm] = useState({
    orderStatus: 'pending',
    paymentStatus: 'pending',
    notes: '',
    isCustomerVisible: false,
    trackingNumber: '',
    courierName: '',
    trackingUrl: '',
    estimatedDeliveryDate: '',
  });
  const [shippingForm, setShippingForm] = useState(getShippingFormDefaults(null));
  const [shippingSaving, setShippingSaving] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [shippingSuccess, setShippingSuccess] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');

  const loadOrder = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await orderApi.getOrder(id);
      const orderData = response.data;

      setOrder(orderData);
      setForm({
        orderStatus: orderData.orderStatus || 'pending',
        paymentStatus: orderData.paymentStatus || 'pending',
        notes: '',
        isCustomerVisible: false,
        trackingNumber: orderData.trackingNumber || '',
        courierName: orderData.courierName || '',
        trackingUrl: orderData.trackingUrl || '',
        estimatedDeliveryDate: orderData.estimatedDeliveryDate ? new Date(orderData.estimatedDeliveryDate).toISOString().split('T')[0] : '',
      });
      setShippingForm(getShippingFormDefaults(orderData));
      setShippingError('');
      setShippingSuccess('');
    } catch (err) {
      setError(err.message || 'Failed to load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrder();

    // Listen for socket order updates
    const unsubscribe = onOrderUpdated((updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
        setForm(prev => ({
          ...prev,
          orderStatus: updatedOrder.orderStatus,
          paymentStatus: updatedOrder.paymentStatus,
        }));
      }
    });

    return unsubscribe;
  }, [id, loadOrder, onOrderUpdated]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (name === 'orderStatus' && value === ORDER_STATUS.CANCELLED && order?.orderStatus !== ORDER_STATUS.CANCELLED) {
      setPendingStatusChange(value);
      setConfirmModalOpen(true);
    } else {
      setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleConfirmCancel = () => {
    if (pendingStatusChange) {
      setForm(prev => ({ ...prev, orderStatus: pendingStatusChange }));
      setPendingStatusChange(null);
      setConfirmModalOpen(false);
    }
  };

  const handleCancelConfirm = () => {
    setPendingStatusChange(null);
    setConfirmModalOpen(false);
  };

  const handleShippingChange = (event) => {
    const { name, value } = event.target;

    setShippingForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === 'courier' && value === SHIPPING_COURIER.POSTEX) {
        next.courierName = 'PostEx';
        if (!prev.trackingUrl || prev.trackingUrl === '' || prev.courier === SHIPPING_COURIER.OTHER) {
          next.trackingUrl = POSTEX_TRACKING_URL;
        }
      }

      if (name === 'courier' && value === SHIPPING_COURIER.OTHER && prev.trackingUrl === POSTEX_TRACKING_URL) {
        next.trackingUrl = '';
        next.courierName = '';
      }

      if (name === 'bookingStatus' && value === SHIPPING_BOOKING_STATUS.BOOKED && !prev.shipmentStatus) {
        next.shipmentStatus = 'BOOKED';
      }

      return next;
    });
  };

  const handleCopyTrackingId = async () => {
    const trackingId = shippingForm.trackingId || order?.shipping?.trackingId || order?.trackingNumber;
    if (!trackingId) return;

    try {
      await navigator.clipboard.writeText(trackingId);
      setCopyFeedback('Tracking ID copied');
      setTimeout(() => setCopyFeedback(''), 2000);
    } catch {
      setCopyFeedback('Unable to copy');
      setTimeout(() => setCopyFeedback(''), 2000);
    }
  };

  const handleSaveShipping = async (event) => {
    event.preventDefault();
    if (shippingSaving) return;

    setShippingSaving(true);
    setShippingError('');
    setShippingSuccess('');

    try {
      const payload = {
        courier: shippingForm.courier,
        courierName:
          shippingForm.courier === SHIPPING_COURIER.POSTEX
            ? shippingForm.courierName.trim() || 'PostEx'
            : shippingForm.courierName.trim(),
        trackingId: shippingForm.trackingId.trim(),
        trackingUrl: shippingForm.trackingUrl.trim(),
        bookingStatus: shippingForm.bookingStatus,
        shipmentStatus: shippingForm.shipmentStatus,
        internalNote: shippingForm.internalNote.trim() || null,
      };

      const response = await orderApi.updateOrderShipping(id, payload);
      const updatedOrder = response.data;
      setOrder(updatedOrder);
      setShippingForm(getShippingFormDefaults(updatedOrder));
      setForm((prev) => ({
        ...prev,
        trackingNumber: updatedOrder.trackingNumber || updatedOrder.shipping?.trackingId || prev.trackingNumber,
        courierName: updatedOrder.courierName || updatedOrder.shipping?.courierName || prev.courierName,
        trackingUrl: updatedOrder.trackingUrl || updatedOrder.shipping?.trackingUrl || prev.trackingUrl,
      }));
      setShippingSuccess('Shipment details saved successfully.');
    } catch (err) {
      setShippingError(err.message || 'Failed to save shipment details');
    } finally {
      setShippingSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const payload = {
        paymentStatus: form.paymentStatus,
        notes: form.notes.trim() || undefined,
      };

      if (form.orderStatus !== order.orderStatus) {
        payload.orderStatus = form.orderStatus;
        payload.isCustomerVisible = form.isCustomerVisible;
        
        if (form.orderStatus === ORDER_STATUS.SHIPPED) {
          payload.trackingNumber = form.trackingNumber;
          payload.courierName = form.courierName;
          payload.trackingUrl = form.trackingUrl;
          payload.estimatedDeliveryDate = form.estimatedDeliveryDate;
        }
      }

      // Always send shipping fields if order is already shipped or delivered
      if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order.orderStatus)) {
        payload.trackingNumber = form.trackingNumber;
        payload.courierName = form.courierName;
        payload.trackingUrl = form.trackingUrl;
        payload.estimatedDeliveryDate = form.estimatedDeliveryDate;
      }

      const response = await orderApi.updateOrderStatus(id, payload);

      const updatedOrder = response.data;
      setOrder(updatedOrder);
      setForm({
        orderStatus: updatedOrder.orderStatus || 'pending',
        paymentStatus: updatedOrder.paymentStatus || 'pending',
        notes: '',
        isCustomerVisible: false,
        trackingNumber: updatedOrder.trackingNumber || '',
        courierName: updatedOrder.courierName || '',
        trackingUrl: updatedOrder.trackingUrl || '',
        estimatedDeliveryDate: updatedOrder.estimatedDeliveryDate ? new Date(updatedOrder.estimatedDeliveryDate).toISOString().split('T')[0] : '',
      });
      setSuccessMessage('Order updated successfully.');
    } catch (err) {
      setError(err.message || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const customer =
    order?.customer && typeof order.customer === 'object' ? order.customer : null;
  const deliveryAddress = order?.deliveryAddress;

  return (
    <AdminLayout title="Order Details" label="Sales">
      <ConfirmModal
        open={confirmModalOpen}
        title="Cancel Order"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Cancel Order"
        loading={saving}
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelConfirm}
      />
      <div className="orders-page">
        <div className="order-detail-toolbar">
          <Link to="/orders" className="btn-text">
            Back to Orders
          </Link>
        </div>

        {successMessage && (
          <div className="alert-banner alert-success">{successMessage}</div>
        )}

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading order details...</div>
        ) : !order ? (
          <div className="state-card">Order not found.</div>
        ) : (
          <>
            <div className="order-detail-grid">
              <section className="order-detail-card">
                <h3 className="order-detail-heading">Order Summary</h3>
                <div className="order-detail-meta">
                  <div>
                    <span className="order-detail-label">Order Number</span>
                    <strong>{order.orderNumber}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Placed On</span>
                    <strong>{formatDate(order.createdAt)}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Payment Method</span>
                    <strong>{formatPaymentMethod(order.paymentMethod)}</strong>
                  </div>
                </div>
              </section>

              <section className="order-detail-card">
                <h3 className="order-detail-heading">Customer</h3>
                <div className="order-detail-meta">
                  <div>
                    <span className="order-detail-label">Name</span>
                    <strong>{customer?.name || deliveryAddress?.name || '—'}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Email</span>
                    <strong>{customer?.email || deliveryAddress?.email || '—'}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Phone</span>
                    <strong>{customer?.phone || deliveryAddress?.phone || '—'}</strong>
                  </div>
                </div>
              </section>

              <section className="order-detail-card order-detail-card-full">
                <h3 className="order-detail-heading">Delivery Address</h3>
                {deliveryAddress ? (
                  <div className="order-address-block">
                    <p>{deliveryAddress.name}</p>
                    <p>{deliveryAddress.address}</p>
                    <p>
                      {deliveryAddress.city}, {deliveryAddress.province}{' '}
                      {deliveryAddress.postalCode}
                    </p>
                    <p>{deliveryAddress.phone}</p>
                    <p>{deliveryAddress.email}</p>
                  </div>
                ) : (
                  <p className="order-empty-text">No delivery address on file.</p>
                )}
              </section>
            </div>

            <section className="order-detail-card order-items-card">
              <h3 className="order-detail-heading">Items</h3>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Size / Color</th>
                      <th>Quantity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, index) => (
                      <tr key={`${item.product}-${index}`}>
                        <td>
                          <div className="order-item-cell">
                            {item.image && (
                              <img src={item.image} alt={item.title} className="order-item-thumb" />
                            )}
                            <div>
                              <strong>{item.title}</strong>
                              {item.sku && <span className="order-item-sku">{item.sku}</span>}
                              {item.isCustomized && (
                                <ul className="order-customization-list">
                                  {buildCustomizationSummaryLines(
                                    item.customization,
                                    item.product?.customizationOptions
                                  ).map((line) => (
                                    <li key={`${line.label}-${line.value}`}>
                                      <strong>{line.label}:</strong> {line.value}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>{getVariantLabel(item)}</div>
                          {item.extraPrice > 0 && (
                            <span className="order-item-extra">+{formatPrice(item.extraPrice)} extras</span>
                          )}
                        </td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-totals">
                <div className="order-total-row">
                  <span>Subtotal</span>
                  <strong>{formatPrice(order.subtotal)}</strong>
                </div>
                <div className="order-total-row">
                  <span>Discount</span>
                  <strong>{formatPrice(order.discount)}</strong>
                </div>
                <div className="order-total-row">
                  <span>Tax / Fee</span>
                  <strong>{formatPrice(order.taxFee)}</strong>
                </div>
                <div className="order-total-row order-total-row-final">
                  <span>Total</span>
                  <strong>{formatPrice(order.total)}</strong>
                </div>
              </div>
            </section>

            {order.statusHistory && order.statusHistory.length > 0 && (
              <section className="order-detail-card order-detail-card-full">
                <h3 className="order-detail-heading">Status History</h3>
                <div className="status-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {order.statusHistory.map((entry, idx) => (
                    <div key={idx} className="timeline-item" style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', background: '#f9fafb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#111827' }}>{entry.label}</strong>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{formatDate(entry.changedAt)}</span>
                      </div>
                      <div style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Updated by: {entry.changedBy}</div>
                      {entry.note && (
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fff', borderLeft: '4px solid #967259', color: '#374151' }}>
                          {entry.note}
                          {entry.isCustomerVisible && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#059669', background: '#d1fae5', padding: '0.125rem 0.375rem', borderRadius: '9999px' }}>Customer Visible</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="order-detail-card order-detail-card-full shipping-tracking-card">
              <h3 className="order-detail-heading">Shipping & Tracking</h3>

              {(order.shipping?.trackingId || order.shipping?.shipmentStatus) && (
                <div className="shipping-summary-grid">
                  <div>
                    <span className="order-detail-label">Courier</span>
                    <strong>
                      {order.shipping?.courierName ||
                        (order.shipping?.courier === 'POSTEX' ? 'PostEx' : order.courierName) ||
                        '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Tracking ID</span>
                    <strong>{order.shipping?.trackingId || order.trackingNumber || '—'}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Booking Status</span>
                    <strong>{order.shipping?.bookingStatus || '—'}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Shipment Status</span>
                    <strong>
                      {SHIPPING_SHIPMENT_STATUS_LABELS[order.shipping?.shipmentStatus] ||
                        order.shipping?.shipmentStatus ||
                        '—'}
                    </strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Booked</span>
                    <strong>{formatDate(order.shipping?.bookedAt)}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Delivered</span>
                    <strong>{formatDate(order.shipping?.deliveredAt)}</strong>
                  </div>
                  <div>
                    <span className="order-detail-label">Last Updated</span>
                    <strong>{formatDate(order.shipping?.lastUpdatedAt)}</strong>
                  </div>
                </div>
              )}

              <div className="shipping-action-row">
                {(shippingForm.trackingId || order.shipping?.trackingId || order.trackingNumber) && (
                  <button type="button" className="btn-secondary" onClick={handleCopyTrackingId}>
                    Copy Tracking ID
                  </button>
                )}
                {(shippingForm.trackingUrl || order.shipping?.trackingUrl || order.trackingUrl) && (
                  <a
                    className="btn-secondary"
                    href={shippingForm.trackingUrl || order.shipping?.trackingUrl || order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Tracking Page
                  </a>
                )}
                {copyFeedback && <span className="shipping-copy-feedback">{copyFeedback}</span>}
              </div>

              {shippingSuccess && <div className="alert-banner alert-success">{shippingSuccess}</div>}
              {shippingError && <div className="alert-banner alert-error">{shippingError}</div>}

              <form className="shipping-form" onSubmit={handleSaveShipping}>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label htmlFor="shippingCourier">Courier</label>
                    <select
                      id="shippingCourier"
                      name="courier"
                      value={shippingForm.courier}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                    >
                      {SHIPPING_COURIER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {shippingForm.courier === SHIPPING_COURIER.OTHER && (
                    <div className="admin-form-field">
                      <label htmlFor="shippingCourierName">Courier Name</label>
                      <input
                        id="shippingCourierName"
                        name="courierName"
                        type="text"
                        value={shippingForm.courierName}
                        onChange={handleShippingChange}
                        disabled={shippingSaving}
                        maxLength={100}
                        required
                        placeholder="e.g. TCS"
                      />
                    </div>
                  )}

                  <div className="admin-form-field">
                    <label htmlFor="shippingTrackingId">Tracking ID</label>
                    <input
                      id="shippingTrackingId"
                      name="trackingId"
                      type="text"
                      value={shippingForm.trackingId}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                      maxLength={100}
                      placeholder="Paste PostEx tracking ID"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="shippingTrackingUrl">Tracking URL</label>
                    <input
                      id="shippingTrackingUrl"
                      name="trackingUrl"
                      type="url"
                      value={shippingForm.trackingUrl}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                      placeholder="https://postex.pk/tracking"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="shippingBookingStatus">Booking Status</label>
                    <select
                      id="shippingBookingStatus"
                      name="bookingStatus"
                      value={shippingForm.bookingStatus}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                    >
                      {SHIPPING_BOOKING_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="shippingShipmentStatus">Shipment Status</label>
                    <select
                      id="shippingShipmentStatus"
                      name="shipmentStatus"
                      value={shippingForm.shipmentStatus}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                    >
                      {SHIPPING_SHIPMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field admin-form-field-full">
                    <label htmlFor="shippingInternalNote">Internal Shipping Note</label>
                    <textarea
                      id="shippingInternalNote"
                      name="internalNote"
                      rows={3}
                      value={shippingForm.internalNote}
                      onChange={handleShippingChange}
                      disabled={shippingSaving}
                      maxLength={500}
                      placeholder="Booked from PostEx merchant portal..."
                    />
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="submit" className="btn-primary" disabled={shippingSaving}>
                    {shippingSaving ? 'Saving...' : 'Save Shipment'}
                  </button>
                </div>
              </form>

              {Array.isArray(order.shippingHistory) && order.shippingHistory.length > 0 && (
                <div className="shipment-timeline">
                  <h4 className="shipment-timeline-title">Shipment Timeline</h4>
                  {[...order.shippingHistory].reverse().map((entry, index) => (
                    <div key={`${entry.status}-${entry.changedAt}-${index}`} className="shipment-timeline-item">
                      <strong>
                        {SHIPPING_SHIPMENT_STATUS_LABELS[entry.status] || entry.status}
                      </strong>
                      <span>{formatDate(entry.changedAt)}</span>
                      {entry.note && <p>{entry.note}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <form className="admin-form-card order-status-form" onSubmit={handleSubmit}>
              <h3 className="order-detail-heading">Update Order</h3>

              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label htmlFor="orderStatus">Order Status</label>
                  <select
                    id="orderStatus"
                    name="orderStatus"
                    value={form.orderStatus}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value={order.orderStatus}>{ORDER_STATUS_LABELS[order.orderStatus]} (Current)</option>
                    {getAvailableNextStatuses(order.orderStatus).map((status) => (
                      <option key={status} value={status}>
                        {ORDER_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>

                {(form.orderStatus === ORDER_STATUS.SHIPPED || [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order?.orderStatus)) && (
                  <>
                    <div className="admin-form-field">
                      <label htmlFor="courierName">Courier Name *</label>
                      <input
                        id="courierName"
                        name="courierName"
                        type="text"
                        value={form.courierName}
                        onChange={handleChange}
                        disabled={saving}
                        required={form.orderStatus === ORDER_STATUS.SHIPPED}
                        placeholder="e.g. TCS, Leopard"
                      />
                    </div>
                    <div className="admin-form-field">
                      <label htmlFor="trackingNumber">Tracking Number *</label>
                      <input
                        id="trackingNumber"
                        name="trackingNumber"
                        type="text"
                        value={form.trackingNumber}
                        onChange={handleChange}
                        disabled={saving}
                        required={form.orderStatus === ORDER_STATUS.SHIPPED}
                      />
                    </div>
                    <div className="admin-form-field">
                      <label htmlFor="trackingUrl">Tracking URL</label>
                      <input
                        id="trackingUrl"
                        name="trackingUrl"
                        type="url"
                        value={form.trackingUrl}
                        onChange={handleChange}
                        disabled={saving}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="admin-form-field">
                      <label htmlFor="estimatedDeliveryDate">Estimated Delivery</label>
                      <input
                        id="estimatedDeliveryDate"
                        name="estimatedDeliveryDate"
                        type="date"
                        value={form.estimatedDeliveryDate}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </>
                )}

                <div className="admin-form-field">
                  <label htmlFor="paymentStatus">Payment Status</label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={form.paymentStatus}
                    onChange={handleChange}
                    disabled={saving}
                  >
                    <option value="pending">Pending</option>
                    <option value="Pending Payment Verification">Pending Payment Verification</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="admin-form-field admin-form-field-full">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={form.notes}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Add a note for this update..."
                  />
                  {form.orderStatus !== order.orderStatus && (
                    <label className="mt-2" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="isCustomerVisible"
                        checked={form.isCustomerVisible}
                        onChange={handleChange}
                        disabled={saving}
                      />
                      <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Make note visible to customer</span>
                    </label>
                  )}
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
