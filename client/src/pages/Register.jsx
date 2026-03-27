import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
  Leaf, Eye, EyeOff, User, Mail, Lock, Phone,
  Building2, MapPin, Navigation, ChevronRight, ChevronLeft,
  Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  {
    value: 'donor',
    label: 'Food Donor',
    emoji: '🍽️',
    desc: 'Restaurant, hotel, hostel or individual with surplus food',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.3)',
  },
  {
    value: 'ngo',
    label: 'NGO / Charity',
    emoji: '🏥',
    desc: 'Community organization or charity accepting food donations',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
  },
];

const STEPS = [
  { num: 1, label: 'Role & Basics' },
  { num: 2, label: 'Profile' },
  { num: 3, label: 'Location' },
];

function getPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  emoji: ['🍎', '🥦', '🍞', '🥗', '🍊', '🥕', '🌽', '🍇', '🥑', '🫘'][i % 10],
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 16 + Math.random() * 18,
  delay: Math.random() * 6,
  duration: 8 + Math.random() * 8,
}));

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState({});
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: '',
    contact: '', organization: '', address: '',
    lat: '', lng: '', capacity: 100,
  });

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const focus = (k) => setFocused(f => ({ ...f, [k]: true }));
  const blur = (k) => setFocused(f => ({ ...f, [k]: false }));
  const isActive = (k) => focused[k] || !!form[k];

  const strength = getPasswordStrength(form.password);

  const geoLocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        set('lat', latitude.toFixed(6));
        set('lng', longitude.toFixed(6));
        // Reverse geocode using OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          if (data.display_name) set('address', data.display_name);
        } catch {}
        toast.success('Location detected! 📍');
        setLocating(false);
      },
      (err) => {
        toast.error('Could not get location. Enter manually.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const fetchCoordinates = async () => {
    if (!form.address.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.address)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        set('lat', parseFloat(data[0].lat).toFixed(6));
        set('lng', parseFloat(data[0].lon).toFixed(6));
        toast.success('Coordinates found for address! 🌍');
      }
    } catch {}
  };

  const validateStep1 = () => {
    if (!form.role) { toast.error('Please select your role'); return false; }
    if (!form.name.trim()) { toast.error('Full name is required'); return false; }
    if (!form.email.trim()) { toast.error('Email is required'); return false; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return false; }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        contact: form.contact,
        organization: form.organization,
        capacity: Number(form.capacity),
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.lng) || 0, parseFloat(form.lat) || 0],
          address: form.address,
        },
      };
      const user = await register(payload);
      toast.success(`Welcome to HashItOut, ${user.name}! 🎉`);
      navigate(user.role === 'donor' ? '/donor' : '/ngo');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

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

      <div className={`auth-container ${mounted ? 'auth-mounted' : ''}`} style={{ maxWidth: 960 }}>
        {/* Left panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-logo-wrap">
              <div className="auth-logo-ring" />
              <div className="auth-logo-inner">
                <Leaf size={36} className="auth-logo-icon" />
              </div>
            </div>
            <h1 className="auth-brand-name">HashItOut</h1>
            <p className="auth-brand-tagline">Join the movement to end food waste</p>
          </div>

          {/* Step progress */}
          <div className="reg-steps">
            {STEPS.map((s, i) => (
              <div key={s.num} className="reg-step-row">
                <div className={`reg-step-dot ${step >= s.num ? 'reg-step-done' : ''} ${step === s.num ? 'reg-step-active' : ''}`}>
                  {step > s.num ? <CheckCircle2 size={14} /> : s.num}
                </div>
                <span className={`reg-step-label ${step === s.num ? 'reg-step-label-active' : ''}`}>{s.label}</span>
                {i < STEPS.length - 1 && (
                  <div className={`reg-step-line ${step > s.num ? 'reg-step-line-done' : ''}`} />
                )}
              </div>
            ))}
          </div>

          <div className="auth-left-badges">
            {['Secure & Private', 'Role-based Access', 'Real-time Alerts'].map((b, i) => (
              <span key={i} className="auth-badge">
                <Sparkles size={11} />
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="auth-right">
          <div className="auth-form-card" style={{ maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Progress bar top */}
            <div className="reg-progress-bar">
              <div className="reg-progress-fill" style={{ width: `${(step / 3) * 100}%` }} />
            </div>

            <div className="auth-form-header">
              <h2 className="auth-form-title">
                {step === 1 && 'Create your account'}
                {step === 2 && 'Your profile'}
                {step === 3 && 'Your location'}
              </h2>
              <p className="auth-form-sub">
                {step === 1 && 'Choose your role and enter basics'}
                {step === 2 && 'Tell us a bit about yourself'}
                {step === 3 && 'Help us connect you with nearby partners'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div className="auth-step-anim">
                  {/* Role Selection */}
                  <div className="reg-role-grid">
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        id={`role-${r.value}`}
                        onClick={() => set('role', r.value)}
                        className="reg-role-card"
                        style={form.role === r.value ? {
                          borderColor: r.border,
                          background: r.bg,
                          boxShadow: `0 0 20px ${r.color}22`,
                        } : {}}
                      >
                        <div className="reg-role-emoji">{r.emoji}</div>
                        <div className="reg-role-label" style={form.role === r.value ? { color: r.color } : {}}>
                          {r.label}
                        </div>
                        <div className="reg-role-desc">{r.desc}</div>
                        {form.role === r.value && (
                          <div className="reg-role-check" style={{ color: r.color }}>
                            <CheckCircle2 size={18} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Name */}
                  <div className={`auth-field ${isActive('name') ? 'auth-field-active' : ''}`}>
                    <User size={17} className="auth-field-icon" />
                    <input
                      id="reg-name"
                      type="text"
                      className="auth-input"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      onFocus={() => focus('name')}
                      onBlur={() => blur('name')}
                      required
                    />
                    <label className="auth-floating-label">Full Name</label>
                  </div>

                  {/* Email */}
                  <div className={`auth-field ${isActive('email') ? 'auth-field-active' : ''}`}>
                    <Mail size={17} className="auth-field-icon" />
                    <input
                      id="reg-email"
                      type="email"
                      className="auth-input"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      onFocus={() => focus('email')}
                      onBlur={() => blur('email')}
                      required
                    />
                    <label className="auth-floating-label">Email Address</label>
                  </div>

                  {/* Password */}
                  <div className={`auth-field ${isActive('password') ? 'auth-field-active' : ''}`}>
                    <Lock size={17} className="auth-field-icon" />
                    <input
                      id="reg-password"
                      type={showPass ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="Min. 6 characters"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      onFocus={() => focus('password')}
                      onBlur={() => blur('password')}
                      required
                      minLength={6}
                    />
                    <label className="auth-floating-label">Password</label>
                    <button type="button" onClick={() => setShowPass(v => !v)} className="auth-eye-btn" tabIndex={-1}>
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  {/* Password strength */}
                  {form.password && (
                    <div className="reg-strength">
                      <div className="reg-strength-bars">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className="reg-strength-bar"
                            style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.08)' }}
                          />
                        ))}
                      </div>
                      <span className="reg-strength-label" style={{ color: strengthColors[strength] }}>
                        {strengthLabels[strength]}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    id="reg-next"
                    onClick={() => validateStep1() && setStep(2)}
                    className="auth-submit-btn"
                  >
                    Continue
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div className="auth-step-anim">
                  <div className={`auth-field ${isActive('organization') ? 'auth-field-active' : ''}`}>
                    <Building2 size={17} className="auth-field-icon" />
                    <input
                      id="reg-org"
                      type="text"
                      className="auth-input"
                      placeholder="Optional"
                      value={form.organization}
                      onChange={e => set('organization', e.target.value)}
                      onFocus={() => focus('organization')}
                      onBlur={() => blur('organization')}
                    />
                    <label className="auth-floating-label">Organization / Business Name</label>
                  </div>

                  <div className={`auth-field ${isActive('contact') ? 'auth-field-active' : ''}`}>
                    <Phone size={17} className="auth-field-icon" />
                    <input
                      id="reg-contact"
                      type="tel"
                      className="auth-input"
                      placeholder="+91 XXXXX XXXXX"
                      value={form.contact}
                      onChange={e => set('contact', e.target.value)}
                      onFocus={() => focus('contact')}
                      onBlur={() => blur('contact')}
                    />
                    <label className="auth-floating-label">Contact Number</label>
                  </div>

                  {form.role === 'ngo' && (
                    <div className={`auth-field ${isActive('capacity') ? 'auth-field-active' : ''}`}>
                      <span className="auth-field-icon" style={{ fontSize: 15 }}>🏋️</span>
                      <input
                        id="reg-capacity"
                        type="number"
                        min={1}
                        className="auth-input"
                        placeholder="e.g. 100"
                        value={form.capacity}
                        onChange={e => set('capacity', e.target.value)}
                        onFocus={() => focus('capacity')}
                        onBlur={() => blur('capacity')}
                      />
                      <label className="auth-floating-label">Daily Capacity (kg / meals)</label>
                    </div>
                  )}

                  <div className="reg-info-card">
                    <AlertCircle size={14} />
                    <span>Contact details help NGOs and donors reach each other quickly.</span>
                  </div>

                  <div className="auth-nav-row">
                    <button type="button" onClick={() => setStep(1)} className="auth-back-btn">
                      <ChevronLeft size={18} /> Back
                    </button>
                    <button type="button" onClick={() => setStep(3)} className="auth-submit-btn" style={{ flex: 1 }}>
                      Continue <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div className="auth-step-anim">
                  <div className={`auth-field ${isActive('address') ? 'auth-field-active' : ''}`}>
                    <MapPin size={17} className="auth-field-icon" />
                    <input
                      id="reg-address"
                      type="text"
                      className="auth-input"
                      placeholder="Full address (e.g. New Delhi, India)"
                      value={form.address}
                      onChange={e => set('address', e.target.value)}
                      onFocus={() => focus('address')}
                      onBlur={() => { blur('address'); fetchCoordinates(); }}
                      onKeyDown={e => e.key === 'Enter' && fetchCoordinates()}
                    />
                    <label className="auth-floating-label">Address</label>
                  </div>

                  {/* Auto-detect location */}
                  <button
                    type="button"
                    onClick={geoLocate}
                    disabled={locating}
                    className="reg-geo-btn"
                  >
                    {locating ? (
                      <div className="auth-spinner" style={{ width: 16, height: 16 }} />
                    ) : (
                      <Navigation size={16} />
                    )}
                    {locating ? 'Detecting location…' : 'Auto-detect my location'}
                  </button>

                  <div className="reg-coords-row">
                    <div className={`auth-field ${isActive('lat') ? 'auth-field-active' : ''}`}>
                      <input
                        id="reg-lat"
                        type="number"
                        step="any"
                        className="auth-input"
                        placeholder="e.g. 28.6139"
                        value={form.lat}
                        onChange={e => set('lat', e.target.value)}
                        onFocus={() => focus('lat')}
                        onBlur={() => blur('lat')}
                      />
                      <label className="auth-floating-label">Latitude</label>
                    </div>
                    <div className={`auth-field ${isActive('lng') ? 'auth-field-active' : ''}`}>
                      <input
                        id="reg-lng"
                        type="number"
                        step="any"
                        className="auth-input"
                        placeholder="e.g. 77.2090"
                        value={form.lng}
                        onChange={e => set('lng', e.target.value)}
                        onFocus={() => focus('lng')}
                        onBlur={() => blur('lng')}
                      />
                      <label className="auth-floating-label">Longitude</label>
                    </div>
                  </div>

                  <div className="reg-info-card">
                    <MapPin size={14} />
                    <span>Location helps us match you with nearby partners. You can skip if preferred.</span>
                  </div>

                  <div className="auth-nav-row">
                    <button type="button" onClick={() => setStep(2)} className="auth-back-btn">
                      <ChevronLeft size={18} /> Back
                    </button>
                    <button
                      id="reg-submit"
                      type="submit"
                      disabled={loading}
                      className="auth-submit-btn"
                      style={{ flex: 1 }}
                    >
                      {loading ? <div className="auth-spinner" /> : (
                        <><CheckCircle2 size={18} /> Create Account</>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </form>

            <p className="auth-switch-link">
              Already have an account? <Link to="/login">Sign in →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
