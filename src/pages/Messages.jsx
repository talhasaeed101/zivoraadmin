import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { ticketApi } from '../services/api.js';
import './Orders.css';
import './Messages.css';

const TICKET_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_customer', label: 'Waiting for Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

const TICKET_CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'product_question', label: 'Product Question' },
  { value: 'return_refund', label: 'Return & Refund' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'general', label: 'General' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLabel(value, options) {
  return options.find((item) => item.value === value)?.label || value?.replace(/_/g, ' ') || '—';
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function Messages() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [reply, setReply] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [replyPriority, setReplyPriority] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const unreadCount = useMemo(
    () => tickets.filter((ticket) => (ticket.adminUnreadCount || 0) > 0).length,
    [tickets]
  );

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open' || ticket.status === 'in_progress').length,
    [tickets]
  );

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketApi.getTickets(filters);
      setTickets(response.data?.tickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) =>
        current.search === searchInput ? current : { ...current, search: searchInput }
      );
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadTicket = async (id) => {
    setDetailLoading(true);
    setActionError('');
    setActionSuccess('');
    setSelectedTicket(null);
    try {
      const response = await ticketApi.getTicket(id);
      const ticket = response.data;
      setSelectedTicket(ticket);
      setReply('');
      setReplyStatus(ticket.status);
      setReplyPriority(ticket.priority);
    } catch (err) {
      setActionError(err.message || 'Failed to load ticket details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmitReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket) return;
    if (!reply.trim() && replyStatus === selectedTicket.status && replyPriority === selectedTicket.priority) {
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      if (reply.trim()) {
        await ticketApi.replyToTicket(selectedTicket._id, {
          message: reply.trim(),
          status: replyStatus || undefined,
          priority: replyPriority || undefined,
        });
        setActionSuccess('Reply sent.');
      } else {
        await ticketApi.updateTicket(selectedTicket._id, {
          status: replyStatus || undefined,
          priority: replyPriority || undefined,
        });
        setActionSuccess('Ticket updated.');
      }
      setReply('');
      await loadTicket(selectedTicket._id);
      await loadTickets();
    } catch (err) {
      setActionError(err.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ status: '', priority: '', category: '', search: '' });
  };

  const hasActiveFilters = Boolean(filters.status || filters.priority || filters.category || filters.search);

  return (
    <AdminLayout title="Support Tickets" label="Support">
      <div className="tickets-admin-page">
        <div className="tickets-toolbar">
          <div className="tickets-toolbar-stats">
            <div className="tickets-stat">
              <span className="tickets-stat-value">{tickets.length}</span>
              <span className="tickets-stat-label">Visible</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{openCount}</span>
              <span className="tickets-stat-label">Active</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{unreadCount}</span>
              <span className="tickets-stat-label">Unread</span>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={loadTickets} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="tickets-admin-content">
          <div className="tickets-list-panel">
            <div className="tickets-filters">
              <input
                type="search"
                placeholder="Search by subject, name, or email…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="search-input"
              />
              <div className="tickets-filter-row">
                <select
                  value={filters.status}
                  onChange={(event) => setFilters({ ...filters, status: event.target.value })}
                  className="filter-select"
                  aria-label="Filter by status"
                >
                  <option value="">All statuses</option>
                  {TICKET_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.priority}
                  onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
                  className="filter-select"
                  aria-label="Filter by priority"
                >
                  <option value="">All priorities</option>
                  {TICKET_PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.category}
                  onChange={(event) => setFilters({ ...filters, category: event.target.value })}
                  className="filter-select"
                  aria-label="Filter by category"
                >
                  <option value="">All categories</option>
                  {TICKET_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button type="button" className="btn-text tickets-clear-filters" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>

            {loading ? (
              <div className="tickets-list-loading">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="ticket-list-skeleton">
                    <div className="shimmer-line shimmer-text shimmer-text--wide" />
                    <div className="shimmer-line shimmer-text shimmer-text--narrow" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="tickets-empty-state">
                <p className="tickets-empty-title">No tickets found</p>
                <p className="tickets-empty-copy">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search.'
                    : 'Customer support tickets will appear here when submitted.'}
                </p>
              </div>
            ) : (
              <div className="tickets-list">
                {tickets.map((ticket) => {
                  const isSelected = selectedTicket?._id === ticket._id;
                  const isUnread = (ticket.adminUnreadCount || 0) > 0;
                  const customerName = ticket.customer?.name || ticket.name || 'Customer';

                  return (
                    <button
                      key={ticket._id}
                      type="button"
                      className={`ticket-list-item ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                      onClick={() => loadTicket(ticket._id)}
                    >
                      <div className="ticket-list-header">
                        <span className="ticket-list-subject">{ticket.subject}</span>
                        {isUnread && <span className="ticket-unread-dot" aria-label="Unread" />}
                      </div>
                      <div className="ticket-list-meta">
                        <span className="ticket-list-customer">{customerName}</span>
                        <span className={`ticket-badge ticket-status-${ticket.status}`}>
                          {formatLabel(ticket.status, TICKET_STATUSES)}
                        </span>
                      </div>
                      <div className="ticket-list-footer">
                        <span className={`ticket-badge ticket-priority-${ticket.priority}`}>
                          {formatLabel(ticket.priority, TICKET_PRIORITIES)}
                        </span>
                        <span>{formatDate(ticket.lastMessageAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ticket-detail-panel">
            {detailLoading ? (
              <div className="ticket-detail-shimmer">
                <div className="shimmer-header">
                  <div className="shimmer-line shimmer-title" />
                  <div className="shimmer-meta-row">
                    <div className="shimmer-chip" />
                    <div className="shimmer-chip shimmer-chip--wide" />
                    <div className="shimmer-chip" />
                    <div className="shimmer-chip shimmer-chip--narrow" />
                  </div>
                </div>
                <div className="shimmer-messages">
                  <div className="shimmer-message shimmer-message--customer">
                    <div className="shimmer-msg-header">
                      <div className="shimmer-line shimmer-sender" />
                      <div className="shimmer-line shimmer-date" />
                    </div>
                    <div className="shimmer-line shimmer-text shimmer-text--full" />
                    <div className="shimmer-line shimmer-text shimmer-text--wide" />
                  </div>
                  <div className="shimmer-message shimmer-message--admin">
                    <div className="shimmer-msg-header">
                      <div className="shimmer-line shimmer-sender" />
                      <div className="shimmer-line shimmer-date" />
                    </div>
                    <div className="shimmer-line shimmer-text shimmer-text--full" />
                  </div>
                </div>
              </div>
            ) : selectedTicket ? (
              <>
                <div className="ticket-detail-header">
                  <div className="ticket-detail-title-row">
                    <h2>{selectedTicket.subject}</h2>
                    <div className="ticket-detail-badges">
                      <span className={`ticket-badge ticket-status-${selectedTicket.status}`}>
                        {formatLabel(selectedTicket.status, TICKET_STATUSES)}
                      </span>
                      <span className={`ticket-badge ticket-priority-${selectedTicket.priority}`}>
                        {formatLabel(selectedTicket.priority, TICKET_PRIORITIES)}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-detail-meta">
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Customer</span>
                      <span className="ticket-meta-value">
                        {selectedTicket.customer?.name || selectedTicket.name || '—'}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Email</span>
                      <span className="ticket-meta-value">
                        {selectedTicket.customer?.email || selectedTicket.email || '—'}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Category</span>
                      <span className="ticket-meta-value">
                        {formatLabel(selectedTicket.category, TICKET_CATEGORIES)}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Created</span>
                      <span className="ticket-meta-value">{formatDate(selectedTicket.createdAt)}</span>
                    </div>
                    {selectedTicket.order?.orderNumber && (
                      <div className="ticket-meta-card">
                        <span className="ticket-meta-label">Order</span>
                        <span className="ticket-meta-value">{selectedTicket.order.orderNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {actionError && <div className="alert-banner alert-error">{actionError}</div>}
                {actionSuccess && <div className="alert-banner alert-success">{actionSuccess}</div>}

                <div className="ticket-messages">
                  {(selectedTicket.messages || []).length === 0 ? (
                    <div className="tickets-empty-state tickets-empty-state--compact">
                      <p className="tickets-empty-title">No messages yet</p>
                    </div>
                  ) : (
                    (selectedTicket.messages || []).map((msg, idx) => {
                      const isAdmin = msg.messageSenderModel === 'Admin';
                      const senderName = isAdmin
                        ? 'Support'
                        : selectedTicket.customer?.name || selectedTicket.name || 'Customer';

                      return (
                        <div
                          key={msg._id || idx}
                          className={`ticket-message ${isAdmin ? 'admin-message' : 'customer-message'}`}
                        >
                          <div className="ticket-message-avatar" aria-hidden="true">
                            {getInitials(senderName)}
                          </div>
                          <div className="ticket-message-body">
                            <div className="ticket-message-header">
                              <span className="ticket-message-sender">{senderName}</span>
                              <span className="ticket-message-date">{formatDate(msg.createdAt)}</span>
                            </div>
                            <div className="ticket-message-content">
                              {(msg.message || '').split('\n').map((line, i) => (
                                <p key={i}>{line || '\u00A0'}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {selectedTicket.status === 'closed' ? (
                  <div className="ticket-closed-banner">This ticket is closed. Reopen it by changing the status below if needed.</div>
                ) : null}

                <div className="ticket-reply-form">
                  <form onSubmit={handleSubmitReply}>
                    <div className="reply-form-fields">
                      <label className="reply-field">
                        <span>Status</span>
                        <select
                          value={replyStatus}
                          onChange={(event) => setReplyStatus(event.target.value)}
                          className="reply-select"
                        >
                          {TICKET_STATUSES.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="reply-field">
                        <span>Priority</span>
                        <select
                          value={replyPriority}
                          onChange={(event) => setReplyPriority(event.target.value)}
                          className="reply-select"
                        >
                          {TICKET_PRIORITIES.map((priority) => (
                            <option key={priority.value} value={priority.value}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={
                        selectedTicket.status === 'closed'
                          ? 'Add an internal note or reopen with a reply…'
                          : 'Type your reply to the customer…'
                      }
                      rows={4}
                      className="reply-textarea"
                    />
                    <div className="reply-actions">
                      <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Sending…' : reply.trim() ? 'Send Reply' : 'Update Ticket'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="tickets-empty-state tickets-empty-state--panel">
                <p className="tickets-empty-title">Select a ticket</p>
                <p className="tickets-empty-copy">
                  Choose a conversation from the list to read messages and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
