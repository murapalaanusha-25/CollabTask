import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotificationSocket } from '../../hooks/useSocket';
import api from '../../utils/api';
import './Layout.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.notifications.slice(0, 12));
      setUnread(r.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  useNotificationSocket((data) => {
    setUnread(u => u + 1);
    setNotifications(prev => [{ message: data.message, read: false, createdAt: new Date(), _id: Date.now() }, ...prev.slice(0, 11)]);
  });

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnread(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg> },
    { path: '/profile', label: 'Profile', icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <rect x="2" y="2" width="9" height="9" rx="2.5" fill="#fff"/>
              <rect x="13" y="2" width="9" height="9" rx="2.5" fill="#fff" opacity=".65"/>
              <rect x="2" y="13" width="9" height="9" rx="2.5" fill="#fff" opacity=".65"/>
              <rect x="13" y="13" width="9" height="9" rx="2.5" fill="#fff" opacity=".4"/>
            </svg>
          </div>
          <span>CollabTask</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button key={item.path} className={`nav-item ${location.pathname === item.path ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              {item.icon}<span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="notif-wrap">
            <button className={`notif-btn ${unread > 0 ? 'has-unread' : ''}`} onClick={() => setNotifOpen(o => !o)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span>Notifications</span>
                  {unread > 0 && <button className="btn btn-xs btn-ghost" onClick={markAllRead}>Mark all read</button>}
                </div>
                <div className="notif-list">
                  {notifications.length === 0
                    ? <div style={{padding:'20px',textAlign:'center',color:'var(--text3)',fontSize:13}}>All caught up ✓</div>
                    : notifications.map((n, i) => (
                      <div key={n._id || i} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => { if (n.link) { navigate(n.link); setNotifOpen(false); } }}>
                        <div className="notif-dot" style={{opacity: n.read ? 0 : 1}} />
                        <div><p>{n.message}</p><span>{n.createdAt ? new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) : ''}</span></div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="user-chip" onClick={() => navigate('/profile')}>
            <div className="avatar avatar-sm">{initials}</div>
            <div className="user-info">
              <span>{user?.name}</span>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="logout-btn" onClick={logout} title="Sign out">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {notifOpen && <div className="notif-backdrop" onClick={() => setNotifOpen(false)} />}
      <main className="main-content">{children}</main>
    </div>
  );
}
