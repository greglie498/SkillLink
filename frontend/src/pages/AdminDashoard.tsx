import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatBars from '../components/StatBars';
import { api, ApiError, downloadFile } from '../lib/api';
import { count, type AdminSummary, type AdminUser, type PendingBusiness, type PeriodReport } from '../lib/reports';

const tones = {
  warning: { border: 'border-[#F2D9AC]', dot: 'bg-warning' },
  info: { border: 'border-[#C9DFF0]', dot: 'bg-info' },
  ok: { border: 'border-[#C7EAD7]', dot: 'bg-success' },
};

function AttentionCard({ title, detail, active, tone, to }: { title: string; detail: string; active: boolean; tone: 'warning' | 'info'; to?: string }) {
  const t = tones[active ? tone : 'ok'];
  const body = (
    <div className={`bg-white border ${t.border} rounded-card p-5 shadow-sm h-full ${to ? 'hover:shadow-lift transition-shadow' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[.14em] font-bold text-muted">{active ? 'Needs attention' : 'All clear'}</span>
        <span className={`w-2 h-2 rounded-full ${t.dot}`} />
      </div>
      <p className="text-sm font-bold text-slate-dark mt-2">{title}</p>
      <p className="text-[11px] text-muted mt-1">{detail}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function waiting(iso: string | null): string {
  if (!iso) return 'No documents submitted yet';
  const hours = Math.floor((Date.now() - Date.parse(iso)) / 3_600_000);
  if (hours < 1) return 'Oldest request: under an hour';
  if (hours < 48) return `Oldest request: ${hours} hours`;
  return `Oldest request: ${Math.floor(hours / 24)} days`;
}

const userStatusStyle: Record<AdminUser['status'], string> = {
  ACTIVE: 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]',
  SUSPENDED: 'bg-[#FDEEEE] text-[#B83A3A] border border-[#F5CCCC]',
  DEACTIVATED: 'bg-[#F2F2F5] text-[#60606B] border border-transparent',
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [pending, setPending] = useState<PendingBusiness[]>([]);
  const [recent, setRecent] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10));
  const [to, setTo] = useState(todayStr);
  const [period, setPeriod] = useState<PeriodReport | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);

  useEffect(() => {
    if (!from || !to) return;
    let cancelled = false;
    api<PeriodReport>(`/admin/reports/period?from=${from}&to=${to}`, { auth: true })
      .then((d) => {
        if (!cancelled) {
          setPeriod(d);
          setPeriodError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPeriodError(err instanceof ApiError ? (err.fieldErrors?.from ?? err.fieldErrors?.to ?? err.message) : 'Could not load the period report.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  function preset(days: number) {
    setTo(todayStr);
    setFrom(new Date(Date.now() - (days - 1) * 86_400_000).toISOString().slice(0, 10));
  }

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<AdminSummary>('/admin/reports/summary', { auth: true }),
      api<PendingBusiness[]>('/admin/businesses?verification=PENDING', { auth: true }),
      api<{ users: AdminUser[] }>('/admin/users?pageSize=5', { auth: true }),
    ])
      .then(([s, p, u]) => {
        if (cancelled) return;
        setSummary(s);
        setPending(p);
        setRecent(u.users);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function exportCsv(type: 'users' | 'applications' | 'opportunities') {
    setNotice(null);
    try {
      await downloadFile(`/admin/reports/export?type=${type}`, `skilllink-${type}.csv`);
    } catch {
      setNotice('Could not download the report.');
    }
  }

  const oldest = pending
    .map((b) => b.submittedAt)
    .filter((x): x is string => Boolean(x))
    .sort()[0] ?? null;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <PageHeader
          title="Admin Dashboard"
          sub={summary ? `Report generated ${new Date(summary.generatedAt).toLocaleString('en-KE')}` : 'Platform overview'}
          action={
            <div className="flex flex-wrap gap-2">
              {(['users', 'applications', 'opportunities'] as const).map((t) => (
                <button key={t} onClick={() => exportCsv(t)} className="btn btn-secondary btn-sm capitalize">
                  Export {t} (CSV)
                </button>
              ))}
            </div>
          }
        />

        {notice && <p className="text-sm text-error mb-4">{notice}</p>}
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <AttentionCard
                title={`${pending.length} ${pending.length === 1 ? 'business' : 'businesses'} awaiting verification`}
                detail={waiting(oldest)}
                active={pending.length > 0}
                tone="warning"
                to="/admin/verification"
              />
              <AttentionCard
                title={`${summary.applications.stalled} applications waiting over 7 days`}
                detail="No decision from the business yet"
                active={summary.applications.stalled > 0}
                tone="info"
              />
              <AttentionCard
                title={`${summary.opportunities.publishedWithoutApplicants} published opportunities with no applicants`}
                detail="May need promotion or a review"
                active={summary.opportunities.publishedWithoutApplicants > 0}
                tone="info"
                to="/admin/opportunities"
              />
            </div>

            <section className="mb-8">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3.5">
                <h2 className="text-[15px] font-bold text-slate-dark">Activity in the selected period</h2>
                <div className="flex flex-wrap items-end gap-3">
                  {[7, 30, 90].map((d) => (
                    <button key={d} onClick={() => preset(d)} className="btn btn-secondary btn-sm">
                      Last {d} days
                    </button>
                  ))}
                  <div>
                    <label className="field-label">From</label>
                    <input type="date" className="field py-2" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">To</label>
                    <input type="date" className="field py-2" value={to} min={from} max={todayStr} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </div>
              {periodError && <p className="text-sm text-error mb-3">{periodError}</p>}
              {period && (
                <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
                  <StatCard icon="users" label="Registrations" value={period.registrations.total} hint={`${period.registrations.talent} talent, ${period.registrations.business} business`} />
                  <StatCard icon="briefcase" label="Opportunities posted" value={period.opportunitiesPosted} hint={`${period.activeNow} active now`} />
                  <StatCard icon="file" label="Applications" value={period.applications} />
                  <StatCard icon="check" label="Selections" value={period.selections} hint="Of applications received in this period" />
                  <StatCard icon="shield" label="Projects completed" value={period.completedProjects} />
                </div>
              )}
            </section>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              <StatCard icon="users" label="Total users" value={summary.users.total} hint={`${count(summary.users.byStatus, 'SUSPENDED')} suspended`} />
              <StatCard icon="briefcase" label="Opportunities" value={summary.opportunities.total} hint={`${count(summary.opportunities.byStatus, 'PUBLISHED')} published`} />
              <StatCard icon="file" label="Applications" value={summary.applications.total} hint={`${count(summary.applications.byStatus, 'SELECTED')} selected`} />
              <StatCard icon="check" label="Projects" value={summary.projects.total} hint={`${count(summary.projects.byStatus, 'IN_PROGRESS')} in progress`} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2 space-y-6">
                <section>
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-[15px] font-bold text-slate-dark">Recent registrations</h2>
                    <Link to="/admin/users" className="text-[13px] font-semibold text-primary-dark">
                      View all
                    </Link>
                  </div>
                  <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-surface text-left text-[#6E6E78] border-b border-border">
                          <th className="px-5 py-3 font-semibold">Name</th>
                          <th className="px-5 py-3 font-semibold">Type</th>
                          <th className="px-5 py-3 font-semibold">Joined</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((u) => (
                          <tr key={u.id} className="border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors">
                            <td className="px-5 py-3">
                              <p className="font-semibold text-ink">{u.name ?? u.email}</p>
                              <p className="text-xs text-muted">{u.email}</p>
                            </td>
                            <td className="px-5 py-3 text-[#454550] capitalize">{u.role.toLowerCase()}</td>
                            <td className="px-5 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
                            <td className="px-5 py-3">
                              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${userStatusStyle[u.status]}`}>{u.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatBars
                    title="Opportunities by status"
                    bars={[
                      { label: 'Draft', value: count(summary.opportunities.byStatus, 'DRAFT'), color: 'bg-muted' },
                      { label: 'Published', value: count(summary.opportunities.byStatus, 'PUBLISHED'), color: 'bg-success' },
                      { label: 'Closed', value: count(summary.opportunities.byStatus, 'CLOSED'), color: 'bg-warning' },
                      { label: 'Archived', value: count(summary.opportunities.byStatus, 'ARCHIVED'), color: 'bg-muted' },
                    ]}
                  />
                  <StatBars
                    title="Applications by current status"
                    bars={[
                      { label: 'Submitted', value: count(summary.applications.byStatus, 'SUBMITTED'), color: 'bg-warning' },
                      { label: 'Shortlisted', value: count(summary.applications.byStatus, 'SHORTLISTED'), color: 'bg-info' },
                      { label: 'Selected', value: count(summary.applications.byStatus, 'SELECTED'), color: 'bg-success' },
                      { label: 'Rejected', value: count(summary.applications.byStatus, 'REJECTED'), color: 'bg-error' },
                    ]}
                  />
                </div>
              </div>

              <aside className="space-y-6">
                <section>
                  <h2 className="text-[15px] font-bold text-slate-dark mb-3.5">Quick stats</h2>
                  <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm divide-y divide-[#EEEEF1]">
                    {[
                      ['Talent', count(summary.users.byRole, 'TALENT')],
                      ['Businesses', count(summary.users.byRole, 'BUSINESS')],
                      ['Verified businesses', count(summary.businesses.byVerification, 'VERIFIED')],
                      ['Projects in progress', count(summary.projects.byStatus, 'IN_PROGRESS')],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between items-center px-5 py-3 text-sm">
                        <span className="text-muted">{label}</span>
                        <span className="font-semibold text-ink">{value}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-[15px] font-bold text-slate-dark mb-3.5">Pending actions</h2>
                  <div className="space-y-3">
                    <Link to="/admin/verification" className="flex justify-between items-center bg-white border border-[#E8E8ED] rounded-card shadow-sm px-5 py-3 text-sm hover:shadow-lift transition-shadow">
                      <span className="text-ink">Verifications pending</span>
                      <span className="text-xs font-bold bg-primary-tint text-primary-dark border border-primary-light rounded-full px-2.5 py-0.5">{pending.length}</span>
                    </Link>
                    <Link to="/admin/opportunities" className="flex justify-between items-center bg-white border border-[#E8E8ED] rounded-card shadow-sm px-5 py-3 text-sm hover:shadow-lift transition-shadow">
                      <span className="text-ink">Published with no applicants</span>
                      <span className="text-xs font-bold bg-primary-tint text-primary-dark border border-primary-light rounded-full px-2.5 py-0.5">
                        {summary.opportunities.publishedWithoutApplicants}
                      </span>
                    </Link>
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}