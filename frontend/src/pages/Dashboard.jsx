import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, Flame, FolderKanban,
  TrendingUp, ArrowUpRight, Plus, Calendar, Users, Shield,
  UserCheck, BarChart3
} from 'lucide-react';
import { format, isBefore } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

// ─── Shared sub-components ───────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, gradient, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -4, scale: 1.01 }}
    className="card-3d card-shine glass rounded-2xl p-5 cursor-default relative overflow-hidden"
  >
    <div className="absolute inset-0 opacity-10" style={{ background: gradient }} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <ArrowUpRight size={14} className="text-slate-600" />
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  </motion.div>
);

const TaskItem = ({ task }) => {
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== 'done';
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-all cursor-pointer"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        task.status === 'done' ? 'bg-emerald-400' :
        task.status === 'in-progress' ? 'bg-blue-400' :
        task.status === 'review' ? 'bg-amber-400' : 'bg-slate-500'
      }`} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
          {task.title}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="truncate">{task.project?.name}</span>
          {task.assignedTo && <span className="text-slate-600">→ {task.assignedTo.name}</span>}
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : ''}`}>
              <Calendar size={10} />
              {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 priority-${task.priority}`}>
        {task.priority}
      </span>
    </motion.div>
  );
};

const ProjectCard = ({ project, index }) => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
  const color = project.color || colors[index % colors.length];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="card-3d card-shine glass rounded-2xl p-4 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: color }} />
      <Link to={`/projects/${project._id}`} className="block">
        <div className="flex items-start gap-3 mt-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}25`, border: `1px solid ${color}40` }}>
            <FolderKanban size={14} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{project.name}</div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <span>{(project.members?.length || 0) + 1} member{project.members?.length !== 0 ? 's' : ''}</span>
              <span>•</span>
              <span className={`capitalize ${
                project.status === 'active' ? 'text-emerald-400' :
                project.status === 'on-hold' ? 'text-amber-400' : 'text-blue-400'
              }`}>{project.status}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ProgressBar = ({ done, total, delay = 0.5 }) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{done}/{total} tasks done</span>
        <span className="text-sm font-bold gradient-text">{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className="h-full progress-bar rounded-full"
        />
      </div>
    </div>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600', 'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-600', 'from-sky-500 to-blue-600',
];
const getGradient = (name = '') => AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

