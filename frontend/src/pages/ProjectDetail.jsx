import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, Edit3, CheckSquare,
  Clock, AlertCircle, CheckCircle2, Filter, X, Loader, Users
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { id: 'todo', label: 'To Do', icon: CheckSquare, color: 'slate' },
  { id: 'in-progress', label: 'In Progress', icon: Clock, color: 'blue' },
  { id: 'review', label: 'Review', icon: AlertCircle, color: 'amber' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'emerald' },
];

const PRIORITY_COLORS = {
  low: 'text-emerald-400 bg-emerald-400/10',
  medium: 'text-blue-400 bg-blue-400/10',
  high: 'text-amber-400 bg-amber-400/10',
  critical: 'text-red-400 bg-red-400/10'
};

function TaskCard({ task, onDelete, onStatusChange, isAdmin, currentUserId }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="glass rounded-xl p-3 group card-shine cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-sm font-medium flex-1 ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
          {task.title}
        </p>
        {isAdmin && (
          <button
            onClick={() => onDelete(task._id)}
            className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${PRIORITY_COLORS[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
            <Clock size={10} />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
        {task.assignedTo && (
          <div className="ml-auto w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {task.assignedTo.name?.[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Quick status change — admin always, member only on their own task */}
      {(isAdmin || task.assignedTo?._id === currentUserId) && (
        <select
          value={task.status}
          onChange={e => onStatusChange(task._id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="mt-2 w-full text-xs input-glass rounded-lg px-2 py-1"
        >
          {STATUS_COLS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      )}
    </motion.div>
  );
}

function AddTaskModal({ projectId, users, onClose, onAdd }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium',
    status: 'todo', dueDate: '', assignedTo: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/tasks', {
        ...form,
        project: projectId,
        assignedTo: form.assignedTo || undefined
      });
      onAdd(res.data);
      onClose();
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="glass-dark rounded-3xl p-6 w-full max-w-md border border-white/10"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">Add Task</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Task title..."
              required
              className="input-glass w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Task description..."
              rows={2}
              className="input-glass w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
              >
                {['low', 'medium', 'high', 'critical'].map(p => (
                  <option key={p} value={p} className="bg-slate-900 capitalize">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
              >
                {STATUS_COLS.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Assign To</label>
              <select
                value={form.assignedTo}
                onChange={e => setForm({ ...form, assignedTo: e.target.value })}
                className="input-glass w-full rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="" className="bg-slate-900">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id} className="bg-slate-900">{u.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 glass py-2.5 rounded-xl text-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin" /> : <><Plus size={14} /> Add Task</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, tRes, uRes] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/tasks?project=${id}`),
          api.get('/users')
        ]);
        setProject(pRes.data);
        setTasks(tRes.data);
        setUsers(uRes.data);
      } catch {
        toast.error('Failed to load project');
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/projects">
          <motion.button whileHover={{ x: -2 }} className="mt-1 text-slate-500 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </motion.button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-4 h-4 rounded-full" style={{ background: project.color || '#6366f1' }} />
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              project.status === 'active' ? 'status-in-progress' :
              project.status === 'on-hold' ? 'status-review' : 'status-done'
            }`}>{project.status}</span>
          </div>
          {project.description && <p className="text-slate-400 text-sm">{project.description}</p>}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Users size={11} /> {(project.members?.length || 0) + 1} members
            </span>
            {project.deadline && (
              <span>Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>
            )}
            <span>{tasks.length} tasks · {tasks.filter(t => t.status === 'done').length} done</span>
          </div>
        </div>
        {user?.role === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddTask(true)}
            className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
          >
            <Plus size={16} /> Add Task
          </motion.button>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
        {STATUS_COLS.map(({ id: colId, label, icon: Icon, color }) => (
          <div key={colId} className="min-w-0">
            <div className={`glass rounded-2xl p-4 border border-white/5`}>
              <div className={`flex items-center gap-2 mb-3`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-${color}-500/20`}>
                  <Icon size={14} className={`text-${color}-400`} />
                </div>
                <span className="text-sm font-semibold text-white">{label}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full bg-${color}-500/20 text-${color}-400`}>
                  {tasksByStatus[colId]?.length || 0}
                </span>
              </div>

              <div className="space-y-2 min-h-[80px]">
                <AnimatePresence mode="popLayout">
                  {tasksByStatus[colId]?.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onDelete={handleDeleteTask}
                      onStatusChange={handleStatusChange}
                      isAdmin={user?.role === 'admin'}
                      currentUserId={user?._id || user?.id}
                    />
                  ))}
                </AnimatePresence>

                {tasksByStatus[colId]?.length === 0 && (
                  <div className="text-center py-6 text-slate-700 text-xs">
                    No {label.toLowerCase()} tasks
                  </div>
                )}
              </div>

              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowAddTask(true)}
                  className="mt-3 w-full py-2 text-xs text-slate-600 hover:text-slate-400 flex items-center justify-center gap-1 rounded-xl hover:bg-white/5 transition-all"
                >
                  <Plus size={12} /> Add task
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddTask && user?.role === 'admin' && (
          <AddTaskModal
            projectId={id}
            users={users}
            onClose={() => setShowAddTask(false)}
            onAdd={task => setTasks(prev => [task, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
