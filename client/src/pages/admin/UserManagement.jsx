import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { Users, Search, Shield, UserCheck, UserX, Plus, X, Navigation, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ROLES = ['all', 'donor', 'ngo', 'admin'];

const ROLE_STYLES = {
  donor: 'text-primary-400 bg-primary-900 border-primary-800',
  ngo:   'text-trust-400 bg-trust-900 border-trust-800',
  admin: 'text-purple-400 bg-purple-900 border-purple-800',
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);
  
  // Add NGO Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [locating, setLocating] = useState(false);
  const [newNgo, setNewNgo] = useState({
    name: '', organization: '', email: '', password: '', 
    contact: '', capacity: '', address: '', lat: '', lng: ''
  });

  const handleAddNgo = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/admin/ngos', newNgo);
      toast.success('NGO created successfully!');
      setShowAddModal(false);
      setNewNgo({ name: '', organization: '', email: '', password: '', contact: '', capacity: '', address: '', lat: '', lng: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create NGO');
    } finally {
      setCreating(false);
    }
  };

  const geoLocate = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setNewNgo(prev => ({ ...prev, lat: latitude.toFixed(6), lng: longitude.toFixed(6) }));
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          if (data.display_name) setNewNgo(prev => ({ ...prev, address: data.display_name }));
        } catch {}
        toast.success('Location detected! 📍');
        setLocating(false);
      },
      () => { toast.error('Could not get location'); setLocating(false); }
    );
  };

  const fetchCoordinates = async () => {
    if (!newNgo.address.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newNgo.address)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        setNewNgo(prev => ({ ...prev, lat: parseFloat(data[0].lat).toFixed(6), lng: parseFloat(data[0].lon).toFixed(6) }));
        toast.success('Coordinates found for address! 🌍');
      }
    } catch {}
  };

  const fetchUsers = () => {
    const params = role !== 'all' ? `?role=${role}` : '';
    api.get(`/admin/users${params}`).then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const toggleActive = async (userId, current) => {
    setUpdating(userId);
    try {
      await api.patch(`/admin/users/${userId}`, { isActive: !current });
      toast.success(`User ${current ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users size={24} className="text-purple-400" /> User Management
          </h1>
          <p className="text-muted text-sm mt-1">{users.length} users registered</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Add New NGO
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input id="user-search" type="text" className="input-field pl-9" placeholder="Search by name or email…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {ROLES.map(r => (
            <button key={r} id={`role-filter-${r}`} onClick={() => setRole(r)}
              className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                role === r ? 'bg-purple-700 text-white' : 'bg-card border border-border text-muted hover:text-white'
              }`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-cardHover" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-white font-semibold">No users found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Role', 'Contact', 'Joined', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-b border-border/50 hover:bg-cardHover transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center font-bold text-slate-400">
                        {u.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{u.name}</p>
                        <p className="text-muted text-xs truncate max-w-[160px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge capitalize border ${ROLE_STYLES[u.role] || ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted text-sm">{u.contact || '—'}</td>
                  <td className="px-5 py-4 text-muted text-sm">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-5 py-4">
                    {u.isActive
                      ? <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><UserCheck size={14} /> Active</span>
                      : <span className="flex items-center gap-1.5 text-red-400 text-sm"><UserX size={14} /> Inactive</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    {u.role !== 'admin' && (
                      <button
                        id={`toggle-user-${u._id}`}
                        onClick={() => toggleActive(u._id, u.isActive)}
                        disabled={updating === u._id}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
                          u.isActive
                            ? 'border-red-700 text-red-400 hover:bg-red-900/30'
                            : 'border-primary-700 text-primary-400 hover:bg-primary-900/30'
                        }`}
                      >
                        {updating === u._id ? '...' : u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                    {u.role === 'admin' && <span className="text-muted text-xs flex items-center gap-1"><Shield size={12} /> Protected</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add NGO Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up border border-border shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute right-4 top-4 text-muted hover:text-white transition-colors">
              <X size={24} />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Create New NGO Account</h2>
              <form onSubmit={handleAddNgo} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Representative Name *</label>
                    <input type="text" className="input-field" value={newNgo.name} onChange={e => setNewNgo({ ...newNgo, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Organization Name *</label>
                    <input type="text" className="input-field" value={newNgo.organization} onChange={e => setNewNgo({ ...newNgo, organization: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Email Address *</label>
                    <input type="email" className="input-field" value={newNgo.email} onChange={e => setNewNgo({ ...newNgo, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Password *</label>
                    <input type="text" className="input-field border-trust-800 focus:border-trust-500" placeholder="Set initial password" value={newNgo.password} onChange={e => setNewNgo({ ...newNgo, password: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Contact Number</label>
                    <input type="text" className="input-field" value={newNgo.contact} onChange={e => setNewNgo({ ...newNgo, contact: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Daily Capacity (Meals) *</label>
                    <input type="number" min="1" className="input-field" value={newNgo.capacity} onChange={e => setNewNgo({ ...newNgo, capacity: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="label">Location Details</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                      <input type="text" className="input-field pl-10" placeholder="Full address" 
                        value={newNgo.address} onChange={e => setNewNgo({ ...newNgo, address: e.target.value })} 
                        onBlur={fetchCoordinates}
                        onKeyDown={e => e.key === 'Enter' && fetchCoordinates()}
                        required />
                    </div>
                    <button type="button" onClick={geoLocate} disabled={locating} className="px-4 bg-trust-900/40 text-trust-400 hover:text-white border border-trust-800 rounded-xl transition-colors whitespace-nowrap flex items-center gap-2">
                      {locating ? <div className="w-4 h-4 border-2 border-trust-400 border-t-transparent rounded-full animate-spin"/> : <Navigation size={18}/>}
                      Auto-detect
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" step="any" className="input-field" placeholder="Latitude" value={newNgo.lat} onChange={e => setNewNgo({ ...newNgo, lat: e.target.value })} required />
                    <input type="number" step="any" className="input-field" placeholder="Longitude" value={newNgo.lng} onChange={e => setNewNgo({ ...newNgo, lng: e.target.value })} required />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl font-semibold text-muted hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={creating} className="btn-primary">
                    {creating ? 'Creating...' : 'Create NGO Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
