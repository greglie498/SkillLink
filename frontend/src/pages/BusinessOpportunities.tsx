import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api, ApiError } from '../lib/api';
import { opportunityStatusLabel, opportunityStatusStyle, type BusinessOpportunity } from '../lib/business';

interface BusinessProfileDto {
  organisationName: string;
  verification: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export default function BusinessOpportunities() {
    const [items, setItems] = useState<BusinessOpportunity[]>([]);
    const [profile, setProfile] = useState<BusinessProfileDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
        const [list, p] = await Promise.all([
            api<BusinessOpportunity[]>('/business/opportunities', { auth: true }),
            api<BusinessProfileDto>('/business/profile', { auth: true }),
        ]);
        setItems(list);
        setProfile(p);
        setError(null);
        } catch {
            setError('Could not load your opportunities.');
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
        setNotice(
            err instanceof ApiError ? (err.fieldErrors?.deadline ?? err.message) : 'Could not reach the server.'
        );
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 p-8">
            <header className="mb-6 flex justify-between items-start gap-4">
            <div>
                <h1 className="text-2xl font-bold text-ink">My Opportunities</h1>
                <p className="text-sm text-muted">{profile ? profile.organisationName : 'Your posted opportunities'}</p>
            </div>
            <Link
                to="/business/opportunities/new"
                className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
                New opportunity
            </Link>
            </header>

            {profile && profile.verification !== 'VERIFIED' && (
            <p className="text-sm text-ink bg-warning/10 border border-warning/30 rounded-md px-4 py-3 mb-4">
                Your business is {profile.verification === 'PENDING' ? 'awaiting verification' : 'not verified'}. You can
                create drafts, but you can only publish once an administrator verifies your business.
            </p>
            )}
            {notice && <p className="text-sm text-error mb-4">{notice}</p>}
            {loading && <p className="text-sm text-muted">Loading...</p>}
            {error && <p className="text-sm text-error">{error}</p>}

            {!loading && !error && items.length === 0 && (
            <p className="text-sm text-muted">You have not created any opportunities yet.</p>
            )}

            {items.length > 0 && (
            <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
                <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Deadline</th>
                    <th className="px-6 py-3 font-medium">Applicants</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3 text-ink font-medium">{o.title}</td>
                        <td className="px-6 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${opportunityStatusStyle[o.status]}`}>
                            {opportunityStatusLabel[o.status]}
                        </span>
                        </td>
                        <td className="px-6 py-3 text-muted">{o.deadline}</td>
                        <td className="px-6 py-3">
                        <Link to={`/business/opportunities/${o.id}/applicants`} className="text-primary font-medium">
                            {o.applicants} view
                        </Link>
                        </td>
                        <td className="px-6 py-3">
                        {o.status === 'DRAFT' && (
                            <button
                            onClick={() => changeStatus(o.id, 'PUBLISHED')}
                            className="text-xs font-medium text-primary hover:text-primary-dark"
                            >
                            Publish
                            </button>
                        )}
                        {o.status === 'PUBLISHED' && (
                            <button
                            onClick={() => changeStatus(o.id, 'CLOSED')}
                            className="text-xs font-medium text-error"
                            >
                            Close
                            </button>
                        )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </main>
        </div>
    );
}