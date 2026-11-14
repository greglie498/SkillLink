import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Pager from '../components/Pager';
import { api } from '../lib/api';
import type { AuditRow, AuditStats } from '../lib/reports';

interface AuditResponse {
  total: number;
  page: number;
  pageSize: number;
  stats: AuditStats;
  logs: AuditRow[];
}

const actions = [
  'USER_REGISTERED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'USER_SUSPENDED', 'USER_REACTIVATED',
  'BUSINESS_VERIFICATION_UPDATED', 'VERIFICATION_SUBMITTED', 'APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED',
  'PROJECT_CREATED', 'OPPORTUNITY_UNPUBLISHED', 'REPORT_EXPORTED',
];

export default function AdminAuditLog() {
  const [action, setAction] = useState('');
  const [days, setDays] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set('action', action);
    if (days) params.set('days', days);
    if (q) params.set('q', q);
    try {
      setData(await api<AuditResponse>(`/admin/audit-logs?${params.toString()}`, { auth: true }));
      setError(null);
    } catch {
      setError('Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, [action, days, q, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <PageHeader title="Audit Log" sub="A chronological record of who did what, and when. Newest first." />

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard icon="file" label="Events in the last 24 hours" value={data.stats.last24h} />
            <StatCard icon="shield" label="Failed logins in the last 24 hours" value={data.stats.failedLogin24h} warn={data.stats.failedLogin24h > 0} />
            <StatCard icon="users" label="Administrator actions in the last 7 days" value={data.stats.adminActions7d} />
          </div>
        )}

        <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="field-label">Search by actor</label>
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Actor email" />
          </div>
          <div className="w-56">
            <label className="field-label">Action</label>
            <select className="field" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
              <option value="">All actions</option>
              {actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="field-label">Time period</label>
            <select className="field" value={days} onChange={(e) => { setDays(e.target.value); setPage(1); }}>
              <option value="">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
            </select>
          </div>
        </div>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left text-[#6E6E78] border-b border-border">
                    <th className="px-5 py-3.5 font-semibold">Time</th>
                    <th className="px-5 py-3.5 font-semibold">Actor</th>
                    <th className="px-5 py-3.5 font-semibold">Action</th>
                    <th className="px-5 py-3.5 font-semibold">Target</th>
                    <th className="px-5 py-3.5 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((l) => (
                    <tr key={l.id} className="border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors align-top">
                      <td className="px-5 py-3 text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-KE')}</td>
                      <td className="px-5 py-3 text-ink">{l.actor ?? 'System'}</td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] font-semibold bg-primary-tint text-primary-dark border border-primary-light rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          {l.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">{l.targetType ?? '-'}</td>
                      <td className="px-5 py-3 text-xs text-muted break-all">{l.metadata ? JSON.stringify(l.metadata) : ''}</td>
                    </tr>
                  ))}
                  {data.logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted">
                        No entries match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} pageSize={data.pageSize} noun="entries" onChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
}