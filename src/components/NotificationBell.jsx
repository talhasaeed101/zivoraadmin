import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import './NotificationBell.css';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useSocket();
  const [open, setOpen] = useState(false);

  return (
    <div className="notification-bell-wrap">
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button type="button" className="btn-text" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">No notifications yet.</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item._id}
                  className={`notification-item ${item.read ? '' : 'notification-item-unread'}`}
                >
                  <p className="notification-title">{item.title}</p>
                  <p className="notification-message">{item.message}</p>
                  <div className="notification-actions">
                    {item.link && (
                      <Link
                        to={item.link}
                        className="btn-text"
                        onClick={() => {
                          if (!item.read) markRead(item._id);
                          setOpen(false);
                        }}
                      >
                        View
                      </Link>
                    )}
                    {!item.read && (
                      <button type="button" className="btn-text" onClick={() => markRead(item._id)}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
