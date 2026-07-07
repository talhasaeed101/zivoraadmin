import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout.jsx';
import { customerApi } from '../services/api.js';
import './Orders.css';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(
    value || 0
  );

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    customerApi
      .getCustomers({ search: search || undefined, limit: 50 })
      .then((response) => {
        setCustomers(response.data?.customers || []);
        setError('');
      })
      .catch((err) => setError(err.message || 'Failed to load customers'))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <AdminLayout title="Customers" label="Store">
      <div className="products-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="page-toolbar">
          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="toolbar-search"
          />
        </div>

        {loading ? (
          <div className="state-card">Loading customers...</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.orderCount || 0}</td>
                    <td>{formatPrice(customer.totalSpent)}</td>
                    <td>{customer.status}</td>
                    <td>
                      <Link to={`/customers/${customer._id}`} className="btn-text">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
