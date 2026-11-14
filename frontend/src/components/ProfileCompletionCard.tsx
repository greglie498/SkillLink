import { Link } from 'react-router-dom';

interface ProfileCompletionCardProps {
  percent: number;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export default function ProfileCompletionCard({
  percent,
  title = 'Complete your profile to get better matches',
  description = 'Complete your profile to appear in more recommendations.',
  actionLabel = 'Complete profile',
  actionTo = '/profile',
}: ProfileCompletionCardProps) {
  return (
    <div className="bg-white border border-border rounded-card p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <span className="text-xs font-semibold text-slate-dark">{percent}%</span>
        </div>
        <p className="text-xs text-muted mb-3">{description}</p>
        <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {actionTo && (
        <Link to={actionTo} className="btn btn-primary btn-sm whitespace-nowrap">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}