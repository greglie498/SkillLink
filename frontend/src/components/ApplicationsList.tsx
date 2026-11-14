import { Link } from 'react-router-dom';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';

export default function ApplicationsList({ applications }: { applications: ApplicationDto[] }) {
  const recent = applications.slice(0, 5);

  return (
    <div className="bg-white border border-[#E8E8ED] rounded-card p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-bold text-slate-dark">Recent Applications</h3>
        <Link to="/applications" className="text-[13px] text-primary-dark font-semibold">
          View all
        </Link>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-muted">You have not applied to anything yet.</p>
      ) : (
        <ul>
          {recent.map((a) => (
            <li 
              key={a.id} 
              className="flex justify-between items-center py-3 gap-3 border-b border-[#EEEEF1] last:border-0"
            >
              <div className='min-w-0'>
                <p className="text-sm font-medium text-ink truncate">{a.opportunityTitle}</p>
                <p className='text-xs text-muted'>
                  {a.business} - {new Date(a.appliedAt).toLocaleDateString('en-KE')}
                </p>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusStyle[a.status]}`}>
                {statusLabel[a.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}