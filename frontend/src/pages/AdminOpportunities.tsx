import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Pager from '../components/Pager';
import { api, ApiError } from '../lib/api';
import { opportunityStatusLabel, opportunityStatusStyle } from '../lib/business';
import { count, type AdminOpportunity, type Tally } from '../lib/reports';

interface OppResponse {
  total: number;
  page: number;
  pageSize: number;
  stats: Tally;
  opportunities: AdminOpportunity[];
}

export default function AdminOpportunities() {
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [data, setData] = useState<OppResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => {
        setQ(search.trim());
        setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        const params = new URLSearchParams({ page: String(page) });
        if (status) params.set('status', status);
        if (q) params.set('q', q);
        try {
        setData(await api<OppResponse>(`/admin/opportunities?${params.toString()}`, { auth: true }));
        setError(null);
        } catch {
        setError('Could not load opportunities.');
        } finally {
        setLoading(false);
        }
    }, [status, q, page]);

    useEffect(() => {
        load();
    }, [load]);

    async function unpublish(o: AdminOpportunity) {
        const reason = window.prompt(`Why are you removing "${o.title}"? The business will see this reason.`);
        if (reason === null) return;
        if (reason.trim().length < 5) {
        setNotice('Give a reason of at least 5 characters.');
        return;
        }
        setNotice(null);
        try {
        await api(`/admin/opportunities/${o.id}/status`, {
            method: 'PATCH',
            auth: true,
            body: { status: 'ARCHIVED', reason: reason.trim() },
        });
        await load();
        } catch (err) {
        setNotice(err instanceof ApiError ? (err.fieldErrors?.reason ?? err.message) : 'Could not reach the server.');
        }
    }

    const stats = data?.stats;
    const total = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'].reduce((n, k) => n + count(stats, k), 0);

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8">
                <PageHeader title="Opportunity Management" sub="Review what businesses have posted and remove listings that break the rules." />

                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <StatCard icon="briefcase" label="Total posted" value={total} />
                <StatCard icon="check" label="Published" value={count(stats, 'PUBLISHED')} />
                <StatCard icon="file" label="Closed" value={count(stats, 'CLOSED')} />
                <StatCard icon="shield" label="Archived" value={count(stats, 'ARCHIVED')} />
                </div>

                <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="field-label">Search</label>
                    <input className="field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or business" />
                </div>
                <div className="w-44">
                    <label className="field-label">Status</label>
                    <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ARCHIVED">Archived</option>
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
                                <th className="px-5 py-3.5 font-semibold">Title</th>
                                <th className="px-5 py-3.5 font-semibold">Business</th>
                                <th className="px-5 py-3.5 font-semibold">Type</th>
                                <th className="px-5 py-3.5 font-semibold">Deadline</th>
                                <th className="px-5 py-3.5 font-semibold">Applicants</th>
                                <th className="px-5 py-3.5 font-semibold">Status</th>
                                <th className="px-5 py-3.5 font-semibold">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {data.opportunities.map((o) => (
                                <tr key={o.id} className="border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors">
                                <td className="px-5 py-4 font-semibold text-ink">{o.title}</td>
                                <td className="px-5 py-4 text-[#454550]">{o.business}</td>
                                <td className="px-5 py-4 text-[#454550]">{o.type}</td>
                                <td className="px-5 py-4 text-muted">{o.deadline}</td>
                                <td className="px-5 py-4 text-[#454550]">{o.applicants}</td>
                                <td className="px-5 py-4">
                                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${opportunityStatusStyle[o.status]}`}>
                                    {opportunityStatusLabel[o.status]}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    {o.status === 'PUBLISHED' && (
                                    <button onClick={() => unpublish(o)} className="text-xs font-semibold text-error">
                                        Unpublish
                                    </button>
                                    )}
                                </td>
                                </tr>
                            ))}
                            {data.opportunities.length === 0 && (
                                <tr>
                                <td colSpan={7} className="px-5 py-8 text-center text-muted">
                                    No opportunities match your filters.
                                </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    <Pager page={page} total={data.total} pageSize={data.pageSize} noun="opportunities" onChange={setPage} />
                </>
                )}
            </main>
        </div>
    );
}