import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Layout from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { useProjectSocket } from '../hooks/useSocket';
import api from '../utils/api';
import { getInitials, getGradient, formatDate, PROJECT_COLORS } from '../utils/helpers';
import TaskModal from '../components/tasks/TaskModal';
import ProjectModal from '../components/projects/ProjectModal';
import MembersPanel from '../components/projects/MembersPanel';
import './ProjectPage.css';

/* ─── Column config ─────────────────────── */
const COLS = [
  { key: 'todo',       label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  { key: 'inprogress', label: 'In Progress',  color: '#2563eb', bg: 'rgba(37,99,235,0.06)'   },
  { key: 'completed',  label: 'Completed',    color: '#16a34a', bg: 'rgba(22,163,74,0.06)'   },
];

/* ─── Drag handle icon ──────────────────── */
const DragHandle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{opacity:0.3}}>
    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
  </svg>
);

/* ─── Single Task Card ──────────────────── */
function TaskCard({ task, onEdit, onDelete, overlay = false }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task._id, data: { status: task.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dl = formatDate(task.deadline);
  const initials = getInitials(task.assignedTo?.name || '');
  const gradient = getGradient(task.assignedTo?.name || '');

  return (
    <div
      ref={setNodeRef} style={style}
      className={`task-card ${overlay ? 'task-card-overlay' : ''} ${isDragging ? 'task-card-dragging' : ''}`}
    >
      <div className="task-card-drag" {...attributes} {...listeners}>
        <DragHandle />
      </div>
      <div className="task-card-inner" onClick={() => !overlay && onEdit(task)}>
        <div className="task-card-top">
          <span className={`badge badge-${task.priority}`}>{task.priority}</span>
          {task.comments?.length > 0 && (
            <span className="task-comment-count">
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
              {task.comments.length}
            </span>
          )}
        </div>

        <h4 className="task-card-title">{task.title}</h4>
        {task.description && <p className="task-card-desc">{task.description}</p>}

        {task.tags?.length > 0 && (
          <div className="task-tags">
            {task.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
        )}

        <div className="task-card-footer">
          {task.assignedTo ? (
            <div className="task-assignee">
              <div className="avatar avatar-sm" style={{ background: gradient }}>{initials}</div>
              <span>{task.assignedTo.name.split(' ')[0]}</span>
            </div>
          ) : (
            <span className="unassigned-label">Unassigned</span>
          )}
          <div className="task-footer-right">
            {dl && (
              <span className={`dl-chip ${dl.overdue ? 'dl-overdue' : dl.urgent ? 'dl-urgent' : ''}`}>
                <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                {dl.label}
              </span>
            )}
            <button className="task-del-btn" onClick={e => { e.stopPropagation(); onDelete(task._id); }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Kanban Column ─────────────────────── */
function KanbanColumn({ col, tasks, onEdit, onDelete, onAddTask }) {
  return (
    <div className="kanban-col">
      <div className="col-header" style={{ borderTopColor: col.color }}>
        <div className="col-header-left">
          <div className="col-dot" style={{ background: col.color }} />
          <span className="col-title">{col.label}</span>
          <span className="col-count">{tasks.length}</span>
        </div>
        <button className="col-add-btn" onClick={() => onAddTask(col.key)}
          title={`Add task to ${col.label}`}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <div className="col-body" style={{ background: col.bg }}>
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="col-empty">Drop tasks here</div>
          ) : (
            tasks.map(task => (
              <TaskCard key={task._id} task={task} onEdit={onEdit} onDelete={onDelete} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}

/* ─── Main ProjectPage ──────────────────── */
export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject]         = useState(null);
  const [tasks, setTasks]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMember, setFilterMember]     = useState('all');
  const [activeTask, setActiveTask]   = useState(null); // dragging
  const [editingTask, setEditingTask] = useState(null);
  const [newTaskStatus, setNewTaskStatus] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /* ─── Fetch data ──────────────── */
  const fetchAll = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(pRes.data.project);
      setTasks(tRes.data.tasks);
    } catch { navigate('/dashboard'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ─── Socket real-time ────────── */
  useProjectSocket(id, {
    onTaskCreated:  (task) => setTasks(prev => prev.some(t => t._id === task._id) ? prev : [task, ...prev]),
    onTaskUpdated:  (task) => setTasks(prev => prev.map(t => t._id === task._id ? task : t)),
    onTaskDeleted:  ({ taskId }) => setTasks(prev => prev.filter(t => t._id !== taskId)),
    onTaskReordered: () => { /* server already synced, no action needed */ },
    onMemberAdded:  (data) => setProject(prev => prev ? { ...prev, members: [...(prev.members||[]), data.member] } : prev),
  });

  /* ─── Filtered & grouped tasks ── */
  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchPrio   = filterPriority === 'all' || t.priority === filterPriority;
    const matchMember = filterMember === 'all' || (filterMember === 'me' ? t.assignedTo?._id === user?.id : t.assignedTo?._id === filterMember);
    return matchSearch && matchPrio && matchMember;
  });

  const byStatus = (status) => filtered.filter(t => t.status === status);

  /* ─── Drag & Drop ─────────────── */
  const handleDragStart = (event) => {
    setActiveTask(tasks.find(t => t._id === event.active.id) || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over || active.id === over.id) return;

    const draggedTask = tasks.find(t => t._id === active.id);
    if (!draggedTask) return;

    // Determine target column from over item or column droppable
    const overTask = tasks.find(t => t._id === over.id);
    const newStatus = overTask ? overTask.status : (over.id in ['todo','inprogress','completed'] ? over.id : draggedTask.status);

    // Reorder within same column or move across columns
    const sameStatus = overTask?.status || draggedTask.status;
    const colTasks = tasks.filter(t => t.status === sameStatus).map(t => t._id);
    const oldIdx = colTasks.indexOf(active.id);
    const newIdx = colTasks.indexOf(over.id);

    let newTasks = [...tasks];

    if (draggedTask.status !== sameStatus) {
      // Cross-column move
      newTasks = newTasks.map(t => t._id === active.id ? { ...t, status: sameStatus } : t);
    } else if (oldIdx !== -1 && newIdx !== -1) {
      // Same column reorder
      const reordered = arrayMove(colTasks, oldIdx, newIdx);
      newTasks = tasks.map(t => {
        const pos = reordered.indexOf(t._id);
        return pos !== -1 ? { ...t, position: pos } : t;
      });
    }

    setTasks(newTasks);

    // Persist to backend
    try {
      const updates = newTasks
        .filter(t => t.status === sameStatus)
        .map((t, pos) => ({ id: t._id, status: t.status, position: pos }));
      await api.put('/tasks/bulk/reorder', { updates });
    } catch { fetchAll(); } // revert on fail
  };

  /* ─── Task CRUD ───────────────── */
  const handleTaskSaved = (task, isEdit) => {
    setTasks(prev => isEdit ? prev.map(t => t._id === task._id ? task : t) : [task, ...prev]);
    setEditingTask(null);
    setNewTaskStatus(null);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch {}
    setConfirmDelete(null);
  };

  const handleDeleteProject = async () => {
    await api.delete(`/projects/${id}`);
    navigate('/dashboard');
  };

  /* ─── Loading state ───────────── */
  if (loading) return (
    <Layout>
      <div className="loading-center">
        <span className="spinner spinner-lg"/>
      </div>
    </Layout>
  );

  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const projectColor = project?.color || PROJECT_COLORS[0];

  return (
    <Layout>
      <div className="project-page fade-up">
        {/* ── Top header ── */}
        <div className="proj-page-header">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            All Projects
          </button>

          <div className="proj-page-title-row">
            <div className="proj-page-color-dot" style={{ background: projectColor }} />
            <div>
              <h1 className="proj-page-name">{project?.name}</h1>
              {project?.description && <p className="proj-page-desc">{project.description}</p>}
            </div>
          </div>

          {/* Progress bar */}
          <div className="proj-page-progress">
            <div className="pp-progress-track">
              <div className="pp-progress-fill" style={{ width: `${progress}%`, background: projectColor }} />
            </div>
            <span className="pp-progress-label">{progress}% complete · {completedCount}/{totalTasks} tasks</span>
          </div>

          {/* Action buttons */}
          <div className="proj-page-actions">
            {/* Members avatars */}
            <div className="header-members" onClick={() => setShowMembers(true)}>
              {project?.members?.slice(0, 4).map((m, i) => (
                <div key={m._id} className="avatar avatar-sm header-avatar"
                  style={{ background: getGradient(m.name), marginLeft: i > 0 ? -8 : 0, zIndex: 4 - i }}>
                  {getInitials(m.name)}
                </div>
              ))}
              {project?.members?.length > 4 && (
                <div className="avatar avatar-sm header-avatar" style={{ marginLeft: -8, background: 'var(--bg4)', color: 'var(--text2)' }}>
                  +{project.members.length - 4}
                </div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Invite
              </button>
            </div>

            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProject(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
              Edit
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete('project')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
              Delete
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setNewTaskStatus('todo')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Task
            </button>
          </div>
        </div>

        {/* ── Filters toolbar ── */}
        <div className="kanban-toolbar">
          <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input className="form-input search-input" placeholder="Search tasks…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 10px 8px 34px' }} />
          </div>

          <div className="toolbar-filters">
            <span className="filter-label">Priority:</span>
            {['all', 'high', 'medium', 'low'].map(p => (
              <button key={p} className={`filter-pill ${filterPriority === p ? 'active' : ''}`}
                onClick={() => setFilterPriority(p)}>
                {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="toolbar-filters">
            <span className="filter-label">Assignee:</span>
            <button className={`filter-pill ${filterMember === 'all' ? 'active' : ''}`} onClick={() => setFilterMember('all')}>All</button>
            <button className={`filter-pill ${filterMember === 'me' ? 'active' : ''}`} onClick={() => setFilterMember('me')}>Mine</button>
          </div>

          <span className="task-total-count">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* ── Kanban Board ── */}
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLS.map(col => (
              <KanbanColumn
                key={col.key} col={col}
                tasks={byStatus(col.key)}
                onEdit={setEditingTask}
                onDelete={(tid) => setConfirmDelete(tid)}
                onAddTask={(status) => setNewTaskStatus(status)}
              />
            ))}
          </div>

          {/* Drag overlay */}
          <DragOverlay dropAnimation={{ duration: 200 }}>
            {activeTask && (
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} overlay />
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ── Modals ── */}
      {(editingTask || newTaskStatus) && (
        <TaskModal
          task={editingTask}
          projectId={id}
          projectMembers={project?.members || []}
          onClose={() => { setEditingTask(null); setNewTaskStatus(null); }}
          onSaved={handleTaskSaved}
        />
      )}

      {showEditProject && (
        <ProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onCreated={(p) => { setProject(p); setShowEditProject(false); }}
        />
      )}

      {showMembers && (
        <MembersPanel
          project={project}
          currentUser={user}
          onClose={() => setShowMembers(false)}
          onUpdated={(p) => setProject(p)}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close" onClick={() => setConfirmDelete(null)}>×</button>
            </div>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              {confirmDelete === 'project'
                ? 'This will permanently delete the project and all its tasks. This cannot be undone.'
                : 'This will permanently delete this task. This cannot be undone.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() =>
                confirmDelete === 'project' ? handleDeleteProject() : handleDeleteTask(confirmDelete)
              }>Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
