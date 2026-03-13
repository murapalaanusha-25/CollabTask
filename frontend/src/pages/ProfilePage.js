import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { getInitials, getGradient } from '../utils/helpers';
import './ProfilePage.css';

const StatBubble = ({ label, value, color }) => (
  <div className="stat-bubble">
    <div className="stat-bubble-val" style={{ color }}>{value ?? '—'}</div>
    <div className="stat-bubble-label">{label}</div>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('notifications');

  useEffect(() => {
    const load = async () => {
      try {
        const [nRes, sRes] = await Promise.all([
          api.get('/notifications'),
          api.get('/tasks/stats/me'),
        ]);
        setNotifications(nRes.data.notifications || []);
        setStats(sRes.data.stats);
        // Mark all read
        api.put('/notifications/read-all').catch(() => {});
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const initials = getInitials(user?.name);
  const gradient = getGradient(user?.name || '');
  const unread = notifications.filter(n => !n.read).length;
  const completion = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const notifIcon = (type) => {
    const icons = {
      task_assigned: '📋',
      task_updated: '✏️',
      comment_added: '💬',
      member_added: '👥',
      deadline_soon: '⏰',
    };
    return icons[type] || '🔔';
  };

  return (
    <Layout>
      <div className="profile-page fade-up">
        <h1 className="page-title">Profile</h1>

        <div className="profile-layout">
          {/* Left — user card */}
          <div className="profile-sidebar">
            <div className="profile-card card">
              <div className="avatar avatar-xl" style={{ background: gradient, marginBottom: 14 }}>
                {initials}
              </div>
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <span className={`badge badge-${user?.role === 'admin' ? 'inprogress' : 'todo'}`} style={{ marginTop: 8, marginBottom: 20 }}>
                {user?.role}
              </span>

              <div className="divider" />

              {/* Task stats */}
              {stats && (
                <>
                  <div className="profile-stats-grid">
                    <StatBubble label="Total"     value={stats.total}     color="var(--text)" />
                    <StatBubble label="Done"       value={stats.completed} color="var(--green)" />
                    <StatBubble label="Active"     value={stats.inprogress}color="var(--blue)" />
                    <StatBubble label="Overdue"    value={stats.overdue}   color="var(--red)" />
                  </div>

                  <div className="completion-section">
                    <div className="completion-label">
                      <span>Completion rate</span>
                      <span style={{ fontFamily: 'var(--mono)', color: 'var(--green)', fontWeight: 700 }}>{completion}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 8, background: 'var(--bg4)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${completion}%`, background: 'var(--green)', borderRadius: 4, transition: 'width 0.8s ease' }}/>
                    </div>
                  </div>
                </>
              )}

              <div className="divider" />
              <button className="btn btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={logout}>
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Sign out
              </button>
            </div>
          </div>

          {/* Right — tabs */}
          <div className="profile-main">
            <div className="profile-tabs">
              <button className={`p-tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => setTab('notifications')}>
                Notifications
                {unread > 0 && <span className="p-tab-badge">{unread}</span>}
              </button>
            </div>

            {tab === 'notifications' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: 24 }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 10 }}/>)}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: '48px 24px' }}>
                    <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                    <h3>All caught up!</h3>
                    <p>You have no notifications yet. They'll appear here when your teammates assign tasks or mention you.</p>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} className={`notif-row ${!n.read ? 'notif-unread' : ''}`}>
                      <div className="notif-icon-wrap">{notifIcon(n.type)}</div>
                      <div className="notif-content">
                        <p className="notif-msg">{n.message}</p>
                        <span className="notif-time">
                          {new Date(n.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {!n.read && <div className="notif-unread-dot" />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
