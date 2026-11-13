import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatBars from '../components/StatBars';
import { api, ApiError, downloadFile } from '../lib/api';
import { count, type AdminSummary, type PendingBusiness } from '../lib/reports';

const isSafeLink = (url: string) => /^https?:\/\//i.test(url);

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [pending, setPending] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        api<AdminSummary>('/admin/reports/summary', { auth: true }),
        api<PendingBusiness[]>('/admin/businesses?verification=PENDING', { auth: true }),
      ]);
      setSummary(s);
      setPending(p);
      setError(null);
    } catch {
      setError('Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(b: PendingBusiness, verification: 'VERIFIED' | 'REJECTED') {
    const verb = verification === 'VERIFIED' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${verb} ${b.name}?`)) return;
    setNotice(null);
    try {
      await api(`/admin/businesses/${b.id}/verification`, { method: 'PATCH', auth: true, body: { verification } });
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }

  async function exportCsv(type: 'users' | 'applications' | 'opportunities') {
    setNotice(null);
    try {
      await downloadFile(`/admin/reports/export?type=${type}`, `skilllink-${type}.csv`);
    } catch {
      setNotice('Could not download the report.');
    }
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-6 flex flex-wrap justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Administrator Dashboard</h1>
            {summary && (
              <p className="text-sm text-muted">
                Report generated {new Date(summary.generatedAt).toLocaleString('en-KE')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['users', 'applications', 'opportunities'] as const).map((t) => (
              <button
                key={t}
                onClick={() => exportCsv(t)}
                className="border border-border bg-white hover:border-primary text-ink text-xs font-medium px-3 py-2 rounded-md capitalize"
              >
                Export {t} (CSV)
              </button>
            ))}
          </div>
        </header>

        {notice && <p className="text-sm text-error mb-4">{notice}</p>}
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {summary && (
          <>
            <h2 className="text-sm font-semibold text-ink mb-3">Needs your attention</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                label="Businesses awaiting verification"
                value={pending.length}
                hint="Review below"
                warn={pending.length > 0}
              />
              <StatCard
                label="Applications waiting over 7 days"
                value={summary.applications.stalled}
                hint="No decision from the business yet"
                warn={summary.applications.stalled > 0}
              />
              <StatCard
                label="Published opportunities with no applicants"
                value={summary.opportunities.publishedWithoutApplicants}
                hint="May need promotion or a review"
                warn={summary.opportunities.publishedWithoutApplicants > 0}
              />
            </div>

            <h2 className="text-sm font-semibold text-ink mb-3">Platform overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Users" value={summary.users.total} hint={`${count(summary.users.byStatus, 'SUSPENDED')} suspended`} />
              <StatCard label="Opportunities" value={summary.opportunities.total} hint={`${count(summary.opportunities.byStatus, 'PUBLISHED')} published`} />
              <StatCard label="Applications" value={summary.applications.total} hint={`${count(summary.applications.byStatus, 'SELECTED')} selected`} />
              <StatCard label="Projects" value={summary.projects.total} hint={`${count(summary.projects.byStatus, 'IN_PROGRESS')} in progress`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <StatBars
                title="Users by role"
                bars={[
                  { label: 'Talent ', value: count(summary.users.byRole, 'TALENT'), color: 'bg-primary' },
                  { label: 'Business ', value: count(summary.users.byRole, 'BUSINESS'), color: 'bg-info' },
                  { label: 'Administrator ', value: count(summary.users.byRole, 'ADMIN'), color: 'bg-slate-dark' },
                ]}
              />
              <StatBars
                title="Opportunities by status"
                bars={[
                  { label: 'Draft ', value: count(summary.opportunities.byStatus, 'DRAFT'), color: 'bg-muted' },
                  { label: 'Published ', value: count(summary.opportunities.byStatus, 'PUBLISHED'), color: 'bg-success' },
                  { label: 'Closed ', value: count(summary.opportunities.byStatus, 'CLOSED'), color: 'bg-warning' },
                  { label: 'Archived ', value: count(summary.opportunities.byStatus, 'ARCHIVED'), color: 'bg-muted' },
                ]}
              />
              <StatBars
                title="Applications by current status"
                bars={[
                  { label: 'Submitted ', value: count(summary.applications.byStatus, 'SUBMITTED'), color: 'bg-warning' },
                  { label: 'Shortlisted ', value: count(summary.applications.byStatus, 'SHORTLISTED'), color: 'bg-info' },
                  { label: 'Selected ', value: count(summary.applications.byStatus, 'SELECTED'), color: 'bg-success' },
                  { label: 'Rejected ', value: count(summary.applications.byStatus, 'REJECTED'), color: 'bg-error' },
                ]}
              />
            </div>

            <h2 className="text-sm font-semibold text-ink mb-3">Verification queue</h2>
            {pending.length === 0 ? (
              <p className="text-sm text-muted">No businesses are waiting for verification.</p>
            ) : (
              <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted border-b border-border">
                      <th className="px-6 py-3 font-medium">Business</th>
                      <th className="px-6 py-3 font-medium">Contact</th>
                      <th className="px-6 py-3 font-medium">Document</th>
                      <th className="px-6 py-3 font-medium">Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((b) => (
                      <tr key={b.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3">
                          <p className="text-ink font-medium">{b.name}</p>
                          <p className="text-xs text-muted">{[b.industry, b.location].filter(Boolean).join(' - ')}</p>
                        </td>
                        <td className="px-6 py-3 text-ink">{b.email}</td>
                        <td className="px-6 py-3">
                          {b.documentUrl && isSafeLink(b.documentUrl) ? (
                            <a href={b.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary font-medium">
                              View document
                            </a>
                          ) : (
                            <span className="text-muted">None submitted</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-3">
                            <button onClick={() => decide(b, 'VERIFIED')} className="text-xs font-medium text-success">
                              Approve
                            </button>
                            <button onClick={() => decide(b, 'REJECTED')} className="text-xs font-medium text-error">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}