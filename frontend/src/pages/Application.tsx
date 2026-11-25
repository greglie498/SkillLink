import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';

type Tab = 'ALL' | ApplicationDto['status'];

const tabs: { key: Tab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'SHORTLISTED', label: 'Shortlisted' },
  { key: 'SELECTED', label: 'Selected' },
  { key: 'REJECTED', label: 'Rejected' },
];

export default function Applications() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [tab, setTab] = useState<Tab>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<ApplicationDto[]>('/applications', { auth: true })
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your applications.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const countOf = (k: Tab) => (k === 'ALL' ? applications.length : applications.filter((a) => a.status === k).length);
  const shown = tab === 'ALL' ? applications : applications.filter((a) => a.status === tab);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 max-w-none">
        <PageHeader
          title="My Applications"
          sub={`${applications.length} total ${applications.length === 1 ? 'application' : 'applications'}`}
        />

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="bg-white border border-[#E8E8ED] rounded-card p-8 shadow-sm text-center max-w-xl">
            <p className="text-sm text-ink mb-4">You have not applied to any opportunities yet.</p>
            <Link to="/opportunities" className="btn btn-primary btn-sm">
              Browse opportunities
            </Link>
          </div>
        )}

        {applications.length > 0 && (
          <>
            <div className="flex flex-wrap gap-1 mb-5 border-b border-border">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-2.5 text-sm -mb-px border-b-2 flex items-center gap-2 transition-colors ${
                    tab === t.key
                      ? 'border-primary text-slate-dark font-semibold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                  <span className="text-xs bg-[#EEEEF1] text-[#60606B] px-1.5 py-0.5 rounded-full">{countOf(t.key)}</span>
                </button>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="text-sm text-muted">No applications with this status.</p>
            ) : (
              <div className="space-y-3">
                {shown.map((a) => (
                  <div
                    key={a.id}
                    className="bg-white border border-[#E8E8ED] rounded-card p-4 shadow-sm hover:shadow-lift transition-all flex flex-wrap items-center gap-4"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary font-bold flex items-center justify-center shrink-0">
                      {a.business.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-dark truncate">{a.opportunityTitle}</p>
                      <p className="text-xs text-muted">
                        {a.business} - Applied {new Date(a.appliedAt).toLocaleDateString('en-KE')}
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${statusStyle[a.status]}`}>
                      {statusLabel[a.status]}
                    </span>
                    {a.projectId && (
                      <Link to={`/projects/${a.projectId}`} className="btn btn-primary btn-sm">
                        View project
                      </Link>
                    )}
                    <Link to={`/opportunities/${a.opportunityId}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}