import { formatDistanceToNow, format } from 'date-fns';

const STATUS_STYLES = {
  available:  'badge-available',
  assigned:   'badge-assigned',
  'in-transit': 'badge-transit',
  delivered:  'badge-delivered',
  expired:    'badge-expired',
  pending:    'badge-assigned',
  accepted:   'badge-available',
  cancelled:  'badge-expired',
};

const URGENCY_COLORS = [
  { max: 0.3, cls: 'text-primary-400', bar: 'bg-primary-500', label: 'Low' },
  { max: 0.6, cls: 'text-yellow-400',  bar: 'bg-yellow-500',  label: 'Medium' },
  { max: 0.85, cls: 'text-orange-400', bar: 'bg-orange-500',  label: 'High' },
  { max: 1.0,  cls: 'text-red-400',    bar: 'bg-red-500',     label: 'Critical' },
];

function getUrgency(score = 0) {
  return URGENCY_COLORS.find(u => score <= u.max) || URGENCY_COLORS[3];
}

export default function FoodCard({ food, onClaim, showClaim = false, showMatch = false }) {
  const hoursLeft = Math.max(0, (new Date(food.expiryTime) - Date.now()) / 3_600_000);
  const urgency = getUrgency(food.urgencyScore || 0);
  const isCritical = (food.urgencyScore || 0) > 0.85;

  return (
    <div className={`card p-5 flex flex-col gap-4 animate-slide-up transition-all duration-200 hover:border-primary-800 ${isCritical ? 'border-red-800 glow-green' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base truncate">{food.foodType}</h3>
          <p className="text-muted text-sm mt-0.5 truncate">
            {food.donorId?.name || food.donorId?.organization || 'Unknown donor'}
          </p>
        </div>
        <span className={STATUS_STYLES[food.status] || 'badge'}>{food.status}</span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-surface rounded-xl p-3">
          <p className="text-muted text-xs mb-1">Quantity</p>
          <p className="font-bold text-white">{food.quantity} <span className="text-muted font-normal">{food.unit}</span></p>
        </div>
        <div className="bg-surface rounded-xl p-3">
          <p className="text-muted text-xs mb-1">Category</p>
          <p className="font-semibold text-slate-200 capitalize">{food.category || 'Other'}</p>
        </div>
      </div>

      {/* Urgency bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted">Urgency</span>
          <span className={`font-semibold ${urgency.cls} ${isCritical ? 'urgency-critical' : ''}`}>
            {urgency.label}
          </span>
        </div>
        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${urgency.bar}`}
            style={{ width: `${(food.urgencyScore || 0) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted mt-1.5">
          {hoursLeft < 1
            ? '⚠️ Under 1 hour left!'
            : `Expires ${formatDistanceToNow(new Date(food.expiryTime), { addSuffix: true })}`}
        </p>
      </div>

      {/* Location */}
      {food.location?.address && (
        <p className="text-xs text-muted truncate">📍 {food.location.address}</p>
      )}

      {/* Match score (shown in NGO view) */}
      {showMatch && food.matchScore !== undefined && (
        <div className="bg-trust-900 border border-trust-700 rounded-xl p-3 text-xs">
          <span className="text-trust-300 font-semibold">Match Score: {(food.matchScore * 100).toFixed(0)}%</span>
          {food.distanceKm !== undefined && (
            <span className="text-muted ml-2">· {food.distanceKm} km away</span>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-muted">
        Listed {formatDistanceToNow(new Date(food.createdAt), { addSuffix: true })}
      </p>

      {/* Claim button */}
      {showClaim && food.status === 'available' && (
        <button
          id={`claim-food-${food._id}`}
          onClick={() => onClaim?.(food._id)}
          className="btn-primary w-full justify-center"
        >
          Claim This Food
        </button>
      )}
    </div>
  );
}
