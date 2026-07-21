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

const TICKET_CATEGORIES = [
  { value: 'order_issue', label: 'Order Issue' },
  { value: 'product_question', label: 'Product Question' },
  { value: 'return_refund', label: 'Return & Refund' },
  { value: 'payment_issue', label: 'Payment Issue' },
  { value: 'account_issue', label: 'Account Issue' },
  { value: 'general', label: 'General Inquiry' },
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
  return options.find((item) => item.value === value)?.label || value || '—';
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

function previewText(text, max = 90) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max)}…`;
}

function lastMessagePreview(ticket) {
  const messages = ticket.messages || [];
  const last = messages[messages.length - 1];
  return previewText(last?.message || ticket.subject);
}

export default function Tickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusDraft, setStatusDraft] = useState('open');
  const [replyDraft, setReplyDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketApi.getTickets({
        status: statusFilter || undefined,
        limit: 100,
      });
      const nextTickets = response.data?.tickets || [];
      setTickets(nextTickets);

      setSelectedTicket((current) => {
        if (!current) return null;
        return nextTickets.find((ticket) => ticket._id === current._id) || null;
      });
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredTickets = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return tickets;

    return tickets.filter((ticket) => {
      const customer = ticket.customer || {};
      const haystack = `${ticket.subject || ''} ${customer.name || ''} ${customer.email || ''} ${
        ticket.order?.orderNumber || ''
      }`.toLowerCase();
      return haystack.includes(query);
    });
  }, [tickets, searchInput]);

  const openCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'open').length,
    [tickets]
  );

  const selectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setStatusDraft(ticket.status || 'open');
    setReplyDraft('');
    setActionError('');
    setActionSuccess('');
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    if (!selectedTicket || statusDraft === selectedTicket.status) return;

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await ticketApi.updateTicket(selectedTicket._id, { status: statusDraft });
      const updated = response.data || { ...selectedTicket, status: statusDraft };
      setSelectedTicket(updated);
      setTickets((current) =>
        current.map((item) => (item._id === selectedTicket._id ? { ...item, ...updated } : item))
      );
      setActionSuccess('Status updated.');
    } catch (err) {
      setActionError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selectedTicket || !replyDraft.trim()) return;

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await ticketApi.replyToTicket(selectedTicket._id, {
        message: replyDraft.trim(),
      });
      const updated = response.data || selectedTicket;
      setSelectedTicket(updated);
      setTickets((current) =>
        current.map((item) => (item._id === selectedTicket._id ? { ...item, ...updated } : item))
      );
      setStatusDraft(updated.status || 'waiting_for_customer');
      setReplyDraft('');
      setActionSuccess('Reply sent.');
    } catch (err) {
      setActionError(err.message || 'Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(statusFilter || searchInput.trim());
  const canReply = selectedTicket && selectedTicket.status !== 'closed';

  return (
    <AdminLayout title="Support Tickets" label="Support">
      <div className="tickets-admin-page">
        <div className="tickets-toolbar">
          <div className="tickets-toolbar-stats">
            <div className="tickets-stat">
              <span className="tickets-stat-value">{filteredTickets.length}</span>
              <span className="tickets-stat-label">Visible</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{openCount}</span>
              <span className="tickets-stat-label">Open</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{tickets.length}</span>
              <span className="tickets-stat-label">Total</span>
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
                placeholder="Search subject, customer, or order…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="search-input"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
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
            ) : filteredTickets.length === 0 ? (
              <div className="tickets-empty-state">
                <p className="tickets-empty-title">No tickets found</p>
                <p className="tickets-empty-copy">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search.'
                    : 'Customer support tickets will appear here.'}
                </p>
              </div>
            ) : (
              <div className="tickets-list">
                {filteredTickets.map((ticket) => {
                  const isSelected = selectedTicket?._id === ticket._id;
                  const isOpen = ticket.status === 'open';

                  return (
                    <button
                      key={ticket._id}
                      type="button"
                      className={`ticket-list-item ${isSelected ? 'selected' : ''} ${isOpen ? 'unread' : ''}`}
                      onClick={() => selectTicket(ticket)}
                    >
                      <div className="ticket-list-header">
                        <span className="ticket-list-subject">{ticket.subject || 'Untitled'}</span>
                        {isOpen && <span className="ticket-unread-dot" aria-label="Open" />}
                      </div>
                      <div className="ticket-list-meta">
                        <span className="ticket-list-customer">
                          {ticket.customer?.name || ticket.customer?.email || 'Customer'}
                        </span>
                        <span className={`ticket-badge ticket-status-${ticket.status}`}>
                          {formatLabel(ticket.status, TICKET_STATUSES)}
                        </span>
                      </div>
                      <div className="ticket-list-footer">
                        <span className="ticket-list-preview">{lastMessagePreview(ticket)}</span>
                        <span>{formatDate(ticket.lastMessageAt || ticket.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ticket-detail-panel">
            {selectedTicket ? (
              <>
                <div className="ticket-detail-header">
                  <div className="ticket-detail-title-row">
                    <h2>{selectedTicket.subject}</h2>
                    <div className="ticket-detail-badges">
                      <span className={`ticket-badge ticket-status-${selectedTicket.status}`}>
                        {formatLabel(selectedTicket.status, TICKET_STATUSES)}
                      </span>
                      <span className="ticket-badge">
                        {formatLabel(selectedTicket.category, TICKET_CATEGORIES)}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-detail-meta">
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Customer</span>
                      <span className="ticket-meta-value">
                        {selectedTicket.customer?.name || '—'}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Email</span>
                      <span className="ticket-meta-value">
                        {selectedTicket.customer?.email ? (
                          <a href={`mailto:${selectedTicket.customer.email}`}>
                            {selectedTicket.customer.email}
                          </a>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Order</span>
                      <span className="ticket-meta-value">
                        {selectedTicket.order?.orderNumber || '—'}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Updated</span>
                      <span className="ticket-meta-value">
                        {formatDate(selectedTicket.lastMessageAt || selectedTicket.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {actionError && <div className="alert-banner alert-error">{actionError}</div>}
                {actionSuccess && <div className="alert-banner alert-success">{actionSuccess}</div>}

                <div className="ticket-messages">
                  {(selectedTicket.messages || []).map((message, index) => {
                    const isCustomer = message.messageSenderModel === 'Customer';
                    const senderName = isCustomer
                      ? selectedTicket.customer?.name || 'Customer'
                      : 'Support';

                    return (
                      <div
                        key={`${selectedTicket._id}-${index}-${message.createdAt}`}
                        className={`ticket-message ${isCustomer ? 'customer-message' : 'admin-message'}`}
                      >
                        <div className="ticket-message-avatar" aria-hidden="true">
                          {getInitials(senderName)}
                        </div>
                        <div className="ticket-message-body">
                          <div className="ticket-message-header">
                            <span className="ticket-message-sender">{senderName}</span>
                            <span className="ticket-message-date">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <div className="ticket-message-content">
                            {(message.message || '').split('\n').map((line, lineIndex) => (
                              <p key={lineIndex}>{line || '\u00A0'}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ticket-reply-form">
                  <form onSubmit={handleUpdateStatus}>
                    <label className="reply-field">
                      <span>Status</span>
                      <select
                        value={statusDraft}
                        onChange={(event) => setStatusDraft(event.target.value)}
                        className="reply-select"
                      >
                        {TICKET_STATUSES.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="reply-actions">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting || statusDraft === selectedTicket.status}
                      >
                        {submitting ? 'Saving…' : 'Update Status'}
                      </button>
                    </div>
                  </form>

                  <form onSubmit={handleReply} style={{ marginTop: 16 }}>
                    <label className="reply-field">
                      <span>Reply</span>
                      <textarea
                        value={replyDraft}
                        onChange={(event) => setReplyDraft(event.target.value)}
                        className="reply-textarea"
                        rows={4}
                        placeholder={
                          canReply
                            ? 'Write a reply to the customer…'
                            : 'This ticket is closed.'
                        }
                        disabled={!canReply || submitting}
                      />
                    </label>
                    <div className="reply-actions">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={!canReply || submitting || !replyDraft.trim()}
                      >
                        {submitting ? 'Sending…' : 'Send Reply'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="tickets-empty-state tickets-empty-state--panel">
                <p className="tickets-empty-title">Select a ticket</p>
                <p className="tickets-empty-copy">
                  Choose a support ticket from the list to read the thread and reply.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
