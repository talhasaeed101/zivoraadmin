import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { ticketApi } from '../services/api.js';
import './Orders.css';
import './Messages.css';

const TICKET_STATUSES = ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'];
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const TICKET_CATEGORIES = ['order_issue', 'product_question', 'return_refund', 'payment_issue', 'account_issue', 'general'];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function Messages() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [replyPriority, setReplyPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await ticketApi.getTickets(filters);
      setTickets(response.data?.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTicket = async (id) => {
    try {
      const response = await ticketApi.getTicket(id);
      setSelectedTicket(response.data);
      setReply('');
      setReplyStatus(response.data.status);
      setReplyPriority(response.data.priority);
    } catch (err) {
      console.error('Failed to load ticket:', err);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() && !replyStatus && !replyPriority) return;

    setSubmitting(true);
    try {
      if (reply.trim()) {
        await ticketApi.replyToTicket(selectedTicket._id, {
          message: reply,
          status: replyStatus || undefined,
          priority: replyPriority || undefined,
        });
      } else if (replyStatus || replyPriority) {
        await ticketApi.updateTicket(selectedTicket._id, {
          status: replyStatus || undefined,
          priority: replyPriority || undefined,
        });
      }
      await loadTicket(selectedTicket._id);
      await loadTickets();
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Support Tickets" label="Support">
      <div className="tickets-admin-page">
        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="tickets-admin-content">
          {/* Tickets List */}
          <div className="tickets-list-panel">
            <div className="tickets-filters">
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="search-input"
              />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                {TICKET_STATUSES.map(status => (
                  <option key={status} value={status}>{status.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="filter-select"
              >
                <option value="">All Priorities</option>
                {TICKET_PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {TICKET_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="state-card">Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="state-card">No tickets found</div>
            ) : (
              <div className="tickets-list">
                {tickets.map((ticket) => (
                  <div
                    key={ticket._id}
                    className={`ticket-list-item ${selectedTicket?._id === ticket._id ? 'selected' : ''} ${ticket.adminUnreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => loadTicket(ticket._id)}
                  >
                    <div className="ticket-list-header">
                      <span className="ticket-list-subject">{ticket.subject}</span>
                      <span className={`ticket-priority-${ticket.priority}`}>{ticket.priority}</span>
                    </div>
                    <div className="ticket-list-meta">
                      <span>{ticket.customer?.name || ticket.name}</span>
                      <span className={`ticket-status-${ticket.status}`}>{ticket.status.replace('_', ' ')}</span>
                    </div>
                    <div className="ticket-list-footer">
                      <span>{ticket.category.replace('_', ' ')}</span>
                      <span>{formatDate(ticket.lastMessageAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Detail */}
          <div className="ticket-detail-panel">
            {selectedTicket ? (
              <>
                <div className="ticket-detail-header">
                  <div>
                    <h2>{selectedTicket.subject}</h2>
                    <div className="ticket-detail-meta">
                      <span>Customer: {selectedTicket.customer?.name || selectedTicket.name}</span>
                      <span>Email: {selectedTicket.customer?.email || selectedTicket.email}</span>
                      {selectedTicket.order?.orderNumber && (
                        <span>Order: {selectedTicket.order.orderNumber}</span>
                      )}
                      <span>Category: {selectedTicket.category.replace('_', ' ')}</span>
                      <span>Created: {formatDate(selectedTicket.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="ticket-messages">
                  {selectedTicket.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`ticket-message ${msg.messageSenderModel === 'Admin' ? 'admin-message' : 'customer-message'}`}
                    >
                      <div className="ticket-message-header">
                        <span className="ticket-message-sender">
                          {msg.messageSenderModel === 'Admin' ? 'Admin' : selectedTicket.customer?.name || 'Customer'}
                        </span>
                        <span className="ticket-message-date">{formatDate(msg.createdAt)}</span>
                      </div>
                      <div className="ticket-message-content">
                        {msg.message.split('\n').map((line, i) => (
                          <p key={i}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedTicket.status !== 'closed' && (
                  <div className="ticket-reply-form">
                    <form onSubmit={handleSubmitReply}>
                      <div className="reply-form-fields">
                        <select
                          value={replyStatus}
                          onChange={(e) => setReplyStatus(e.target.value)}
                          className="reply-select"
                        >
                          {TICKET_STATUSES.map(status => (
                            <option key={status} value={status}>{status.replace('_', ' ')}</option>
                          ))}
                        </select>
                        <select
                          value={replyPriority}
                          onChange={(e) => setReplyPriority(e.target.value)}
                          className="reply-select"
                        >
                          {TICKET_PRIORITIES.map(priority => (
                            <option key={priority} value={priority}>{priority}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply..."
                        rows={4}
                        className="reply-textarea"
                      />
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="state-card">Select a ticket to view details</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
