import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, CheckSquare, Users,
  LogOut, Zap, Menu, X, ChevronRight, Bell, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/tasks', icon: CheckSquare, label: 'My Tasks' },
  { path: '/team', icon: Users, label: 'Team' },
];

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const getAvatarColor = (name = '') => {
  const colors = ['from-indigo-500 to-purple-600', 'from-pink-500 to-rose-600', 'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600', 'from-sky-500 to-blue-600'];
  return colors[name.charCodeAt(0) % colors.length];
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Background orbs */}
      <div className="orb orb-1 opacity-10" />
      <div className="orb orb-2 opacity-10" />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed lg:relative lg:translate-x-0 z-30 w-64 h-full flex flex-col glass-dark border-r border-white/5"
        style={{ transition: 'transform 0.3s ease' }}
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center pulse-glow flex-shrink-0">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold gradient-text font-['Space_Grotesk']">TaskFlow</span>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs text-slate-600 uppercase tracking-widest font-medium mb-3 px-3">Menu</div>
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
            return (
              <Link key={path} to={path} onClick={() => setSidebarOpen(false)}>
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'active text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-indigo-500/30' : 'bg-white/5'
                  }`}>
                    <Icon size={16} className={active ? 'text-indigo-400' : ''} />
                  </div>
                  {label}
                  {active && <ChevronRight size={14} className="ml-auto text-indigo-400" />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-white/5">
          <div className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="glass-dark border-b border-white/5 px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1">
            <div className="text-slate-500 text-xs capitalize">
              {navItems.find(n => location.pathname.startsWith(n.path))?.label || 'TaskFlow'}
            </div>
            <h1 className="text-white font-semibold text-lg leading-tight">
              {navItems.find(n => location.pathname === n.path || (n.path !== '/dashboard' && location.pathname.startsWith(n.path)))?.label || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={16} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 glass rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <Settings size={16} />
            </motion.button>
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name)} flex items-center justify-center text-xs font-bold text-white cursor-pointer`}>
              {getInitials(user?.name)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