function AdminDashboard({ user, stats, recentTasks, projects }) {
  const completionRate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={22} className="text-purple-400" />
            Admin Dashboard
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • {stats.totalUsers || 0} team members
          </p>
        </div>
        <Link to="/tasks/new">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={16} /> New Task
          </motion.button>
        </Link>
      </motion.div>

      {/* Team stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Team Members" value={stats.totalUsers || 0} icon={Users}
          color="bg-purple-500/30" gradient="linear-gradient(135deg, #a855f7, transparent)" delay={0.05} />
        <StatCard label="Total Tasks" value={stats.total} icon={CheckSquare}
          color="bg-indigo-500/30" gradient="linear-gradient(135deg, #6366f1, transparent)" delay={0.1} />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock}
          color="bg-blue-500/30" gradient="linear-gradient(135deg, #3b82f6, transparent)" delay={0.15} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle}
          color="bg-red-500/30" gradient="linear-gradient(135deg, #ef4444, transparent)" delay={0.2} />
      </div>

      {/* Team progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-white font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" /> Team Progress
            </div>
            <div className="text-slate-400 text-xs mt-0.5">{stats.done} of {stats.total} tasks completed across the team</div>
          </div>
          <div className="text-2xl font-bold gradient-text">{completionRate}%</div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="h-full progress-bar rounded-full" />
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { label: 'To Do', value: stats.todo, color: 'bg-slate-500' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500' },
            { label: 'Review', value: stats.review || 0, color: 'bg-amber-500' },
            { label: 'Done', value: stats.done, color: 'bg-emerald-500' },
            { label: 'Critical', value: stats.critical, color: 'bg-red-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${color}`} /> {label}: <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* User performance */}
      {stats.userStats?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5">
          <div className="text-white font-semibold flex items-center gap-2 mb-4">
            <Users size={16} className="text-purple-400" /> Member Performance
          </div>
          <div className="space-y-3">
            {stats.userStats.filter(u => u.total > 0 || true).map((u, i) => (
              <motion.div key={u._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-4 p-3 glass rounded-xl">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getGradient(u.name)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                  {getInitials(u.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{u.name}</div>
                  <ProgressBar done={u.done} total={u.total} delay={0.1 + i * 0.05} />
                </div>
                <div className="flex gap-3 text-xs text-slate-400 flex-shrink-0 text-right">
                  <div><span className="text-white font-semibold">{u.total}</span><br />total</div>
                  <div><span className="text-emerald-400 font-semibold">{u.done}</span><br />done</div>
                  {u.overdue > 0 && <div><span className="text-red-400 font-semibold">{u.overdue}</span><br />overdue</div>}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent tasks + Projects */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-400" /> Recent Tasks
            </div>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-2">{recentTasks.map(t => <TaskItem key={t._id} task={t} />)}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <FolderKanban size={16} className="text-purple-400" /> All Projects
            </div>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p, i) => <ProjectCard key={p._id} project={p} index={i} />)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Member Dashboard ─────────────────────────────────────────────────────────

function MemberDashboard({ user, stats, recentTasks, projects }) {
  const completionRate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} •{' '}
            {stats.overdue > 0 ? `${stats.overdue} overdue task${stats.overdue !== 1 ? 's' : ''}` : 'All your tasks on track'}
          </p>
        </div>
        <Link to="/tasks/new">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus size={16} /> New Task
          </motion.button>
        </Link>
      </motion.div>

      {/* My stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="col-span-2 lg:col-span-3 xl:col-span-2">
          <StatCard label="My Tasks" value={stats.total} icon={UserCheck}
            color="bg-indigo-500/30" gradient="linear-gradient(135deg, #6366f1, transparent)" delay={0.05} />
        </div>
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock}
          color="bg-blue-500/30" gradient="linear-gradient(135deg, #3b82f6, transparent)" delay={0.1} />
        <StatCard label="Completed" value={stats.done} icon={TrendingUp}
          color="bg-emerald-500/30" gradient="linear-gradient(135deg, #10b981, transparent)" delay={0.15} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle}
          color="bg-red-500/30" gradient="linear-gradient(135deg, #ef4444, transparent)" delay={0.2} />
        <StatCard label="Critical" value={stats.critical} icon={Flame}
          color="bg-orange-500/30" gradient="linear-gradient(135deg, #f97316, transparent)" delay={0.25} />
      </div>

      {/* My progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white font-semibold">My Progress</div>
            <div className="text-slate-400 text-xs">{stats.done} of {stats.total} tasks completed</div>
          </div>
          <div className="text-2xl font-bold gradient-text">{completionRate}%</div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="h-full progress-bar rounded-full" />
        </div>
        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { label: 'To Do', value: stats.todo, color: 'bg-slate-500' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500' },
            { label: 'Review', value: stats.review || 0, color: 'bg-amber-500' },
            { label: 'Done', value: stats.done, color: 'bg-emerald-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${color}`} /> {label}: <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-400" /> My Recent Tasks
            </div>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks assigned to you yet.</p>
              <Link to="/tasks/new">
                <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">+ Add task</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">{recentTasks.map(t => <TaskItem key={t._id} task={t} />)}</div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <FolderKanban size={16} className="text-purple-400" /> My Projects
            </div>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">You're not in any projects yet.</p>
              <Link to="/projects">
                <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">+ New project</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p, i) => <ProjectCard key={p._id} project={p} index={i} />)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Main Dashboard (router) ──────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, review: 0, done: 0, overdue: 0, critical: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes, projectsRes] = await Promise.all([
          api.get('/tasks/dashboard/stats'),
          api.get('/tasks'),
          api.get('/projects')
        ]);
        setStats(statsRes.data);
        setRecentTasks(tasksRes.data.slice(0, 6));
        setProjects(projectsRes.data.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} stats={stats} recentTasks={recentTasks} projects={projects} />;
  }
  return <MemberDashboard user={user} stats={stats} recentTasks={recentTasks} projects={projects} />;
}
