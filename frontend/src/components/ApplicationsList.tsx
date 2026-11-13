import { Link } from 'react-router-dom';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';

export default function ApplicationsList({ applications }: { applications: ApplicationDto[] }) {
  const recent = applications.slice(0, 5);

  return (
    <div className="bg-white border border-border rounded-card p-6 shadow-sm md:col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-ink">Recent Applications</h3>
        <Link to="/applications" className="text-xs text-primary font-medium">
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">You have not applied to anything yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {recent.map((a) => (
            <li key={a.id} className="flex justify-between items-center text-sm gap-3">
              <span className="text-ink truncate">{a.opportunityTitle}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusStyle[a.status]}`}>
                {statusLabel[a.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}