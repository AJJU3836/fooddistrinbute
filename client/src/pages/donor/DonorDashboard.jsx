import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PlusCircle, Salad, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-extrabold text-white mt-1">{value ?? '—'}</p>
    {sub && <p className="text-xs text-muted">{sub}</p>}
  </div>
);

export default function DonorDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/food').then(r => {
      setListings(r.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const stats = {
    total: listings.length,
    available: listings.filter(f => f.status === 'available').length,
    delivered: listings.filter(f => f.status === 'delivered').length,
    meals: listings.filter(f => f.status === 'delivered').reduce((a, f) => a + f.quantity * 4, 0),
  };

  const recent = [...listings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  const STATUS_STYLES = {
    available: 'badge-available', assigned: 'badge-assigned',
    'in-transit': 'badge-transit', delivered: 'badge-delivered', expired: 'badge-expired',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Welcome, <span className="gradient-text">{user?.name}</span> 👋
          </h1>
          <p className="text-muted text-sm mt-1">Here's your food donation impact at a glance.</p>
        </div>
        <Link to="/donor/add" className="btn-primary">
          <PlusCircle size={18} /> Donate Food
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="stat-card h-28 animate-pulse bg-cardHover" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Salad} label="Total Donations" value={stats.total} color="bg-primary-700" sub="All time" />
          <StatCard icon={Clock} label="Active Listings" value={stats.available} color="bg-trust-700" sub="Awaiting pickup" />
          <StatCard icon={CheckCircle} label="Delivered" value={stats.delivered} color="bg-emerald-700" sub="Successfully redistributed" />
          <StatCard icon={TrendingUp} label="Meals Served" value={stats.meals.toLocaleString()} color="bg-purple-700" sub="Estimated impact" />
        </div>
      )}

      {/* Impact banner */}
      <div className="card p-5 bg-gradient-to-r from-primary-900/60 to-trust-900/40 border-primary-800">
        <div className="flex items-center gap-4">
          <div className="text-4xl">🌱</div>
          <div>
            <p className="text-white font-bold">Your Environmental Impact</p>
            <p className="text-primary-300 text-sm mt-1">
              You've helped save an estimated <strong>{(stats.delivered * 2.5).toFixed(1)} kg</strong> of CO₂ emissions
              and served <strong>{stats.meals.toLocaleString()}</strong> meals to people in need.
            </p>
          </div>
        </div>
      </div>

      {/* Recent donations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title"><Salad size={20} /> Recent Donations</h2>
          <Link to="/donor/history" className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-cardHover" />)}
          </div>
        ) : recent.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-5xl mb-4">🍱</div>
            <p className="text-white font-semibold text-lg">No donations yet</p>
            <p className="text-muted text-sm mt-2 mb-6">Start making a difference by listing surplus food.</p>
            <Link to="/donor/add" className="btn-primary inline-flex">
              <PlusCircle size={16} /> Make First Donation
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Food</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Qty</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">Listed</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(f => (
                  <tr key={f._id} className="border-b border-border/50 hover:bg-cardHover transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-white text-sm">{f.foodType}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-sm">{f.quantity} {f.unit}</td>
                    <td className="px-5 py-3.5">
                      <span className={STATUS_STYLES[f.status] || 'badge'}>{f.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted text-sm">
                      {formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}
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
