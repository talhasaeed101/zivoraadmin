import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { orderApi } from '../services/api.js';
import { ORDER_STATUS_LABELS } from '../constants/orderConstants.js';
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

const getCustomerLabel = (order) => {
  if (order.customer && typeof order.customer === 'object') {
    return order.customer.name || order.customer.email || '—';
  }

  return order.deliveryAddress?.name || '—';
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    orderApi
      .getOrders({
        search: search || undefined,
        orderStatus: orderStatusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        page,
        limit: 10,
        sort: 'newest',
      })
      .then((response) => {
        if (isMounted) {
          setOrders(response.data?.orders || []);
          setPagination(response.data?.pagination || null);
          setError('');
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load orders');
          setOrders([]);
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
  }, [search, orderStatusFilter, paymentStatusFilter, page]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleOrderStatusChange = (event) => {
    setLoading(true);
    setPage(1);
    setOrderStatusFilter(event.target.value);
  };

  const handlePaymentStatusChange = (event) => {
    setLoading(true);
    setPage(1);
    setPaymentStatusFilter(event.target.value);
  };

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || (pagination && nextPage > pagination.totalPages)) {
      return;
    }

    setLoading(true);
    setPage(nextPage);
  };

  return (
    <AdminLayout title="Orders" label="Sales">
      <div className="orders-page">
        <div className="page-toolbar">
          <form className="page-toolbar-left" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              className="search-input"
              placeholder="Search order number or customer..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="filter-select"
              value={orderStatusFilter}
              onChange={handleOrderStatusChange}
            >
              <option value="">All Order Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className="filter-select"
              value={paymentStatusFilter}
              onChange={handlePaymentStatusChange}
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="Pending Payment Verification">Pending Verification</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="Rejected">Rejected</option>
            </select>
            <button type="submit" className="btn-secondary">
              Apply
            </button>
          </form>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        {loading ? (
          <div className="state-card">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="state-card">
            {search || orderStatusFilter || paymentStatusFilter
              ? 'No orders match your filters.'
              : 'No orders yet. Customer orders will appear here after checkout.'}
          </div>
        ) : (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Number</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Items</th>
                    <th>Payment Status</th>
                    <th>Order Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <strong className="order-number">{order.orderNumber}</strong>
                      </td>
                      <td>{getCustomerLabel(order)}</td>
                      <td>{formatPrice(order.total)}</td>
                      <td>{order.totalItems ?? order.items?.length ?? 0}</td>
                      <td>
                        <span className={`status-badge status-badge-${(order.paymentStatus || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge status-badge-${order.orderStatus}`}>
                          {ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus}
                        </span>
                      </td>
                      <td>{formatDate(order.statusHistory?.[order.statusHistory.length - 1]?.changedAt || order.updatedAt)}</td>
                      <td>
                        <Link to={`/orders/${order._id}`} className="btn-text">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="orders-pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <span className="orders-pagination-meta">
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
      </div>
    </AdminLayout>
  );
}
