const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');

const hasProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.owner.equals(userId) || project.members.some(m => m.equals(userId));
};

// GET /api/tasks?project=id
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project required' });

    const access = await hasProjectAccess(project, req.user._id);
    if (!access) return res.status(403).json({ message: 'No access to this project' });

    const task = await Task.create({
      title, description, project, assignedTo, status, priority, dueDate, tags,
      createdBy: req.user._id
    });

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color');
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, assignedTo, status, priority, dueDate, tags } = req.body;
    Object.assign(task, { title, description, assignedTo, status, priority, dueDate, tags });
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const canDelete = task.createdBy.equals(req.user._id) ||
      (project && project.owner.equals(req.user._id)) ||
      req.user.role === 'admin';
    if (!canDelete) return res.status(403).json({ message: 'Not authorized' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks/dashboard/stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const allTasks = await Task.find()
      .populate('project', 'name owner members');

    const myTasks = allTasks.filter(t => {
      const p = t.project;
      if (!p) return false;
      return p.owner?.equals?.(req.user._id) ||
        p.members?.some(m => m.equals?.(req.user._id)) ||
        t.assignedTo?.equals?.(req.user._id);
    });

    const now = new Date();
    res.json({
      total: myTasks.length,
      todo: myTasks.filter(t => t.status === 'todo').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      done: myTasks.filter(t => t.status === 'done').length,
      overdue: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      critical: myTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
