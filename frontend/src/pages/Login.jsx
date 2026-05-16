import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const FloatingOrb = ({ size, color, style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size, height: size,
      background: `radial-gradient(circle, ${color}, transparent 70%)`,
      filter: 'blur(60px)',
      opacity: 0.3,
      ...style
    }}
  />
);

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-300, 300], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-300, 300], [-10, 10]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient grid-overlay flex items-center justify-center p-4 relative overflow-hidden">
      <FloatingOrb size="600px" color="#6366f1" style={{ top: '-200px', left: '-200px' }} />
      <FloatingOrb size="500px" color="#8b5cf6" style={{ bottom: '-150px', right: '-150px' }} />
      <FloatingOrb size="300px" color="#ec4899" style={{ top: '40%', right: '20%' }} />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-indigo-400"
          style={{ left: `${10 + i * 15}%`, top: `${20 + (i % 3) * 25}%`, opacity: 0.4 }}
          animate={{ y: [-20, 20, -20], opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
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
          <p className="text-slate-400 text-sm">Team collaboration reimagined</p>
        </motion.div>

        {/* 3D Card */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass rounded-3xl p-8 card-shine"
        >
          {/* Inner glow border */}
          <div className="absolute inset-0 rounded-3xl" style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, transparent 50%, rgba(139,92,246,0.1) 100%)',
            pointerEvents: 'none'
          }} />

          <div style={{ transform: 'translateZ(20px)' }}>
            <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="••••••••"
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

              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className="btn-primary w-full rounded-xl py-3 text-white font-semibold text-sm flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Sign in <ArrowRight size={16} /></>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Demo credentials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 glass rounded-2xl p-4 text-center"
        >
          <p className="text-xs text-slate-500">
            Create an account to get started • Role-based access: Admin / Member
          </p>
        </motion.div>
      </div>
    </div>
  );
}
