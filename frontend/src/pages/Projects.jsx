import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderKanban, Plus, Search, Users, Calendar, Trash2,
  ChevronRight, X, Loader, AlertCircle, Settings
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PROJECT_COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444','#84cc16'];

function ProjectModal({ onClose, onSave, users }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', deadline: '', members: [] });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name required');
    setSaving(true);
    try {
      await onSave(form);
      onClose();
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">New Project</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Project Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="My Awesome Project"
              className="input-glass w-full rounded-xl px-4 py-3 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Brief project description..."
              rows={3}
              className="input-glass w-full rounded-xl px-4 py-3 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_COLORS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-8 h-8 rounded-lg transition-all"
                  style={{
                    background: c,
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    transform: form.color === c ? 'scale(1.15)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Deadline</label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm({ ...form, deadline: e.target.value })}
              className="input-glass w-full rounded-xl px-4 py-3 text-sm"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {users.length > 0 && (
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Add Members</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {users.map(u => (
                  <label key={u._id} className="flex items-center gap-3 p-2 glass rounded-xl cursor-pointer hover:bg-white/10">
                    <input
                      type="checkbox"
                      checked={form.members.includes(u._id)}
                      onChange={e => setForm({
                        ...form,
                        members: e.target.checked
                          ? [...form.members, u._id]
                          : form.members.filter(id => id !== u._id)
                      })}
                      className="accent-indigo-500"
                    />
                    <span className="text-sm text-slate-300">{u.name}</span>
                    <span className="text-xs text-slate-500 capitalize ml-auto">{u.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 glass py-2.5 rounded-xl text-slate-300 text-sm hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2">
              {saving ? <Loader size={14} className="animate-spin" /> : <><Plus size={14} /> Create</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, uRes] = await Promise.all([api.get('/projects'), api.get('/users')]);
        setProjects(pRes.data);
        setUsers(uRes.data.filter(u2 => u2._id !== user._id));
      } catch { toast.error('Failed to load projects'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleCreate = async (form) => {
    try {
      const res = await api.post('/projects', form);
      setProjects(prev => [res.data, ...prev]);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
      throw err;
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
  };

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="input-glass w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
            />
          </div>
          {user?.role === 'admin' && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowModal(true)}
              className="btn-primary text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={16} /> New Project
            </motion.button>
          )}
        </div>
      </div>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-64 glass rounded-3xl"
        >
          <FolderKanban size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 font-medium">
            {search ? 'No projects match your search' : 'No projects yet'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {!search && 'Create your first project to get started'}
          </p>
          {!search && user?.role === 'admin' && (
            <button onClick={() => setShowModal(true)} className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">
              + Create project
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4 }}
              className="card-3d card-shine glass rounded-2xl overflow-hidden group relative"
            >
              {/* Color bar */}
              <div className="h-1" style={{ background: project.color || '#6366f1' }} />

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
                    background: `${project.color || '#6366f1'}20`,
                    border: `1px solid ${project.color || '#6366f1'}40`
                  }}>
                    <FolderKanban size={18} style={{ color: project.color || '#6366f1' }} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.owner._id === user._id && (
                      <button
                        onClick={e => handleDelete(project._id, e)}
                        className="w-7 h-7 glass rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <Link to={`/projects/${project._id}`}>
                  <h3 className="text-white font-semibold text-base mb-1 hover:text-indigo-300 transition-colors truncate">
                    {project.name}
                  </h3>
                </Link>
                {project.description && (
                  <p className="text-slate-500 text-xs line-clamp-2 mb-3">{project.description}</p>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                  <div className="flex items-center gap-1">
                    <Users size={11} />
                    <span>{(project.members?.length || 0) + 1}</span>
                  </div>
                  {project.deadline && (
                    <div className="flex items-center gap-1">
                      <Calendar size={11} />
                      <span>{format(new Date(project.deadline), 'MMM d')}</span>
                    </div>
                  )}
                  <div className={`ml-auto px-2 py-0.5 rounded-full text-xs capitalize ${
                    project.status === 'active' ? 'status-in-progress' :
                    project.status === 'on-hold' ? 'status-review' : 'status-done'
                  }`}>
                    {project.status}
                  </div>
                </div>

                <Link to={`/projects/${project._id}`}>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
                    View project <ChevronRight size={14} className="ml-auto" />
                  </div>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && user?.role === 'admin' && (
          <ProjectModal
            onClose={() => setShowModal(false)}
            onSave={handleCreate}
            users={users}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
