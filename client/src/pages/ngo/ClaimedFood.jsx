import { useEffect, useState } from 'react';
import api from '../../lib/api.js';
import { useSocket } from '../../contexts/SocketContext.jsx';
import TrackingTimeline from '../../components/TrackingTimeline.jsx';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const STATUS_TRANSITIONS = {
  pending:    { next: 'accepted',   label: 'Mark Accepted' },
  accepted:   { next: 'in-transit', label: 'Mark In-Transit 🚚' },
  'in-transit': { next: 'delivered', label: 'Mark Delivered ✅' },
};

const STATUS_STYLES = {
  pending: 'badge-assigned', accepted: 'badge-available',
  'in-transit': 'badge-transit', delivered: 'badge-delivered', cancelled: 'badge-expired',
};

export default function ClaimedFood() {
  const { notifications } = useSocket();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updating, setUpdating] = useState(null);

  const fetchClaims = () => {
    api.get('/ngo/claimed').then(r => setClaims(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchClaims(); }, []);

  // Refresh on status updates
  useEffect(() => {
    const latest = notifications[0];
    if (latest?.type === 'food:status') fetchClaims();
  }, [notifications]);

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    setUpdating(assignmentId);
    try {
      await api.patch(`/ngo/assignment/${assignmentId}/status`, { status: newStatus });
      toast.success(`Status updated to "${newStatus}"`);
      fetchClaims();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const active = claims.filter(c => c.status !== 'delivered' && c.status !== 'cancelled');
  const completed = claims.filter(c => c.status === 'delivered' || c.status === 'cancelled');

  const ClaimCard = ({ claim }) => {
    const isExpanded = expanded === claim._id;
    const transition = STATUS_TRANSITIONS[claim.status];
    const isUpdating = updating === claim._id;

    return (
      <div className="card overflow-hidden transition-all duration-200">
        {/* Header */}
        <div
          className="p-5 flex items-start justify-between cursor-pointer hover:bg-cardHover transition-colors"
          onClick={() => setExpanded(isExpanded ? null : claim._id)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-white">{claim.foodId?.foodType || 'Unknown Food'}</h3>
              <span className={STATUS_STYLES[claim.status] || 'badge'}>{claim.status}</span>
            </div>
            <p className="text-muted text-sm">
              From: <span className="text-slate-300">{claim.donorId?.name || 'Unknown'}</span>
              {claim.donorId?.contact && <span className="ml-2 text-muted">· {claim.donorId.contact}</span>}
            </p>
            <p className="text-xs text-muted mt-1">
              Claimed {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4 shrink-0">
            {claim.foodId?.quantity && (
              <span className="text-trust-400 font-semibold text-sm">
                {claim.foodId.quantity} {claim.foodId.unit}
              </span>
            )}
            {isExpanded ? <ChevronUp size={18} className="text-muted" /> : <ChevronDown size={18} className="text-muted" />}
          </div>
        </div>

        {/* Expanded panel */}
        {isExpanded && (
          <div className="border-t border-border p-5 space-y-4 animate-fade-in bg-surface/50">
            {/* Donor contact info */}
            {claim.donorId && (
              <div className="p-3 bg-card rounded-xl border border-border">
                <p className="text-xs text-muted font-semibold uppercase mb-2">Donor Contact</p>
                <p className="text-white text-sm font-semibold">{claim.donorId.name}</p>
                {claim.donorId.organization && <p className="text-muted text-xs">{claim.donorId.organization}</p>}
                {claim.donorId.contact && <p className="text-primary-400 text-sm mt-1">📞 {claim.donorId.contact}</p>}
                {claim.donorId.location?.address && (
                  <p className="text-muted text-xs mt-1">📍 {claim.donorId.location.address}</p>
                )}
              </div>
            )}

            {/* Tracking timeline */}
            <TrackingTimeline assignment={claim} />

            {/* Action button */}
            {transition && (
              <button
                id={`advance-${claim._id}`}
                onClick={() => handleStatusUpdate(claim._id, transition.next)}
                disabled={isUpdating}
                className="btn-primary w-full justify-center"
              >
                {isUpdating
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : transition.label}
              </button>
            )}

            {claim.status === 'pending' && (
              <button
                onClick={() => handleStatusUpdate(claim._id, 'cancelled')}
                disabled={isUpdating}
                className="btn-danger w-full justify-center text-sm"
              >
                Cancel Claim
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-cardHover" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <ClipboardList size={24} className="text-trust-400" /> My Claims
        </h1>
        <p className="text-muted text-sm mt-1">{claims.length} total claim{claims.length !== 1 ? 's' : ''}</p>
      </div>

      {claims.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white font-semibold text-lg">No claims yet</p>
          <p className="text-muted text-sm mt-2">Go to Available Food and claim listings near you.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="section-title text-base">⚡ Active ({active.length})</h2>
              {active.map(c => <ClaimCard key={c._id} claim={c} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h2 className="section-title text-base text-muted">✅ Completed ({completed.length})</h2>
              {completed.map(c => <ClaimCard key={c._id} claim={c} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
