import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useSocket } from '../../contexts/SocketContext.jsx';
import FoodCard from '../../components/FoodCard.jsx';
import { Salad, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

const SORT_OPTIONS = [
  { value: 'urgency', label: '🔴 Most Urgent' },
  { value: 'quantity', label: '📦 Most Quantity' },
  { value: 'newest', label: '🕐 Newest' },
];

export default function AvailableFood() {
  const { notifications } = useSocket();
  const [food, setFood] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('urgency');
  const [category, setCategory] = useState('all');

  const fetchFood = () => {
    api.get('/ngo/available').then(r => setFood(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchFood(); }, []);

  // Real-time refresh on new food event
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.type === 'food:new') {
      fetchFood();
    }
  }, [notifications]);

  const handleClaim = async (foodId) => {
    setClaiming(foodId);
    try {
      await api.post(`/ngo/claim/${foodId}`);
      toast.success('🎉 Food claimed successfully!');
      setFood(prev => prev.filter(f => f._id !== foodId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim');
    } finally {
      setClaiming(null);
    }
  };

  const categories = ['all', ...new Set(food.map(f => f.category).filter(Boolean))];

  const filtered = food
    .filter(f => category === 'all' || f.category === category)
    .filter(f => f.foodType?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'urgency') return (b.urgencyScore || 0) - (a.urgencyScore || 0);
      if (sort === 'quantity') return b.quantity - a.quantity;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Salad size={24} className="text-primary-400" /> Available Food
          </h1>
          <p className="text-muted text-sm mt-1">
            {food.length} listing{food.length !== 1 ? 's' : ''} available · Updates in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 bg-primary-900/40 border border-primary-800 rounded-xl text-primary-400">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="available-search" type="text" className="input-field pl-9" placeholder="Search food…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select id="available-sort" className="input-field w-auto" value={sort} onChange={e => setSort(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>)}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} id={`cat-${c}`} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium capitalize transition-all ${
              category === c ? 'bg-primary-700 text-white' : 'bg-card border border-border text-muted hover:text-white'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-64 animate-pulse bg-cardHover" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-white font-semibold text-lg">All food has been claimed!</p>
          <p className="text-muted text-sm mt-2">New listings will appear here instantly when donors post.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(f => (
            <div key={f._id} className={claiming === f._id ? 'opacity-60 pointer-events-none' : ''}>
              <FoodCard food={f} showClaim onClaim={handleClaim} showMatch />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
