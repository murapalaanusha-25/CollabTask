import React, { useState } from 'react';
import api from '../../utils/api';
import { getInitials, getGradient } from '../../utils/helpers';
import './MembersPanel.css';

export default function MembersPanel({ project, currentUser, onUpdated, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = project.createdBy?._id === currentUser?.id || project.createdBy === currentUser?.id;

  const invite = async e => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/invite`, { email: email.trim() });
      setSuccess(`${email} was added to the project!`);
      setEmail('');
      onUpdated(res.data.project);
    } catch(err) { setError(err.response?.data?.message || 'Failed to invite member.'); }
    finally { setLoading(false); }
  };

  const removeMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await api.delete(`/projects/${project._id}/members/${userId}`);
      onUpdated(res.data.project);
    } catch(err) { setError(err.response?.data?.message || 'Failed to remove member.'); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">Team Members</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Invite form */}
        {isOwner && (
          <form onSubmit={invite} style={{marginBottom:24}}>
            <label className="form-label" style={{marginBottom:8,display:'block'}}>Invite by email</label>
            {error   && <div className="alert alert-error"   style={{marginBottom:10}}>{error}</div>}
            {success && <div className="alert alert-success" style={{marginBottom:10}}>{success}</div>}
            <div style={{display:'flex',gap:8}}>
              <input className="form-input" type="email" placeholder="colleague@company.com"
                value={email} onChange={e => setEmail(e.target.value)} style={{flex:1}}/>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <span className="spinner"/> : 'Invite'}
              </button>
            </div>
            <p style={{fontSize:12,color:'var(--text3)',marginTop:6}}>The person must already have a CollabTask account.</p>
          </form>
        )}

        <div className="divider" style={{margin:'0 0 20px'}}/>

        {/* Members list */}
        <div className="members-list">
          {project.members?.map(m => {
            const isCreator = m._id === (project.createdBy?._id || project.createdBy);
            return (
              <div key={m._id} className="member-row">
                <div className="avatar avatar-sm" style={{background: getGradient(m.name)}}>{getInitials(m.name)}</div>
                <div className="member-info">
                  <span className="member-name">{m.name}</span>
                  <span className="member-email">{m.email}</span>
                </div>
                {isCreator ? (
                  <span className="badge badge-active" style={{fontSize:10}}>Owner</span>
                ) : (isOwner && m._id !== currentUser?.id) ? (
                  <button className="btn btn-ghost btn-xs" style={{color:'var(--red)'}} onClick={() => removeMember(m._id)}>Remove</button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
