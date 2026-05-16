import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Plus, Search, Filter, Trash2, Clock,
  AlertTriangle, X, Loader, Calendar, Tag, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['all', 'todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['all', 'low', 'medium', 'high', 'critical'];

const statusLabel = { 'all': 'All', 'todo': 'To Do', 'in-progress': 'In Progress', 'review': 'Review', 'done': 'Done' };

function NewTaskModal({ projects, users, onClose, onAdd }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', project: '',
    priority: 'medium', status: 'todo', dueDate: '', assignedTo: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error('Please select a project');
    setSaving(true);
    try {
      const res = await api.post('/tasks', {
        ...form,
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
        className="glass-dark rounded-3xl p-6 w-full max-w-lg border border-white/10"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">New Task</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="What needs to be done?"
              required
              className="input-glass w-full rounded-xl px-4 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Additional details..."
              rows={2}
              className="input-glass w-full rounded-xl px-4 py-2.5 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1.5">Project *</label>
            <select
              value={form.project}
              onChange={e => setForm({ ...form, project: e.target.value })}
              className="input-glass w-full rounded-xl px-4 py-2.5 text-sm"
              required
            >
              <option value="" className="bg-slate-900">Select project...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-slate-900">{p.name}</option>
              ))}
            </select>
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
                <option value="todo" className="bg-slate-900">To Do</option>
                <option value="in-progress" className="bg-slate-900">In Progress</option>
                <option value="review" className="bg-slate-900">Review</option>
                <option value="done" className="bg-slate-900">Done</option>
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
              {saving ? <Loader size={14} className="animate-spin" /> : <><Plus size={14} /> Create Task</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tRes, pRes, uRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/projects'),
          api.get('/users')
        ]);
        setTasks(tRes.data);
        setProjects(pRes.data);
        setUsers(uRes.data);
      } catch { toast.error('Failed to load tasks'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
    } catch { toast.error('Failed to update'); }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-slate-400 text-sm">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="input-glass w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="input-glass rounded-xl px-3 py-2.5 text-sm"
          >
            {STATUSES.map(s => (
              <option key={s} value={s} className="bg-slate-900">{statusLabel[s] || s}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="input-glass rounded-xl px-3 py-2.5 text-sm capitalize"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p} className="bg-slate-900 capitalize">{p === 'all' ? 'All Priority' : p}</option>
            ))}
          </select>
          {user?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> New Task
            </motion.button>
          )}
        </div>
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 glass rounded-3xl"
        >
          <CheckSquare size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-600 text-sm mt-1">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : user?.role === 'admin' ? 'Create your first task to get started' : 'No tasks assigned to you yet'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((task, i) => {
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
              return (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ x: 2 }}
                  className="glass rounded-2xl p-4 flex items-center gap-4 group card-shine"
                >
                  {/* Status dot */}
                  <button
                    onClick={() => handleStatusChange(task._id, task.status === 'done' ? 'todo' : 'done')}
                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                      task.status === 'done'
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {task.status === 'done' && (
                      <svg viewBox="0 0 14 14" className="w-full h-full p-0.5">
                        <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
                        {task.title}
                      </span>
                      {isOverdue && <AlertTriangle size={12} className="text-red-400 flex-shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      {task.project && (
                        <span className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: task.project.color || '#6366f1' }} />
                          {task.project.name}
                        </span>
                      )}
                      {task.assignedTo && <span>→ {task.assignedTo.name}</span>}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
                          <Calendar size={10} />
                          {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full priority-${task.priority}`}>
                      {task.priority}
                    </span>
                    <select
                      value={task.status}
                      onChange={e => handleStatusChange(task._id, e.target.value)}
                      className="input-glass text-xs rounded-lg px-2 py-1 hidden sm:block"
                    >
                      <option value="todo" className="bg-slate-900">To Do</option>
                      <option value="in-progress" className="bg-slate-900">In Progress</option>
                      <option value="review" className="bg-slate-900">Review</option>
                      <option value="done" className="bg-slate-900">Done</option>
                    </select>
                    {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDelete(task._id)}
                        className="w-7 h-7 glass rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <NewTaskModal
            projects={projects}
            users={users}
            onClose={() => setShowModal(false)}
            onAdd={task => setTasks(prev => [task, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
