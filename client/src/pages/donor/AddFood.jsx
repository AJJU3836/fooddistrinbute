import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';
import { PlusCircle, Info, Navigation, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const CATEGORIES = ['cooked', 'raw', 'packaged', 'beverages', 'other'];
const UNITS = ['kg', 'meals', 'liters', 'boxes', 'packs'];

export default function AddFood() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const loc = user?.location;
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [topMatch, setTopMatch] = useState(null);
  const [form, setForm] = useState({
    foodType: '', category: 'cooked', quantity: '', unit: 'kg',
    expiryTime: '', 
    address: loc?.address || '', 
    lat: loc?.coordinates?.[1] || '', 
    lng: loc?.coordinates?.[0] || '', 
    description: '',
  });

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
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Compute a local urgency preview
  const hoursLeft = form.expiryTime
    ? Math.max(0, (new Date(form.expiryTime) - Date.now()) / 3_600_000)
    : null;
  const urgency = hoursLeft === null ? null
    : hoursLeft < 6 ? { label: '🔴 Critical', cls: 'text-red-400 border-red-800 bg-red-900/20' }
    : hoursLeft < 24 ? { label: '🟠 High', cls: 'text-orange-400 border-orange-800 bg-orange-900/20' }
    : hoursLeft < 48 ? { label: '🟡 Medium', cls: 'text-yellow-400 border-yellow-800 bg-yellow-900/20' }
    : { label: '🟢 Low', cls: 'text-primary-400 border-primary-800 bg-primary-900/20' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTopMatch(null);
    try {
      const payload = {
        foodType: form.foodType,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        expiryTime: new Date(form.expiryTime).toISOString(),
        description: form.description,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.lng) || 0, parseFloat(form.lat) || 0],
          address: form.address,
        },
      };

      const { data } = await api.post('/food', payload);
      toast.success('✅ Food listed successfully!');
      if (data.topMatch) setTopMatch(data.topMatch);
      else navigate('/donor/history');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  // If we have a top match, show a success screen
  if (topMatch) {
    return (
      <div className="max-w-lg mx-auto animate-slide-up">
        <div className="card p-8 text-center space-y-5">
          <div className="text-6xl">🎯</div>
          <h2 className="text-2xl font-extrabold text-white">Food Listed!</h2>
          <p className="text-muted">Your food has been posted and NGOs have been notified.</p>

          <div className="p-4 bg-trust-900/40 border border-trust-700 rounded-2xl text-left">
            <p className="text-xs text-trust-400 font-semibold uppercase tracking-wider mb-2">Top Matched NGO</p>
            <p className="font-bold text-white text-lg">{topMatch.ngo?.name}</p>
            {topMatch.ngo?.organization && <p className="text-muted text-sm">{topMatch.ngo.organization}</p>}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-surface rounded-xl p-2 text-center">
                <p className="text-xs text-muted">Score</p>
                <p className="font-bold text-primary-400">{(topMatch.score * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-surface rounded-xl p-2 text-center">
                <p className="text-xs text-muted">Distance</p>
                <p className="font-bold text-trust-400">{topMatch.distanceKm} km</p>
              </div>
              <div className="bg-surface rounded-xl p-2 text-center">
                <p className="text-xs text-muted">Urgency</p>
                <p className="font-bold text-orange-400">{(topMatch.urgencyScore * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate('/donor/history')} className="btn-secondary flex-1 justify-center">
              View History
            </button>
            <button onClick={() => { setTopMatch(null); setForm({ foodType: '', category: 'cooked', quantity: '', unit: 'kg', expiryTime: '', address: '', lat: '', lng: '', description: '' }); }} className="btn-primary flex-1 justify-center">
              Add More Food
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <PlusCircle size={24} className="text-primary-400" /> List Surplus Food
        </h1>
        <p className="text-muted text-sm mt-1">Fill in the details below and we'll intelligently match you with nearby NGOs.</p>
      </div>

      <div className="card p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Food type + category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Food Type *</label>
              <input id="food-type" type="text" className="input-field" placeholder="e.g. Rice, Dal, Bread"
                value={form.foodType} onChange={e => set('foodType', e.target.value)} required />
            </div>
            <div>
              <label className="label">Category *</label>
              <select id="food-category" className="input-field" value={form.category}
                onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-surface capitalize">{c}</option>)}
              </select>
            </div>
          </div>

          {/* Quantity + unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Quantity *</label>
              <input id="food-qty" type="number" min="0.1" step="0.1" className="input-field" placeholder="e.g. 10"
                value={form.quantity} onChange={e => set('quantity', e.target.value)} required />
            </div>
            <div>
              <label className="label">Unit *</label>
              <select id="food-unit" className="input-field" value={form.unit}
                onChange={e => set('unit', e.target.value)}>
                {UNITS.map(u => <option key={u} value={u} className="bg-surface">{u}</option>)}
              </select>
            </div>
          </div>

          {/* Expiry */}
          <div>
            <label className="label">Expiry Date & Time *</label>
            <input id="food-expiry" type="datetime-local" className="input-field"
              value={form.expiryTime} onChange={e => set('expiryTime', e.target.value)} required
              min={new Date().toISOString().slice(0, 16)} />
            {urgency && (
              <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${urgency.cls}`}>
                <Info size={12} /> Urgency: {urgency.label}
                {hoursLeft !== null && <span className="text-muted ml-1">({hoursLeft.toFixed(1)}h left)</span>}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <label className="label">Pickup Address *</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input id="food-address" type="text" className="input-field pl-10" placeholder="Full pickup address"
                    value={form.address} onChange={e => set('address', e.target.value)} 
                    onBlur={fetchCoordinates}
                    onKeyDown={e => e.key === 'Enter' && fetchCoordinates()}
                    required />
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={geoLocate}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-trust-900/10 border-2 border-dashed border-trust-700/50 hover:border-trust-600 rounded-xl text-trust-400 font-semibold transition-all"
            >
              {locating ? <div className="w-4 h-4 border-2 border-trust-400 border-t-transparent rounded-full animate-spin" /> : <Navigation size={18} />}
              {locating ? 'Detecting current location...' : 'Auto-detect current location'}
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Latitude *</label>
                <input id="food-lat" type="number" step="any" className="input-field" placeholder="e.g. 28.6139"
                  value={form.lat} onChange={e => set('lat', e.target.value)} required />
              </div>
              <div>
                <label className="label">Longitude *</label>
                <input id="food-lng" type="number" step="any" className="input-field" placeholder="e.g. 77.2090"
                  value={form.lng} onChange={e => set('lng', e.target.value)} required />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea id="food-desc" className="input-field resize-none" rows={3}
              placeholder="Any additional details about the food..."
              value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Algorithm preview card */}
          <div className="p-4 bg-surface border border-border rounded-xl">
            <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info size={12} /> Intelligent Matching
            </p>
            <p className="text-xs text-slate-400">
              After submission, our algorithm scores nearby NGOs using:
              <span className="text-primary-400 font-semibold"> proximity (40%)</span> +
              <span className="text-orange-400 font-semibold"> urgency (40%)</span> +
              <span className="text-trust-400 font-semibold"> quantity match (20%)</span>.
              The best-matched NGO is auto-notified instantly via real-time push.
            </p>
          </div>

          <button id="food-submit" type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
            {loading
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Matching NGOs…</>
              : <><PlusCircle size={18} /> List Food & Match NGOs</>}
          </button>
        </form>
      </div>
    </div>
  );
}
