import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout.jsx';
import { contactApi } from '../services/api.js';
import './Orders.css';
import './Messages.css';

const MESSAGE_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
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

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusDraft, setStatusDraft] = useState('new');
  const [submitting, setSubmitting] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await contactApi.getMessages({
        status: statusFilter || undefined,
        limit: 100,
      });
      setMessages(response.data?.messages || []);
    } catch (err) {
      setError(err.message || 'Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredMessages = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return messages;

    return messages.filter((message) => {
      const haystack = `${message.name || ''} ${message.email || ''} ${message.message || ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [messages, searchInput]);

  const newCount = useMemo(
    () => messages.filter((message) => message.status === 'new').length,
    [messages]
  );

  const selectMessage = async (message) => {
    setSelectedMessage(message);
    setStatusDraft(message.status || 'new');
    setActionError('');
    setActionSuccess('');

    if (message.status === 'new') {
      try {
        const response = await contactApi.updateStatus(message._id, 'read');
        const updated = response.data || { ...message, status: 'read' };
        setSelectedMessage(updated);
        setStatusDraft(updated.status || 'read');
        setMessages((current) =>
          current.map((item) => (item._id === message._id ? { ...item, ...updated } : item))
        );
      } catch {
        // Keep message open even if auto-mark-read fails
      }
    }
  };

  const handleUpdateStatus = async (event) => {
    event.preventDefault();
    if (!selectedMessage || statusDraft === selectedMessage.status) return;

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await contactApi.updateStatus(selectedMessage._id, statusDraft);
      const updated = response.data || { ...selectedMessage, status: statusDraft };
      setSelectedMessage(updated);
      setMessages((current) =>
        current.map((item) => (item._id === selectedMessage._id ? { ...item, ...updated } : item))
      );
      setActionSuccess('Status updated.');
    } catch (err) {
      setActionError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(statusFilter || searchInput.trim());

  return (
    <AdminLayout title="Support Messages" label="Support">
      <div className="tickets-admin-page">
        <div className="tickets-toolbar">
          <div className="tickets-toolbar-stats">
            <div className="tickets-stat">
              <span className="tickets-stat-value">{filteredMessages.length}</span>
              <span className="tickets-stat-label">Visible</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{newCount}</span>
              <span className="tickets-stat-label">New</span>
            </div>
            <div className="tickets-stat">
              <span className="tickets-stat-value">{messages.length}</span>
              <span className="tickets-stat-label">Total</span>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={loadMessages} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && <div className="alert-banner alert-error">{error}</div>}

        <div className="tickets-admin-content">
          <div className="tickets-list-panel">
            <div className="tickets-filters">
              <input
                type="search"
                placeholder="Search by name, email, or message…"
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
                {MESSAGE_STATUSES.map((status) => (
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
            ) : filteredMessages.length === 0 ? (
              <div className="tickets-empty-state">
                <p className="tickets-empty-title">No messages found</p>
                <p className="tickets-empty-copy">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search.'
                    : 'Contact form submissions will appear here.'}
                </p>
              </div>
            ) : (
              <div className="tickets-list">
                {filteredMessages.map((message) => {
                  const isSelected = selectedMessage?._id === message._id;
                  const isNew = message.status === 'new';

                  return (
                    <button
                      key={message._id}
                      type="button"
                      className={`ticket-list-item ${isSelected ? 'selected' : ''} ${isNew ? 'unread' : ''}`}
                      onClick={() => selectMessage(message)}
                    >
                      <div className="ticket-list-header">
                        <span className="ticket-list-subject">{message.name || 'Customer'}</span>
                        {isNew && <span className="ticket-unread-dot" aria-label="New" />}
                      </div>
                      <div className="ticket-list-meta">
                        <span className="ticket-list-customer">{message.email}</span>
                        <span className={`ticket-badge ticket-status-${message.status}`}>
                          {formatLabel(message.status, MESSAGE_STATUSES)}
                        </span>
                      </div>
                      <div className="ticket-list-footer">
                        <span className="ticket-list-preview">{previewText(message.message)}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ticket-detail-panel">
            {selectedMessage ? (
              <>
                <div className="ticket-detail-header">
                  <div className="ticket-detail-title-row">
                    <h2>Message from {selectedMessage.name || 'Customer'}</h2>
                    <div className="ticket-detail-badges">
                      <span className={`ticket-badge ticket-status-${selectedMessage.status}`}>
                        {formatLabel(selectedMessage.status, MESSAGE_STATUSES)}
                      </span>
                    </div>
                  </div>

                  <div className="ticket-detail-meta">
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Name</span>
                      <span className="ticket-meta-value">{selectedMessage.name || '—'}</span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Email</span>
                      <span className="ticket-meta-value">
                        {selectedMessage.email ? (
                          <a href={`mailto:${selectedMessage.email}`}>{selectedMessage.email}</a>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <div className="ticket-meta-card">
                      <span className="ticket-meta-label">Received</span>
                      <span className="ticket-meta-value">{formatDate(selectedMessage.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {actionError && <div className="alert-banner alert-error">{actionError}</div>}
                {actionSuccess && <div className="alert-banner alert-success">{actionSuccess}</div>}

                <div className="ticket-messages">
                  <div className="ticket-message customer-message">
                    <div className="ticket-message-avatar" aria-hidden="true">
                      {getInitials(selectedMessage.name)}
                    </div>
                    <div className="ticket-message-body">
                      <div className="ticket-message-header">
                        <span className="ticket-message-sender">{selectedMessage.name || 'Customer'}</span>
                        <span className="ticket-message-date">{formatDate(selectedMessage.createdAt)}</span>
                      </div>
                      <div className="ticket-message-content">
                        {(selectedMessage.message || '').split('\n').map((line, index) => (
                          <p key={index}>{line || '\u00A0'}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ticket-reply-form">
                  <div className="reply-actions-row">
                    {selectedMessage.email && (
                      <a
                        className="btn-secondary"
                        href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                          `Re: Your message to Zivorah`
                        )}`}
                      >
                        Reply by email
                      </a>
                    )}
                  </div>

                  <form onSubmit={handleUpdateStatus}>
                    <label className="reply-field">
                      <span>Status</span>
                      <select
                        value={statusDraft}
                        onChange={(event) => setStatusDraft(event.target.value)}
                        className="reply-select"
                      >
                        {MESSAGE_STATUSES.map((status) => (
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
                        disabled={submitting || statusDraft === selectedMessage.status}
                      >
                        {submitting ? 'Saving…' : 'Update Status'}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="tickets-empty-state tickets-empty-state--panel">
                <p className="tickets-empty-title">Select a message</p>
                <p className="tickets-empty-copy">
                  Choose a contact submission from the list to read it and update its status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
