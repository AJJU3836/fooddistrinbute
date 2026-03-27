import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import api from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Map, Layers } from 'lucide-react';

// Fix Leaflet default icon path
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored icons
const makeIcon = (color) => L.divIcon({
  html: `<div style="
    width:28px;height:28px;border-radius:50% 50% 50% 0;
    background:${color};border:3px solid #fff;
    transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  className: '',
});

const ICONS = {
  donor: makeIcon('#22c55e'),
  ngo:   makeIcon('#3b82f6'),
  food:  makeIcon('#f59e0b'),
};

const LEGEND = [
  { color: '#22c55e', label: 'Donor' },
  { color: '#3b82f6', label: 'NGO' },
  { color: '#f59e0b', label: 'Active Food' },
];

export default function MapView() {
  const { user } = useAuth();
  const [pins, setPins] = useState({ donors: [], ngos: [], activeFood: [] });
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState({ donors: true, ngos: true, food: true });

  useEffect(() => {
    api.get('/map/pins').then(r => setPins(r.data.data || {})).finally(() => setLoading(false));
  }, []);

  // Center on first valid pin or default (India center)
  const center = (() => {
    const allPins = [...(pins.donors || []), ...(pins.ngos || [])];
    const first = allPins.find(p => p.location?.coordinates?.some(c => c !== 0));
    if (first) return [first.location.coordinates[1], first.location.coordinates[0]];
    return [20.5937, 78.9629]; // India center
  })();

  const toggleLayer = (key) => setLayers(l => ({ ...l, [key]: !l[key] }));

  return (
    <div className="space-y-4 animate-fade-in h-full">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Map size={24} className="text-primary-400" /> Map View
          </h1>
          <p className="text-muted text-sm mt-1">
            {pins.donors?.length || 0} donors · {pins.ngos?.length || 0} NGOs · {pins.activeFood?.length || 0} active listings
          </p>
        </div>

        {/* Layer toggles */}
        <div className="flex gap-2">
          {[
            { key: 'donors', label: 'Donors', color: '#22c55e' },
            { key: 'ngos', label: 'NGOs', color: '#3b82f6' },
            { key: 'food', label: 'Food', color: '#f59e0b' },
          ].map(({ key, label, color }) => (
            <button
              key={key}
              id={`layer-${key}`}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                layers[key]
                  ? 'border-opacity-100 text-white'
                  : 'border-border text-muted opacity-50'
              }`}
              style={layers[key] ? { borderColor: color, background: `${color}20` } : {}}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card h-[500px] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl" style={{ height: '550px' }}>
          <MapContainer center={center} zoom={12} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Donor markers */}
            {layers.donors && pins.donors?.map(d => (
              <Marker
                key={d._id}
                position={[d.location.coordinates[1], d.location.coordinates[0]]}
                icon={ICONS.donor}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-bold text-white">🍽️ {d.name}</p>
                    {d.organization && <p className="text-slate-300 text-xs">{d.organization}</p>}
                    <p className="text-xs text-primary-400 font-semibold">Donor</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* NGO markers */}
            {layers.ngos && pins.ngos?.map(n => (
              <Marker
                key={n._id}
                position={[n.location.coordinates[1], n.location.coordinates[0]]}
                icon={ICONS.ngo}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-bold text-white">🏥 {n.name}</p>
                    {n.organization && <p className="text-slate-300 text-xs">{n.organization}</p>}
                    <p className="text-xs text-trust-400 font-semibold">NGO · Capacity: {n.capacity} kg/day</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Active food markers */}
            {layers.food && pins.activeFood?.map(f => (
              <Marker
                key={f._id}
                position={[f.location.coordinates[1], f.location.coordinates[0]]}
                icon={ICONS.food}
              >
                <Popup>
                  <div className="space-y-1">
                    <p className="font-bold text-white">🥘 {f.foodType}</p>
                    <p className="text-slate-300 text-xs">{f.quantity} {f.unit} · {f.status}</p>
                    <p className="text-xs text-yellow-400">By: {f.donorId?.name}</p>
                    <p className="text-xs text-muted">
                      Expires: {new Date(f.expiryTime).toLocaleString()}
                    </p>
                  </div>
                </Popup>
                {/* Coverage circle */}
                <Circle
                  center={[f.location.coordinates[1], f.location.coordinates[0]]}
                  radius={2000}
                  color="#f59e0b"
                  fillColor="#f59e0b"
                  fillOpacity={0.05}
                  weight={1}
                />
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Legend */}
      <div className="card p-4 flex items-center gap-6 flex-wrap">
        <p className="text-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
          <Layers size={14} /> Legend
        </p>
        {LEGEND.map(l => (
          <div key={l.label} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
            <span className="text-slate-300">{l.label}</span>
          </div>
        ))}
        <p className="text-xs text-muted ml-auto">📍 Click any marker for details</p>
      </div>
    </div>
  );
}
