import { formatDistanceToNow } from 'date-fns';

const STEP_ORDER = ['pending', 'accepted', 'in-transit', 'delivered'];

const STEP_INFO = {
  pending:    { label: 'Claimed',     color: 'bg-trust-600',   dot: 'bg-trust-400' },
  accepted:   { label: 'Accepted',    color: 'bg-primary-600', dot: 'bg-primary-400' },
  'in-transit': { label: 'In Transit', color: 'bg-yellow-600', dot: 'bg-yellow-400' },
  delivered:  { label: 'Delivered',   color: 'bg-emerald-600', dot: 'bg-emerald-400' },
  cancelled:  { label: 'Cancelled',   color: 'bg-red-700',     dot: 'bg-red-400' },
};

export default function TrackingTimeline({ assignment }) {
  const currentIdx = STEP_ORDER.indexOf(assignment.status);
  const isCancelled = assignment.status === 'cancelled';

  return (
    <div className="card p-5 space-y-4">
      <h4 className="font-semibold text-white text-sm">Lifecycle Tracking</h4>

      {isCancelled ? (
        <div className="flex items-center gap-3 p-3 bg-red-900/30 border border-red-800 rounded-xl">
          <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <span className="text-red-400 font-semibold text-sm">Assignment Cancelled</span>
        </div>
      ) : (
        <div className="relative">
          {/* Progress bar background */}
          <div className="absolute left-[5px] top-3 bottom-3 w-0.5 bg-border" />
          {/* Progress fill */}
          <div
            className="absolute left-[5px] top-3 w-0.5 bg-primary-500 transition-all duration-700"
            style={{ height: `${(currentIdx / (STEP_ORDER.length - 1)) * 100}%` }}
          />

          <div className="space-y-6 relative">
            {STEP_ORDER.map((step, idx) => {
              const info = STEP_INFO[step];
              const isActive = idx === currentIdx;
              const isDone = idx < currentIdx;

              return (
                <div key={step} className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 z-10 transition-all duration-300 ${
                    isDone ? 'bg-primary-500'
                    : isActive ? `${info.dot} ring-2 ring-primary-500/40 ring-offset-2 ring-offset-card`
                    : 'bg-border'
                  }`} />
                  <div>
                    <p className={`text-sm font-semibold ${isActive ? 'text-white' : isDone ? 'text-primary-400' : 'text-muted'}`}>
                      {info.label}
                    </p>
                    {isActive && (
                      <span className="text-xs text-muted">
                        {assignment.updatedAt
                          ? formatDistanceToNow(new Date(assignment.updatedAt), { addSuffix: true })
                          : 'Just now'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
