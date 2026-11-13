import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';
import type { AuditRow } from '../lib/reports';

interface AuditResponse {
  total: number;
  page: number;
  pageSize: number;
  logs: AuditRow[];
}

const actions = [
  'USER_REGISTERED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGIN_BLOCKED', 'USER_SUSPENDED', 'USER_REACTIVATED',
  'BUSINESS_VERIFICATION_UPDATED', 'APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'PROJECT_CREATED',
  'REPORT_EXPORTED',
];

export default function AdminAuditLog() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (action) params.set('action', action);
    try {
      setData(await api<AuditResponse>(`/admin/audit-logs?${params.toString()}`, { auth: true }));
      setError(null);
    } catch {
      setError('Could not load the audit log.');
    } finally {
      setLoading(false);
    }
  }, [action, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Audit Log</h1>
          <p className="text-sm text-muted">Who did what, and when. Newest first.</p>
        </header>

        <select
          className="border border-border rounded-md px-3 py-2 text-sm text-ink bg-white mb-4"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
        >
          <option value="">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Actor</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                    <th className="px-6 py-3 font-medium">Target</th>
                    <th className="px-6 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data.logs.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0 align-top">
                      <td className="px-6 py-3 text-muted whitespace-nowrap">{new Date(l.createdAt).toLocaleString('en-KE')}</td>
                      <td className="px-6 py-3 text-ink">{l.actor ?? 'System'}</td>
                      <td className="px-6 py-3 text-ink font-medium">{l.action}</td>
                      <td className="px-6 py-3 text-muted">{l.targetType ?? '-'}</td>
                      <td className="px-6 py-3 text-xs text-muted break-all">{l.metadata ? JSON.stringify(l.metadata) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 mt-4 text-sm text-muted">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40 text-primary font-medium">
                Previous
              </button>
              <span>Page {page} of {pages} ({data.total} entries)</span>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="disabled:opacity-40 text-primary font-medium">
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}