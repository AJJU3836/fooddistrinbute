import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import { Salad, Star, Clock, TrendingUp, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className={`p-2 rounded-xl ${color}`}><Icon size={18} className="text-white" /></div>
    </div>
    <p className="text-3xl font-extrabold text-white mt-1">{value ?? '—'}</p>
    {sub && <p className="text-xs text-muted">{sub}</p>}
  </div>
);

export default function NGODashboard() {
  const { user } = useAuth();
  const { notifications } = useSocket();
  const [available, setAvailable] = useState([]);
  const [claimed, setClaimed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/ngo/available'),
      api.get('/ngo/claimed'),
    ]).then(([a, c]) => {
      setAvailable(a.data.data || []);
      setClaimed(c.data.data || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Refresh when new food arrives via socket
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.type === 'food:new') fetchData();
  }, [notifications]);

  const delivered = claimed.filter(a => a.status === 'delivered').length;
  const active = claimed.filter(a => ['pending','accepted','in-transit'].includes(a.status)).length;

  // Show top 3 urgency-sorted food
  const urgent = [...available]
    .sort((a, b) => (b.urgencyScore || 0) - (a.urgencyScore || 0))
    .slice(0, 3);

  const URGENCY_BAR = (score) => {
    if (score > 0.85) return { bar: 'bg-red-500', cls: 'text-red-400', label: 'Critical' };
    if (score > 0.6)  return { bar: 'bg-orange-500', cls: 'text-orange-400', label: 'High' };
    if (score > 0.3)  return { bar: 'bg-yellow-500', cls: 'text-yellow-400', label: 'Medium' };
    return { bar: 'bg-primary-500', cls: 'text-primary-400', label: 'Low' };
  };

  const STATUS_STYLES = {
    pending: 'badge-assigned', accepted: 'badge-available',
    'in-transit': 'badge-transit', delivered: 'badge-delivered', cancelled: 'badge-expired',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            NGO Hub — <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-muted text-sm mt-1">Real-time food availability for your community.</p>
        </div>
        <Link to="/ngo/available" className="btn-primary">
          <Salad size={18} /> Browse Food
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="stat-card h-28 animate-pulse bg-cardHover" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Salad} label="Available Food" value={available.length} color="bg-primary-700" sub="Listings near you" />
          <StatCard icon={ClipboardList} label="Active Claims" value={active} color="bg-trust-700" sub="In progress" />
          <StatCard icon={Star} label="Delivered" value={delivered} color="bg-emerald-700" sub="Completed" />
          <StatCard icon={TrendingUp} label="Meals Served" value={(delivered * 4).toLocaleString()} color="bg-purple-700" sub="Estimated" />
        </div>
      )}

      {/* Urgent listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title"><Clock size={20} className="text-red-400" /> Urgent — Act Now</h2>
          <Link to="/ngo/available" className="text-primary-400 hover:text-primary-300 text-sm font-medium">See all →</Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-cardHover" />)}
          </div>
        ) : urgent.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-primary-400 text-4xl mb-3">✅</p>
            <p className="text-white font-semibold">No urgent listings right now</p>
            <p className="text-muted text-sm mt-1">New food will appear here in real-time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {urgent.map(food => {
              const u = URGENCY_BAR(food.urgencyScore || 0);
              const hoursLeft = Math.max(0, (new Date(food.expiryTime) - Date.now()) / 3_600_000);
              return (
                <div key={food._id} className={`card p-4 space-y-3 border ${food.urgencyScore > 0.85 ? 'border-red-800' : 'border-border'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white">{food.foodType}</p>
                      <p className="text-muted text-xs">{food.donorId?.name || 'Donor'}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${u.cls} ${u.cls.replace('text-','border-').replace('400','800')} bg-opacity-20`}>
                      {u.label}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{food.quantity} {food.unit}</p>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${u.bar}`} style={{ width: `${(food.urgencyScore || 0) * 100}%` }} />
                  </div>
                  <p className="text-xs text-muted">
                    ⏰ {hoursLeft < 1 ? 'Under 1 hour left!' : `${hoursLeft.toFixed(1)}h remaining`}
                  </p>
                  <Link to="/ngo/available" className="btn-primary w-full justify-center text-sm py-2">
                    Claim Now
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent claims */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title"><ClipboardList size={20} /> Recent Claims</h2>
          <Link to="/ngo/claimed" className="text-primary-400 hover:text-primary-300 text-sm font-medium">View all →</Link>
        </div>

        {!loading && claimed.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-semibold">No claims yet</p>
            <p className="text-muted text-sm mt-1">Browse available food and start claiming.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Food', 'Donor', 'Status', 'Claimed'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claimed.slice(0, 5).map(a => (
                  <tr key={a._id} className="border-b border-border/50 hover:bg-cardHover transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white text-sm">
                      {a.foodId?.foodType || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{a.donorId?.name || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_STYLES[a.status] || 'badge'}>{a.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-sm">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
