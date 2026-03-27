import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useSocket } from '../../contexts/SocketContext.jsx';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { Users, Salad, CheckCircle, TrendingUp, Activity, BarChart2 } from 'lucide-react';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ icon: Icon, label, value, color, sub, prefix = '' }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between">
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className={`p-2 rounded-xl ${color}`}><Icon size={18} className="text-white" /></div>
    </div>
    <p className="text-3xl font-extrabold text-white mt-1">{prefix}{value ?? '—'}</p>
    {sub && <p className="text-xs text-muted">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-sm shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { notifications } = useSocket();
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    Promise.all([
      api.get('/admin/overview'),
      api.get('/analytics'),
    ]).then(([o, a]) => {
      setOverview(o.data.data);
      setAnalytics(a.data.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Refresh when admins receive analytics update
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.type === 'analytics') fetchData();
  }, [notifications]);

  // Format monthly chart data
  const monthlyData = (() => {
    if (!analytics) return [];
    const map = {};
    analytics.monthlyListings?.forEach(m => {
      const key = `${MONTHS[m._id.month - 1]} ${m._id.year}`;
      map[key] = { name: key, donations: m.count, kg: Math.round(m.totalQty || 0) };
    });
    analytics.monthlyDeliveries?.forEach(m => {
      const key = `${MONTHS[m._id.month - 1]} ${m._id.year}`;
      map[key] = { ...map[key], name: key, deliveries: m.count };
    });
    return Object.values(map).slice(-6);
  })();

  // Pie data
  const pieData = analytics?.statusDist?.map(s => ({
    name: s._id,
    value: s.count,
  })) || [];

  if (loading) return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => <div key={i} className="stat-card h-28 animate-pulse bg-cardHover" />)}
    </div>
  );

  const o = overview || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
        <p className="text-muted text-sm mt-1">Platform-wide metrics and real-time activity.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={o.users?.total} color="bg-purple-700" sub={`${o.users?.donors} donors · ${o.users?.ngos} NGOs`} />
        <StatCard icon={Salad} label="Food Listed" value={o.food?.total} color="bg-primary-700" sub={`${o.food?.available} available`} />
        <StatCard icon={CheckCircle} label="Delivered" value={o.food?.delivered} color="bg-emerald-700" sub="Successful redistributions" />
        <StatCard icon={TrendingUp} label="Efficiency" value={`${o.efficiencyRate}%`} color="bg-trust-700" sub="Delivery success rate" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Meals Served" value={(o.mealsServed || 0).toLocaleString()} color="bg-orange-700" />
        <StatCard icon={BarChart2} label="CO₂ Saved" value={(o.wasteReduced || 0).toFixed(1)} color="bg-teal-700" sub="kg equivalent" />
        <StatCard icon={Salad} label="Expired Food" value={o.food?.expired} color="bg-red-800" sub="Needs improvement" />
        <StatCard icon={Users} label="Assignments" value={o.assignments?.total} color="bg-indigo-700" sub={`${o.assignments?.delivered} delivered`} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend bar chart */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="section-title mb-4"><BarChart2 size={18} /> Monthly Trends</h2>
          {monthlyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="donations" name="Donations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="deliveries" name="Deliveries" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status pie chart */}
        <div className="card p-5">
          <h2 className="section-title mb-4">Status Split</h2>
          {pieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted">No data yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    dataKey="value" nameKey="name" paddingAngle={4}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-muted capitalize truncate">{d.name}: <span className="text-white font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Donors + NGOs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">🏆 Top Donors</h2>
          {(analytics?.topDonors || []).length === 0
            ? <p className="text-muted text-sm">No data yet</p>
            : <div className="space-y-3">
              {analytics.topDonors.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-900 flex items-center justify-center text-primary-400 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{d.name}</p>
                      {d.organization && <p className="text-muted text-xs">{d.organization}</p>}
                    </div>
                  </div>
                  <span className="text-primary-400 font-bold text-sm">{d.count} donations</span>
                </div>
              ))}
            </div>
          }
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">🏅 Top NGOs</h2>
          {(analytics?.topNGOs || []).length === 0
            ? <p className="text-muted text-sm">No data yet</p>
            : <div className="space-y-3">
              {analytics.topNGOs.map((n, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-trust-900 flex items-center justify-center text-trust-400 font-bold text-xs">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{n.name}</p>
                      {n.organization && <p className="text-muted text-xs">{n.organization}</p>}
                    </div>
                  </div>
                  <span className="text-trust-400 font-bold text-sm">{n.count} deliveries</span>
                </div>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
