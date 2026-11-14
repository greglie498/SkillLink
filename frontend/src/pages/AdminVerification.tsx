import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { api, ApiError } from '../lib/api';
import { verificationStyle, verificationLabel } from '../lib/business';
import { count, type AdminSummary, type PendingBusiness } from '../lib/reports';

type Tab = 'PENDING' | 'VERIFIED' | 'REJECTED';

const isSafeLink = (url: string) => /^https?:\/\//i.test(url);

export default function AdminVerification() {
    const [tab, setTab] = useState<Tab>('PENDING');
    const [summary, setSummary] = useState<AdminSummary | null>(null);
    const [list, setList] = useState<PendingBusiness[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
        const [s, l] = await Promise.all([
            api<AdminSummary>('/admin/reports/summary', { auth: true }),
            api<PendingBusiness[]>(`/admin/businesses?verification=${tab}`, { auth: true }),
        ]);
        setSummary(s);
        setList(l);
        setError(null);
        } catch {
        setError('Could not load the verification queue.');
        } finally {
        setLoading(false);
        }
    }, [tab]);

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

    const by = summary?.businesses.byVerification;
    const tabs: { key: Tab; label: string }[] = [
        { key: 'PENDING', label: 'Pending' },
        { key: 'VERIFIED', label: 'Verified' },
        { key: 'REJECTED', label: 'Rejected' },
    ];

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-4xl">
                <PageHeader title="Verification Queue" sub="Review the registration documents businesses submit before they can publish." />

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard icon="shield" label="Pending" value={count(by, 'PENDING')} warn={count(by, 'PENDING') > 0} />
                    <StatCard icon="check" label="Verified" value={count(by, 'VERIFIED')} />
                    <StatCard icon="file" label="Rejected" value={count(by, 'REJECTED')} />
                </div>

                <div className="flex gap-1 mb-5 border-b border-border">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-5 py-2.5 text-sm -mb-px border-b-2 transition-colors ${
                            tab === t.key ? 'border-primary text-slate-dark font-semibold' : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        {t.label} ({count(by, t.key)})
                    </button>
                ))}
                </div>

                {notice && <p className="text-sm text-error mb-4">{notice}</p>}
                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {!loading && !error && list.length === 0 && <p className="text-sm text-muted">Nothing in this list.</p>}

                <div className="space-y-3">
                {list.map((b) => (
                    <div key={b.id} className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-5 flex flex-wrap items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary font-bold flex items-center justify-center shrink-0">
                        {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <p className="text-sm font-bold text-slate-dark">{b.name}</p>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${verificationStyle[b.verification]}`}>
                            {verificationLabel[b.verification]}
                        </span>
                        </div>
                        <p className="text-xs text-muted">
                        {b.email}
                        {[b.industry, b.location].filter(Boolean).length > 0 && ` - ${[b.industry, b.location].filter(Boolean).join(', ')}`}
                        </p>
                        <p className="text-xs text-muted mt-2">
                        {b.submittedAt ? `Submitted ${new Date(b.submittedAt).toLocaleDateString('en-KE')}` : 'No document submitted yet'}
                        </p>
                        {b.documentUrl && isSafeLink(b.documentUrl) && (
                        <a href={b.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-[13px] font-semibold text-primary-dark">
                            View submitted document
                        </a>
                        )}
                    </div>
                    {b.verification === 'PENDING' && (
                        <div className="flex gap-2 shrink-0">
                        <button onClick={() => decide(b, 'VERIFIED')} className="btn btn-primary btn-sm">
                            Approve
                        </button>
                        <button onClick={() => decide(b, 'REJECTED')} className="btn btn-danger btn-sm">
                            Reject
                        </button>
                        </div>
                    )}
                    </div>
                ))}
                </div>
            </main>
        </div>
    );
}