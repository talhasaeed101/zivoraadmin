import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { orderApi } from '../services/api.js';
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

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    orderStatus: 'pending',
    paymentStatus: 'pending',
    notes: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadOrder = async () => {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      try {
        const response = await orderApi.getOrder(id);
        const orderData = response.data;

        if (isMounted) {
          setOrder(orderData);
          setForm({
            orderStatus: orderData.orderStatus || 'pending',
            paymentStatus: orderData.paymentStatus || 'pending',
            notes: orderData.notes || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load order');
          setOrder(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await orderApi.updateOrderStatus(id, {
        orderStatus: form.orderStatus,
        paymentStatus: form.paymentStatus,
        notes: form.notes.trim(),
      });

      const updatedOrder = response.data;
      setOrder(updatedOrder);
      setForm({
        orderStatus: updatedOrder.orderStatus || 'pending',
        paymentStatus: updatedOrder.paymentStatus || 'pending',
        notes: updatedOrder.notes || '',
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
                    <strong>{(order.paymentMethod || 'cod').toUpperCase()}</strong>
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
                            </div>
                          </div>
                        </td>
                        <td>{getVariantLabel(item)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPrice(item.price)}</td>
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
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

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
                    rows={4}
                    value={form.notes}
                    onChange={handleChange}
                    disabled={saving}
                    placeholder="Internal notes about this order..."
                  />
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
