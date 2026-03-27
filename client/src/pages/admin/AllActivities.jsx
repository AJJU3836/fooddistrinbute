import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { Activity, Search } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const STATUS_STYLES = {
  pending: 'badge-assigned', accepted: 'badge-available',
  'in-transit': 'badge-transit', delivered: 'badge-delivered',
  cancelled: 'badge-expired',
};

export default function AllActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 20;

  const fetchActivities = (p = 1) => {
    setLoading(true);
    api.get(`/admin/activities?page=${p}&limit=${LIMIT}`)
      .then(r => { setActivities(r.data.data || []); setTotal(r.data.total || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchActivities(page); }, [page]);

  const filtered = activities.filter(a =>
    a.foodId?.foodType?.toLowerCase().includes(search.toLowerCase()) ||
    a.ngoId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.donorId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <Activity size={24} className="text-trust-400" /> All Activities
        </h1>
        <p className="text-muted text-sm mt-1">{total} total assignment{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input id="activity-search" type="text" className="input-field pl-9 max-w-sm"
          placeholder="Search food, donor, or NGO…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-cardHover" />)}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Food', 'Quantity', 'Donor', 'NGO', 'Status', 'Score', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a._id} className="border-b border-border/50 hover:bg-cardHover transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-white text-sm">
                    {a.foodId?.foodType || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-sm">
                    {a.foodId?.quantity} {a.foodId?.unit}
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 text-sm">{a.donorId?.name || '—'}</td>
                  <td className="px-5 py-3.5 text-slate-300 text-sm">{a.ngoId?.name || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={STATUS_STYLES[a.status] || 'badge'}>{a.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-trust-400 text-sm font-semibold">
                    {a.matchScore ? `${(a.matchScore * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-muted text-sm">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted">No activities found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">← Prev</button>
          <span className="text-muted text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
