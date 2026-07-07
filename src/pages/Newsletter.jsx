import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { newsletterApi } from '../services/api.js';
import './Orders.css';

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    newsletterApi
      .getSubscribers()
      .then((response) => setSubscribers(response.data?.subscribers || []))
      .catch((err) => setError(err.message || 'Failed to load subscribers'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Newsletter Subscribers" label="Marketing">
      <div className="products-page">
        {error && <div className="alert-banner alert-error">{error}</div>}
        {loading ? (
          <div className="state-card">Loading subscribers...</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((item) => (
                  <tr key={item._id}>
                    <td>{item.email}</td>
                    <td>{item.source}</td>
                    <td>{item.status}</td>
                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
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
