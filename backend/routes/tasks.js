const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const hasProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.owner.equals(userId) || project.members.some(m => m.equals(userId));
};

// GET /api/tasks/dashboard/stats  ← MUST be before /:id
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const now = new Date();

    if (req.user.role === 'admin') {
      const [allTasks, allUsers] = await Promise.all([
        Task.find().populate('assignedTo', 'name email'),
        User.find().select('name email')
      ]);

      const userStats = allUsers.map(u => {
        const userTasks = allTasks.filter(t => t.assignedTo?._id.equals(u._id));
        return {
          _id: u._id,
          name: u.name,
          email: u.email,
          total: userTasks.length,
          done: userTasks.filter(t => t.status === 'done').length,
          inProgress: userTasks.filter(t => t.status === 'in-progress').length,
          overdue: userTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
        };
      });

      return res.json({
        total: allTasks.length,
        todo: allTasks.filter(t => t.status === 'todo').length,
        inProgress: allTasks.filter(t => t.status === 'in-progress').length,
        review: allTasks.filter(t => t.status === 'review').length,
        done: allTasks.filter(t => t.status === 'done').length,
        overdue: allTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
        critical: allTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length,
        totalUsers: allUsers.length,
        userStats,
      });
    }

    // Member: only their assigned tasks
    const myTasks = await Task.find({ assignedTo: req.user._id });
    res.json({
      total: myTasks.length,
      todo: myTasks.filter(t => t.status === 'todo').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      review: myTasks.filter(t => t.status === 'review').length,
      done: myTasks.filter(t => t.status === 'done').length,
      overdue: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      critical: myTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tasks
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      filter.project = req.query.project;
    } else if (req.user.role !== 'admin') {
      // Members only see their assigned tasks when no project filter
      filter.assignedTo = req.user._id;
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    // Admin can explicitly filter by assignee
    if (req.user.role === 'admin' && req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

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
    let { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;
    if (!title || !project) return res.status(400).json({ message: 'Title and project required' });

    const access = await hasProjectAccess(project, req.user._id);
    if (!access && req.user.role !== 'admin') return res.status(403).json({ message: 'No access to this project' });

    // Members can only assign to themselves
    if (req.user.role !== 'admin' && assignedTo && assignedTo !== req.user._id.toString()) {
      assignedTo = req.user._id;
    }

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

    // Members can only update tasks assigned to them or created by them
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo?.equals(req.user._id);
      const isCreator = task.createdBy?.equals(req.user._id);
      if (!isAssigned && !isCreator) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    }

    const body = req.body;
    const adminFields = ['title', 'description', 'assignedTo', 'status', 'priority', 'dueDate', 'tags'];
    const memberFields = ['title', 'description', 'status', 'priority', 'dueDate', 'tags'];
    const allowed = req.user.role === 'admin' ? adminFields : memberFields;

    // Only apply fields that were explicitly sent in the request body
    for (const field of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        task[field] = body[field];
      }
    }
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

module.exports = router;
