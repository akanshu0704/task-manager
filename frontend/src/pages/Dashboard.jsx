import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckSquare, Clock, AlertTriangle, Flame, FolderKanban,
  TrendingUp, ArrowUpRight, Plus, Calendar
} from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

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
      className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-white/10 transition-all group cursor-pointer"
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
        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
          <span className="truncate">{task.project?.name}</span>
          {task.dueDate && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
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
      transition={{ delay: index * 0.08 }}
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
              <span>{project.members?.length + 1} member{project.members?.length !== 0 ? 's' : ''}</span>
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

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, critical: 0 });
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

  const completionRate = stats.total ? Math.round((stats.done / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • {stats.overdue > 0 ? `${stats.overdue} overdue task${stats.overdue !== 1 ? 's' : ''}` : 'All tasks on track'}
          </p>
        </div>
        <Link to="/tasks/new">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={16} /> New Task
          </motion.button>
        </Link>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="col-span-2 lg:col-span-3 xl:col-span-2">
          <StatCard label="Total Tasks" value={stats.total} icon={CheckSquare}
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

      {/* Completion progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-white font-semibold">Overall Progress</div>
            <div className="text-slate-400 text-xs">{stats.done} of {stats.total} tasks completed</div>
          </div>
          <div className="text-2xl font-bold gradient-text">{completionRate}%</div>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            className="h-full progress-bar rounded-full"
          />
        </div>
        <div className="flex gap-4 mt-3">
          {[
            { label: 'To Do', value: stats.todo, color: 'bg-slate-500' },
            { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-500' },
            { label: 'Review', value: stats.review || 0, color: 'bg-amber-500' },
            { label: 'Done', value: stats.done, color: 'bg-emerald-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              {label}: <span className="text-white font-medium">{value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <CheckSquare size={16} className="text-indigo-400" />
              Recent Tasks
            </div>
            <Link to="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No tasks yet. Create your first task!</p>
              <Link to="/tasks/new">
                <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">+ Add task</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => <TaskItem key={task._id} task={task} />)}
            </div>
          )}
        </motion.div>

        {/* Projects */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-white font-semibold flex items-center gap-2">
              <FolderKanban size={16} className="text-purple-400" />
              Active Projects
            </div>
            <Link to="/projects" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No projects yet. Create your first project!</p>
              <Link to="/projects">
                <button className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">+ New project</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {projects.map((project, i) => <ProjectCard key={project._id} project={project} index={i} />)}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
