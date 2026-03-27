import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Leaf, Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  emoji: ['🍎', '🥦', '🍞', '🍕', '🥗', '🍊', '🥕', '🌽', '🍇', '🥑'][i % 10],
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 18 + Math.random() * 20,
  delay: Math.random() * 6,
  duration: 8 + Math.random() * 8,
}));

const DEMO = [
  { label: 'Donor', emoji: '🍽️', email: 'donor@demo.com', password: 'donor123' },
  { label: 'NGO', emoji: '🏥', email: 'ngo@demo.com', password: 'ngo123' },
  { label: 'Admin', emoji: '🛡️', email: 'admin@demo.com', password: 'admin123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}! 🎉`);
      navigate(user.role === 'donor' ? '/donor' : user.role === 'ngo' ? '/ngo' : '/admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="auth-root">
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        <div className="auth-grid" />
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="auth-particle"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      <div className={`auth-container ${mounted ? 'auth-mounted' : ''}`}>
        {/* Left panel - branding */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo-wrap">
              <div className="auth-logo-ring" />
              <div className="auth-logo-inner">
                <Leaf size={36} className="auth-logo-icon" />
              </div>
            </div>
            <h1 className="auth-brand-name">HashItOut</h1>
            <p className="auth-brand-tagline">Intelligent Food Redistribution Platform</p>
          </div>

          <div className="auth-stats-row">
            {[
              { num: '2.4K+', label: 'Meals Saved' },
              { num: '180+', label: 'NGO Partners' },
              { num: '94%', label: 'Less Waste' },
            ].map((s, i) => (
              <div key={i} className="auth-stat">
                <span className="auth-stat-num">{s.num}</span>
                <span className="auth-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-left-badges">
            {['Zero Hunger', 'Real-time Tracking', 'Smart Matching'].map((b, i) => (
              <span key={i} className="auth-badge">
                <Sparkles size={11} />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right panel - form */}
        <div className="auth-right">
          <div className="auth-form-card">
            <div className="auth-form-header">
              <h2 className="auth-form-title">Welcome back</h2>
              <p className="auth-form-sub">Sign in to continue your mission</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Email */}
              <div className={`auth-field ${focused.email || form.email ? 'auth-field-active' : ''}`}>
                <Mail size={17} className="auth-field-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onFocus={() => setFocused(f => ({ ...f, email: true }))}
                  onBlur={() => setFocused(f => ({ ...f, email: false }))}
                  required
                  autoComplete="email"
                />
                <label className="auth-floating-label">Email Address</label>
              </div>

              {/* Password */}
              <div className={`auth-field ${focused.password || form.password ? 'auth-field-active' : ''}`}>
                <Lock size={17} className="auth-field-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={() => setFocused(f => ({ ...f, password: true }))}
                  onBlur={() => setFocused(f => ({ ...f, password: false }))}
                  required
                  autoComplete="current-password"
                />
                <label className="auth-floating-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="auth-submit-btn"
              >
                {loading ? (
                  <div className="auth-spinner" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} className="auth-btn-arrow" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>or try a demo account</span>
            </div>

            <div className="auth-demo-row">
              {DEMO.map(d => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => fillDemo(d)}
                  className="auth-demo-chip"
                  title={`${d.email} / ${d.password}`}
                >
                  <span>{d.emoji}</span>
                  {d.label}
                </button>
              ))}
            </div>

            <p className="auth-switch-link">
              Don't have an account?{' '}
              <Link to="/register">Create account →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
