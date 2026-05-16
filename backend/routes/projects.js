const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects
router.get('/', auth, async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? {}  // Admin sees all projects
      : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, color, deadline, members } = req.body;
    if (!name) return res.status(400).json({ message: 'Project name required' });

    const project = await Project.create({
      name, description, color, deadline,
      owner: req.user._id,
      members: members || []
    });

    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/projects/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.owner._id.equals(req.user._id) ||
      project.members.some(m => m._id.equals(req.user._id));
    if (!isMember && req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only owner can update' });
    }

    const { name, description, status, color, deadline, members } = req.body;
    Object.assign(project, { name, description, status, color, deadline, members });
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only owner can delete' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id });
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      review: tasks.filter(t => t.status === 'review').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
