const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const populateTask = (q) => q.populate('assignedTo', 'name email').populate('createdBy', 'name email').populate('comments.author', 'name email');
const emit = (req, projectId, event, data) => { if (req.io) req.io.to(`project:${projectId}`).emit(event, data); };

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, deadline, tags } = req.body;
    if (!title || !project) return res.status(400).json({ success: false, message: 'Title and project required' });

    const task = await Task.create({
      title, description, project, assignedTo: assignedTo || null,
      status: status || 'todo', priority: priority || 'medium',
      deadline: deadline || null, tags: tags || [], createdBy: req.user._id,
      activity: [{ type: 'created', message: `Task created by ${req.user.name}`, by: req.user._id }]
    });

    await populateTask(Task.findById(task._id)).then(async t => {
      emit(req, project, 'task:created', t);

      // Notify assigned user
      if (assignedTo && assignedTo !== req.user._id.toString()) {
        const assignee = await User.findById(assignedTo);
        if (assignee) {
          assignee.notifications.push({ type: 'task_assigned', message: `You were assigned "${title}"`, link: `/project/${project}` });
          await assignee.save();
          if (req.io) req.io.to(`user:${assignedTo}`).emit('notification:new', { message: `You were assigned "${title}"`, unread: true });
        }
      }
    });

    const populated = await populateTask(Task.findById(task._id));
    res.status(201).json({ success: true, task: populated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/', protect, async (req, res) => {
  try {
    const { project, assignedTo, status, priority, search } = req.query;
    const filter = {};
    if (project) filter.project = project;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) filter.$or = [{ title: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }];
    const tasks = await populateTask(Task.find(filter).sort({ position: 1, createdAt: -1 }));
    res.json({ success: true, tasks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });

    const changes = [];
    if (req.body.status && req.body.status !== task.status) changes.push({ type: 'status_changed', message: `Status changed from ${task.status} to ${req.body.status} by ${req.user.name}`, by: req.user._id });
    if (req.body.assignedTo && req.body.assignedTo !== (task.assignedTo?.toString())) changes.push({ type: 'assigned', message: `Task reassigned by ${req.user.name}`, by: req.user._id });

    const updated = await populateTask(Task.findByIdAndUpdate(req.params.id, {
      ...req.body,
      $push: changes.length ? { activity: { $each: changes } } : undefined
    }, { new: true }));

    emit(req, task.project.toString(), 'task:updated', updated);

    // Notify new assignee
    if (req.body.assignedTo && req.body.assignedTo !== task.assignedTo?.toString() && req.body.assignedTo !== req.user._id.toString()) {
      const assignee = await User.findById(req.body.assignedTo);
      if (assignee) {
        assignee.notifications.push({ type: 'task_assigned', message: `You were assigned "${task.title}"`, link: `/project/${task.project}` });
        await assignee.save();
        if (req.io) req.io.to(`user:${req.body.assignedTo}`).emit('notification:new', { message: `You were assigned "${task.title}"` });
      }
    }

    res.json({ success: true, task: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    const projectId = task.project.toString();
    await task.deleteOne();
    emit(req, projectId, 'task:deleted', { taskId: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Add comment
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    task.comments.push({ text: text.trim(), author: req.user._id });
    task.activity.push({ type: 'comment', message: `${req.user.name} added a comment`, by: req.user._id });
    await task.save();
    const updated = await populateTask(Task.findById(req.params.id));
    emit(req, task.project.toString(), 'task:updated', updated);
    res.json({ success: true, task: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Delete comment
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Not found' });
    task.comments = task.comments.filter(c => c._id.toString() !== req.params.commentId);
    await task.save();
    const updated = await populateTask(Task.findById(req.params.id));
    emit(req, task.project.toString(), 'task:updated', updated);
    res.json({ success: true, task: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Bulk reorder
router.put('/bulk/reorder', protect, async (req, res) => {
  try {
    const { updates } = req.body; // [{id, status, position}]
    await Promise.all(updates.map(u => Task.findByIdAndUpdate(u.id, { status: u.status, position: u.position })));
    if (req.io && updates[0]) {
      const task = await Task.findById(updates[0].id);
      if (task) emit(req, task.project.toString(), 'task:reordered', { updates });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Stats for dashboard
router.get('/stats/me', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    const [total, completed, inprogress, todo, overdue] = await Promise.all([
      Task.countDocuments({ assignedTo: uid }),
      Task.countDocuments({ assignedTo: uid, status: 'completed' }),
      Task.countDocuments({ assignedTo: uid, status: 'inprogress' }),
      Task.countDocuments({ assignedTo: uid, status: 'todo' }),
      Task.countDocuments({ assignedTo: uid, status: { $ne: 'completed' }, deadline: { $lt: new Date() } })
    ]);
    res.json({ success: true, stats: { total, completed, inprogress, todo, overdue } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
