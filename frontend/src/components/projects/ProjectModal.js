import React, { useState } from 'react';
import api from '../../utils/api';
import { PROJECT_COLORS } from '../../utils/helpers';

export default function ProjectModal({ onClose, onCreated, project }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    color: project?.color || PROJECT_COLORS[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = isEdit
        ? await api.put(`/projects/${project._id}`, form)
        : await api.post('/projects', form);
      onCreated(res.data.project);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit Project' : 'New Project'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div className="form-group">
            <label className="form-label">
              Description <span style={{ fontWeight: 400, color: 'var(--text3)' }}>· optional</span>
            </label>
            <textarea className="form-input" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          <div className="form-group">
            <label className="form-label">Color label</label>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  style={{
                    width: 30, height: 30, borderRadius: 8, background: c,
                    border: 'none', cursor: 'pointer',
                    outline: form.color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: form.color === c ? 2 : 0,
                    transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }} />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
