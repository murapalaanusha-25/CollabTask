const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const emitToProject = (req, projectId, event, data) => {
  if (req.io) req.io.to(`project:${projectId}`).emit(event, data);
};

router.post('/', protect, async (req, res) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name required' });
    const project = await Project.create({ name, description, color: color || '#6366f1', createdBy: req.user._id, members: [req.user._id] });
    await project.populate('createdBy', 'name email');
    await project.populate('members', 'name email');
    res.status(201).json({ success: true, project });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ $or: [{ createdBy: req.user._id }, { members: req.user._id }] })
      .populate('createdBy', 'name email').populate('members', 'name email').sort({ createdAt: -1 });

    const withStats = await Promise.all(projects.map(async p => {
      const [total, completed, inprogress, todo] = await Promise.all([
        Task.countDocuments({ project: p._id }),
        Task.countDocuments({ project: p._id, status: 'completed' }),
        Task.countDocuments({ project: p._id, status: 'inprogress' }),
        Task.countDocuments({ project: p._id, status: 'todo' })
      ]);
      return { ...p.toObject(), stats: { total, completed, inprogress, todo } };
    }));
    res.json({ success: true, projects: withStats });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('createdBy', 'name email').populate('members', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, project });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('createdBy', 'name email').populate('members', 'name email');
    emitToProject(req, req.params.id, 'project:updated', updated);
    res.json({ success: true, project: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
    await Task.deleteMany({ project: req.params.id });
    await project.deleteOne();
    emitToProject(req, req.params.id, 'project:deleted', { projectId: req.params.id });
    res.json({ success: true, message: 'Project deleted' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Invite member by email
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    const isMember = project.members.includes(req.user._id) || project.createdBy.toString() === req.user._id.toString();
    if (!isMember) return res.status(403).json({ success: false, message: 'Not authorized' });
    const invitee = await User.findOne({ email: email.toLowerCase() });
    if (!invitee) return res.status(404).json({ success: false, message: 'No user found with that email' });
    if (project.members.includes(invitee._id)) return res.status(400).json({ success: false, message: 'User is already a member' });
    project.members.push(invitee._id);
    await project.save();

    // Notify invitee
    invitee.notifications.push({ type: 'member_added', message: `You were added to project "${project.name}" by ${req.user.name}`, link: `/project/${project._id}` });
    await invitee.save();

    // Emit via socket if online
    if (req.io) req.io.to(`user:${invitee._id}`).emit('notification:new', { message: `You were added to project "${project.name}"` });

    const updated = await Project.findById(req.params.id).populate('members', 'name email').populate('createdBy', 'name email');
    emitToProject(req, req.params.id, 'project:member_added', { member: { id: invitee._id, name: invitee.name, email: invitee.email } });
    res.json({ success: true, project: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// Remove member
router.delete('/:id/members/:userId', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    if (project.createdBy.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Only owner can remove members' });
    project.members = project.members.filter(m => m.toString() !== req.params.userId);
    await project.save();
    const updated = await Project.findById(req.params.id).populate('members', 'name email').populate('createdBy', 'name email');
    emitToProject(req, req.params.id, 'project:member_removed', { userId: req.params.userId });
    res.json({ success: true, project: updated });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
