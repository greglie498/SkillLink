import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { api, ApiError } from '../lib/api';
import { opportunityStatusLabel, opportunityStatusStyle, type BusinessOpportunity, type BusinessProfileDto } from '../lib/business';
import { count, type BusinessReportData } from '../lib/reports';

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm';

export default function BusinessOpportunities() {
  const [items, setItems] = useState<BusinessOpportunity[]>([]);
  const [profile, setProfile] = useState<BusinessProfileDto | null>(null);
  const [report, setReport] = useState<BusinessReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, p, r] = await Promise.all([
        api<BusinessOpportunity[]>('/business/opportunities', { auth: true }),
        api<BusinessProfileDto>('/business/profile', { auth: true }),
        api<BusinessReportData>('/business/report', { auth: true }),
      ]);
      setItems(list);
      setProfile(p);
      setReport(r);
      setError(null);
    } catch {
      setError('Could not load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: 'PUBLISHED' | 'CLOSED') {
    setNotice(null);
    try {
      await api(`/business/opportunities/${id}/status`, { method: 'PATCH', auth: true, body: { status } });
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? (err.fieldErrors?.deadline ?? err.message) : 'Could not reach the server.');
    }
  }

  const awaitingById: Record<string, number> = {};
  report?.perOpportunity.forEach((o) => {
    awaitingById[o.id] = o.submitted;
  });

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <PageHeader
          title="Business Dashboard"
          sub={profile ? `Welcome back, ${profile.organisationName}` : 'Your opportunities and applicants.'}
          action={
            <Link to="/business/opportunities/new" className="btn btn-primary btn-sm">
              New opportunity
            </Link>
          }
        />

        {profile && profile.verification !== 'VERIFIED' && (
          <div className="text-sm text-[#A66E12] bg-[#FFF6E5] border border-[#F5DFB4] rounded-card px-5 py-4 mb-6">
            Your business is {profile.verification === 'PENDING' ? 'awaiting verification' : 'not verified'}. You can create drafts, but
            you can only publish once an administrator verifies you.{' '}
            <Link to="/business/profile" className="font-semibold underline">
              Go to your business profile
            </Link>
          </div>
        )}

        {notice && <p className="text-sm text-error mb-4">{notice}</p>}
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {report && (
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon="briefcase" label="Opportunities" value={report.opportunities.total} hint={`${count(report.opportunities.byStatus, 'PUBLISHED')} published`} />
            <StatCard icon="file" label="Applications received" value={report.applications.total} />
            <StatCard
              icon="users"
              label="Awaiting your decision"
              value={count(report.applications.byStatus, 'SUBMITTED')}
              warn={count(report.applications.byStatus, 'SUBMITTED') > 0}
            />
            <StatCard icon="check" label="Selected" value={count(report.applications.byStatus, 'SELECTED')} />
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <section className="xl:col-span-2">
              <h2 className="text-[15px] font-bold text-slate-dark mb-3.5">Your opportunities</h2>
              {items.length === 0 ? (
                <div className={`${card} p-6 text-sm text-muted`}>You have not created any opportunities yet.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((o) => {
                    const awaiting = awaitingById[o.id] ?? 0;
                    return (
                      <div key={o.id} className={`${card} p-5 flex flex-wrap items-center gap-4`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-dark truncate">{o.title}</p>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${opportunityStatusStyle[o.status]}`}>
                              {opportunityStatusLabel[o.status]}
                            </span>
                          </div>
                          <p className="text-xs text-muted">
                            {o.applicants} {o.applicants === 1 ? 'applicant' : 'applicants'}
                            {awaiting > 0 && <span className="font-semibold text-ink"> ({awaiting} awaiting)</span>} - Deadline {o.deadline}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Link to={`/business/opportunities/${o.id}/applicants`} className="btn btn-secondary btn-sm">
                            Review applicants
                          </Link>
                          {o.status === 'DRAFT' && (
                            <button onClick={() => changeStatus(o.id, 'PUBLISHED')} className="text-xs font-semibold text-primary-dark">
                              Publish
                            </button>
                          )}
                          {o.status === 'PUBLISHED' && (
                            <button onClick={() => changeStatus(o.id, 'CLOSED')} className="text-xs font-semibold text-error">
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <aside>
              <h2 className="text-[15px] font-bold text-slate-dark mb-3.5">Needs your attention</h2>
              <div className={`${card} p-5`}>
                {!report || report.needsAttention.length === 0 ? (
                  <p className="text-sm text-muted">Nothing needs attention right now.</p>
                ) : (
                  <ul className="space-y-4">
                    {report.needsAttention.map((n) => (
                      <li key={n.id} className="text-sm">
                        <Link to={`/business/opportunities/${n.id}/applicants`} className="font-semibold text-ink hover:text-primary">
                          {n.title}
                        </Link>
                        <p className="text-xs text-muted mt-0.5">{n.reasons.join('; ')}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}