import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, User, Mail, Lock, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-8, 8]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.role);
      toast.success('Account created! Welcome aboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient grid-overlay flex items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 1, height: Math.random() * 4 + 1,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            background: ['#6366f1', '#8b5cf6', '#ec4899'][i % 3],
            opacity: 0.5
          }}
          animate={{ y: [-30, 30, -30], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center pulse-glow">
              <Zap size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold font-['Space_Grotesk'] gradient-text">TaskFlow</span>
          </div>
          <p className="text-slate-400 text-sm">Join your team today</p>
        </motion.div>

        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-3xl p-8 card-shine relative"
        >
          <div className="absolute inset-0 rounded-3xl" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, transparent 50%, rgba(236,72,153,0.08) 100%)',
            pointerEvents: 'none'
          }} />

          <div style={{ transform: 'translateZ(20px)' }}>
            <h2 className="text-2xl font-bold text-white mb-1">Create account</h2>
            <p className="text-slate-400 text-sm mb-6">Start managing your team's tasks</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="John Doe"
                    required
                    className="input-glass w-full rounded-xl px-10 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                    className="input-glass w-full rounded-xl px-10 py-3 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    required
                    className="input-glass w-full rounded-xl px-10 py-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2 uppercase tracking-wider">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'admin', label: 'Admin', icon: Shield, desc: 'Full control' },
                    { value: 'member', label: 'Member', icon: Users, desc: 'Collaborate' }
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, role: value })}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                        form.role === value
                          ? 'border-indigo-500 bg-indigo-500/20 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <Icon size={16} className="mb-1" />
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-xs opacity-60">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full rounded-xl py-3 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Create account <ArrowRight size={16} /></>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
