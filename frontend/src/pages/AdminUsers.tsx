import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { api, ApiError } from '../lib/api';
import { getUser } from '../lib/auth';
import type { AdminUser } from '../lib/reports';

interface UsersResponse {
  total: number;
  page: number;
  pageSize: number;
  users: AdminUser[];
}

const roleOptions = ['', 'TALENT', 'BUSINESS', 'ADMIN'];
const statusOptions = ['', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'];

const statusStyle: Record<AdminUser['status'], string> = {
  ACTIVE: 'bg-success/10 text-success',
  SUSPENDED: 'bg-error/10 text-error',
  DEACTIVATED: 'bg-surface text-muted',
};

export default function AdminUsers() {
  const me = getUser();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    try {
      setData(await api<UsersResponse>(`/admin/users?${params.toString()}`, { auth: true }));
      setError(null);
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [role, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(u: AdminUser, next: 'ACTIVE' | 'SUSPENDED') {
    const verb = next === 'SUSPENDED' ? 'suspend' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${verb} ${u.email}?`)) return;
    setNotice(null);
    try {
      await api(`/admin/users/${u.id}/status`, { method: 'PATCH', auth: true, body: { status: next } });
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const selectClass = 'border border-border rounded-md px-3 py-2 text-sm text-ink bg-white';

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">User Management</h1>
          <p className="text-sm text-muted">Suspending a user blocks their token immediately.</p>
        </header>

        <div className="flex flex-wrap gap-3 mb-4">
          <select className={selectClass} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>{r || 'All roles'}</option>
            ))}
          </select>
          <select className={selectClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>
        </div>

        {notice && <p className="text-sm text-error mb-4">{notice}</p>}
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Joined</th>
                    <th className="px-6 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-3 text-ink">{u.email}</td>
                      <td className="px-6 py-3 text-ink">{u.role}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[u.status]}`}>{u.status}</span>
                      </td>
                      <td className="px-6 py-3 text-muted">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
                      <td className="px-6 py-3">
                        {u.role !== 'ADMIN' && u.id !== me?.id && u.status === 'ACTIVE' && (
                          <button onClick={() => changeStatus(u, 'SUSPENDED')} className="text-xs font-medium text-error">
                            Suspend
                          </button>
                        )}
                        {u.role !== 'ADMIN' && u.id !== me?.id && u.status === 'SUSPENDED' && (
                          <button onClick={() => changeStatus(u, 'ACTIVE')} className="text-xs font-medium text-success">
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3 mt-4 text-sm text-muted">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-40 text-primary font-medium">
                Previous
              </button>
              <span>Page {page} of {pages} ({data.total} users)</span>
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