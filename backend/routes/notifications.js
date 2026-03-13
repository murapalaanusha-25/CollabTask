const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const sorted = [...user.notifications].sort((a, b) => b.createdAt - a.createdAt);
    res.json({ success: true, notifications: sorted, unreadCount: sorted.filter(n => !n.read).length });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/read-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

router.put('/:notifId/read', protect, async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.user._id, 'notifications._id': req.params.notifId },
      { $set: { 'notifications.$.read': true } }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
