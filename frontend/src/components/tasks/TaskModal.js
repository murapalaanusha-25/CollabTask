import React, { useState } from 'react';
import api from '../../utils/api';
import { getInitials, getGradient } from '../../utils/helpers';
import './TaskModal.css';

export default function TaskModal({ task, projectId, projectMembers = [], onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignedTo: task?.assignedTo?._id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    deadline: task?.deadline ? task.deadline.substring(0, 10) : '',
  });
  const [tab, setTab] = useState('details');
  const [comment, setComment] = useState('');
  const [liveTask, setLiveTask] = useState(task);
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, project: projectId, assignedTo: form.assignedTo || null };
      const res = isEdit
        ? await api.put(`/tasks/${task._id}`, payload)
        : await api.post('/tasks', payload);
      onSaved(res.data.task, isEdit);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally { setSaving(false); }
  };

  const addComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setLiveTask(res.data.task);
      setComment('');
    } catch {}
    finally { setCommenting(false); }
  };

  const deleteComment = async (commentId) => {
    try {
      const res = await api.delete(`/tasks/${task._id}/comments/${commentId}`);
      setLiveTask(res.data.task);
    } catch {}
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${isEdit ? 'modal-wide' : ''}`}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {isEdit && (
          <div className="task-modal-tabs">
            {['details', 'comments', 'activity'].map(t => (
              <button key={t} className={`task-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'comments' && liveTask?.comments?.length > 0 && (
                  <span className="tab-count">{liveTask.comments.length}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {tab === 'details' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Task title *</label>
              <input className="form-input" placeholder="e.g. Design login page"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" placeholder="Add details, links, acceptance criteria…"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="task-modal-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="todo">To Do</option>
                  <option value="inprogress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assign to</label>
                <select className="form-input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {projectMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </form>
        )}

        {tab === 'comments' && (
          <div className="task-comments">
            <div className="comments-list">
              {!liveTask?.comments?.length ? (
                <div className="empty-state" style={{ padding: '28px 0' }}>
                  <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                  <p>No comments yet. Start the conversation!</p>
                </div>
              ) : (
                liveTask.comments.map(c => (
                  <div key={c._id} className="comment-item">
                    <div className="avatar avatar-sm" style={{ background: getGradient(c.author?.name || '') }}>
                      {getInitials(c.author?.name || '')}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <strong>{c.author?.name}</strong>
                        <span>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <button className="comment-delete" onClick={() => deleteComment(c._id)}>×</button>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={addComment} className="comment-form">
              <textarea className="form-input" placeholder="Write a comment…"
                value={comment} onChange={e => setComment(e.target.value)} rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addComment(e); } }} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={commenting || !comment.trim()}>
                  {commenting ? <span className="spinner" /> : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {tab === 'activity' && (
          <div className="activity-log">
            {!liveTask?.activity?.length ? (
              <div className="empty-state" style={{ padding: '28px 0' }}>
                <p>No activity recorded yet.</p>
              </div>
            ) : (
              [...liveTask.activity].reverse().map((a, i) => (
                <div key={i} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p>{a.message}</p>
                    <span>{new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
