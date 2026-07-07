import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { customerApi } from '../services/api.js';
import './Orders.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(
    value || 0
  );

export default function CustomerDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    customerApi
      .getCustomer(id)
      .then((response) => setData(response.data))
      .catch((err) => setError(err.message || 'Failed to load customer'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status) => {
    await customerApi.updateStatus(id, status);
    const response = await customerApi.getCustomer(id);
    setData(response.data);
  };

  if (loading) {
    return (
      <AdminLayout title="Customer Details" label="Store">
        <div className="state-card">Loading...</div>
      </AdminLayout>
    );
  }

  if (error || !data?.customer) {
    return (
      <AdminLayout title="Customer Details" label="Store">
        <div className="alert-banner alert-error">{error || 'Customer not found'}</div>
      </AdminLayout>
    );
  }

  const { customer, orders } = data;

  return (
    <AdminLayout title={customer.name} label="Customer">
      <div className="products-page">
        <div className="admin-form-card">
          <p><strong>Email:</strong> {customer.email}</p>
          <p><strong>Phone:</strong> {customer.phone || '—'}</p>
          <p><strong>Status:</strong> {customer.status}</p>
          <div className="admin-form-actions">
            <button type="button" className="btn-secondary" onClick={() => handleStatusChange('active')}>Activate</button>
            <button type="button" className="btn-secondary" onClick={() => handleStatusChange('blocked')}>Block</button>
            <Link to="/customers" className="btn-text">Back</Link>
          </div>
        </div>

        <h3 className="section-title">Recent Orders</h3>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders || []).map((order) => (
                <tr key={order._id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatPrice(order.total)}</td>
                  <td>{order.orderStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
