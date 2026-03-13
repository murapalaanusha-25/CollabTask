import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { getGreeting, getInitials, getGradient, PROJECT_COLORS, formatDate } from '../utils/helpers';
import ProjectModal from '../components/projects/ProjectModal';
import './DashboardPage.css';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color + '15', color }}>{icon}</div>
    <div className="stat-body">
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchData = useCallback(async () => {
    try {
      const [projRes, statsRes, taskRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks/stats/me'),
        api.get(`/tasks?assignedTo=${user.id}`),
      ]);
      setProjects(projRes.data.projects);
      setStats(statsRes.data.stats);
      setMyTasks(taskRes.data.tasks.slice(0, 6));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const completion = stats?.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Layout>
      <div className="dashboard fade-up">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Here's what's happening across your workspace today.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Project
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <StatCard label="My Tasks" value={stats?.total} color="#e85d26" sub={`${completion}% complete`}
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>}
          />
          <StatCard label="Completed" value={stats?.completed} color="#16a34a"
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          />
          <StatCard label="In Progress" value={stats?.inprogress} color="#2563eb"
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
          />
          <StatCard label="Overdue" value={stats?.overdue} color="#dc2626"
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
          />
          <StatCard label="Projects" value={projects.length} color="#7c3aed"
            icon={<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>}
          />
        </div>

        <div className="dash-body">
          {/* Projects */}
          <div className="projects-section">
            <div className="section-toolbar">
              <h2>Projects</h2>
              <div className="toolbar-right">
                <div className="search-wrap">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input className="form-input search-input" placeholder="Search projects…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ width: 200, padding: '7px 10px 7px 34px' }} />
                </div>
                <div className="filter-tabs">
                  {['all', 'active', 'completed', 'archived'].map(f => (
                    <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="proj-grid">
                {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 185 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state card">
                <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                </svg>
                <h3>{search ? 'No projects match your search' : 'No projects yet'}</h3>
                <p>{search ? 'Try a different term.' : 'Create your first project and invite your team.'}</p>
                {!search && <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>Create Project</button>}
              </div>
            ) : (
              <div className="proj-grid">
                {filtered.map((p, i) => {
                  const progress = p.stats?.total > 0 ? Math.round((p.stats.completed / p.stats.total) * 100) : 0;
                  return (
                    <div key={p._id} className="proj-card" onClick={() => navigate(`/project/${p._id}`)}>
                      <div className="proj-card-top">
                        <div className="proj-color-stripe" style={{ background: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                        <div className="proj-card-header">
                          <span className={`badge badge-${p.status}`}>{p.status}</span>
                          <div className="proj-member-count">
                            {p.members?.slice(0, 3).map((m, mi) => (
                              <div key={m._id} className="avatar avatar-sm"
                                style={{ background: getGradient(m.name), marginLeft: mi > 0 ? -8 : 0, zIndex: 3 - mi, position: 'relative', border: '2px solid var(--bg2)' }}>
                                {getInitials(m.name)}
                              </div>
                            ))}
                            {p.members?.length > 3 && <span className="more-members">+{p.members.length - 3}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="proj-card-body">
                        <h3 className="proj-name">{p.name}</h3>
                        <p className="proj-desc">{p.description || 'No description added yet.'}</p>
                        <div className="proj-progress">
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${progress}%`, background: p.color || PROJECT_COLORS[i % PROJECT_COLORS.length] }} />
                          </div>
                          <span className="progress-pct">{progress}%</span>
                        </div>
                        <div className="proj-footer">
                          <span>{p.stats?.total || 0} tasks</span>
                          <span style={{ color: 'var(--green)' }}>{p.stats?.completed || 0} done</span>
                          {p.stats?.inprogress > 0 && <span style={{ color: 'var(--blue)' }}>{p.stats.inprogress} active</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* My Tasks sidebar */}
          <div className="my-tasks-panel">
            <h2>My Tasks</h2>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: 16 }}><div className="skeleton" style={{ height: 200 }} /></div>
              ) : myTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <p>No tasks assigned to you yet.</p>
                </div>
              ) : (
                myTasks.map(task => {
                  const dl = formatDate(task.deadline);
                  return (
                    <div key={task._id} className="my-task-row" onClick={() => navigate(`/project/${task.project}`)}>
                      <div className={`task-status-dot dot-${task.status}`} />
                      <div className="my-task-info">
                        <span className="my-task-title">{task.title}</span>
                        <div className="my-task-meta">
                          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                          {dl && <span className={`deadline-chip ${dl.overdue ? 'overdue' : dl.urgent ? 'urgent' : ''}`}>{dl.label}</span>}
                        </div>
                      </div>
                      <span className={`badge badge-${task.status}`}>
                        {task.status === 'inprogress' ? 'Active' : task.status === 'completed' ? 'Done' : 'To Do'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => { setProjects(prev => [{ ...p, stats: { total: 0, completed: 0, inprogress: 0, todo: 0 } }, ...prev]); setShowModal(false); }}
        />
      )}
    </Layout>
  );
}
