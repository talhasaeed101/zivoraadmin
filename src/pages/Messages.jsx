import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { contactApi } from '../services/api.js';
import './Orders.css';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    contactApi
      .getMessages()
      .then((response) => setMessages(response.data?.messages || []))
      .catch((err) => setError(err.message || 'Failed to load messages'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    await contactApi.updateStatus(id, 'read');
    load();
  };

  return (
    <AdminLayout title="Contact Messages" label="Support">
      <div className="products-page">
        {error && <div className="alert-banner alert-error">{error}</div>}
        {loading ? (
          <div className="state-card">Loading messages...</div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message._id}>
                    <td>{message.name}</td>
                    <td>{message.email}</td>
                    <td>{message.message}</td>
                    <td>{message.status}</td>
                    <td>
                      {message.status === 'new' && (
                        <button type="button" className="btn-text" onClick={() => markRead(message._id)}>
                          Mark read
                        </button>
                      )}
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
