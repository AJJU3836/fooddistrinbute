import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import FoodCard from '../../components/FoodCard.jsx';
import { History, Search, Filter } from 'lucide-react';

const STATUSES = ['all', 'available', 'assigned', 'in-transit', 'delivered', 'expired'];

export default function DonationHistory() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/food').then(r => setListings(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  const filtered = listings
    .filter(f => filter === 'all' || f.status === filter)
    .filter(f => f.foodType?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <History size={24} className="text-primary-400" /> Donation History
        </h1>
        <p className="text-muted text-sm mt-1">{listings.length} total donation{listings.length !== 1 ? 's' : ''} made</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="history-search"
            type="text"
            className="input-field pl-9"
            placeholder="Search food type…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === s
                  ? 'bg-primary-700 text-white'
                  : 'bg-card border border-border text-muted hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-52 animate-pulse bg-cardHover" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-white font-semibold">No donations found</p>
          <p className="text-muted text-sm mt-2">Try changing the filter above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(food => <FoodCard key={food._id} food={food} />)}
        </div>
      )}
    </div>
  );
}
