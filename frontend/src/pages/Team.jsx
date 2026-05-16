import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Shield, UserCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-sky-500 to-blue-600',
  'from-violet-500 to-purple-600',
];

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const getGradient = (name = '') => AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-slate-400 text-sm">{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="input-glass w-full rounded-xl pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Members', value: users.length, icon: Users, color: 'text-indigo-400' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, icon: Shield, color: 'text-purple-400' },
          { label: 'Members', value: users.filter(u => u.role === 'member').length, icon: UserCheck, color: 'text-emerald-400' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-4 flex items-center gap-3"
          >
            <div className={`w-9 h-9 rounded-xl glass flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Members grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 glass rounded-3xl">
          <Users size={40} className="text-slate-700 mb-3" />
          <p className="text-slate-400">No members found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member, i) => (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className="card-3d card-shine glass rounded-2xl p-5 relative overflow-hidden"
            >
              {/* Badge for current user */}
              {member._id === user._id && (
                <div className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  You
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(member.name)} flex items-center justify-center text-lg font-bold text-white shadow-lg flex-shrink-0`}>
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{member.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {member.role === 'admin' ? (
                      <Shield size={11} className="text-purple-400" />
                    ) : (
                      <UserCheck size={11} className="text-emerald-400" />
                    )}
                    <span className={`text-xs capitalize ${member.role === 'admin' ? 'text-purple-400' : 'text-emerald-400'}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail size={11} className="text-slate-600 flex-shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Joined {format(new Date(member.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
