import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Pager from '../components/Pager';
import { api, ApiError } from '../lib/api';
import { getUser } from '../lib/auth';
import { count, type AdminSummary, type AdminUser } from '../lib/reports';

interface UsersResponse {
  total: number;
  page: number;
  pageSize: number;
  users: AdminUser[];
}

const statusStyle: Record<AdminUser['status'], string> = {
  ACTIVE: 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]',
  SUSPENDED: 'bg-[#FDEEEE] text-[#B83A3A] border border-[#F5CCCC]',
  DEACTIVATED: 'bg-[#F2F2F5] text-[#60606B] border border-transparent',
};

export default function AdminUsers() {
  const me = getUser();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Wait for a pause in typing before searching
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api<AdminSummary>('/admin/reports/summary', { auth: true })
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) });
    if (role) params.set('role', role);
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    try {
      setData(await api<UsersResponse>(`/admin/users?${params.toString()}`, { auth: true }));
      setError(null);
    } catch {
      setError('Could not load users.');
    } finally {
      setLoading(false);
    }
  }, [role, status, q, page]);

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

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <PageHeader title="User Management" sub="Suspending a user blocks their access immediately." />

        {summary && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard icon="users" label="Total users" value={summary.users.total} />
            <StatCard icon="user" label="Talent" value={count(summary.users.byRole, 'TALENT')} />
            <StatCard icon="briefcase" label="Businesses" value={count(summary.users.byRole, 'BUSINESS')} />
          </div>
        )}

        <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="field-label">Search</label>
            <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Email address" />
          </div>
          <div className="w-40">
            <label className="field-label">User type</label>
            <select className="field" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="TALENT">Talent</option>
              <option value="BUSINESS">Business</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="w-40">
            <label className="field-label">Status</label>
            <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DEACTIVATED">Deactivated</option>
            </select>
          </div>
        </div>

        {notice && <p className="text-sm text-error mb-4">{notice}</p>}
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface text-left text-[#6E6E78] border-b border-border">
                    <th className="px-5 py-3.5 font-semibold">User</th>
                    <th className="px-5 py-3.5 font-semibold">Type</th>
                    <th className="px-5 py-3.5 font-semibold">Joined</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => (
                    <tr key={u.id} className="border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink">{u.name ?? 'No profile name'}</p>
                        <p className="text-xs text-muted">{u.email}</p>
                      </td>
                      <td className="px-5 py-4 text-[#454550] capitalize">{u.role.toLowerCase()}</td>
                      <td className="px-5 py-4 text-muted">{new Date(u.createdAt).toLocaleDateString('en-KE')}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyle[u.status]}`}>{u.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {u.role !== 'ADMIN' && u.id !== me?.id && u.status === 'ACTIVE' && (
                          <button onClick={() => changeStatus(u, 'SUSPENDED')} className="text-xs font-semibold text-error">
                            Suspend
                          </button>
                        )}
                        {u.role !== 'ADMIN' && u.id !== me?.id && u.status === 'SUSPENDED' && (
                          <button onClick={() => changeStatus(u, 'ACTIVE')} className="text-xs font-semibold text-success">
                            Restore
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted">
                        No users match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} pageSize={data.pageSize} noun="users" onChange={setPage} />
          </>
        )}
      </main>
    </div>
  );
}