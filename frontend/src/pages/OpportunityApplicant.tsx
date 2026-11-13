import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MatchBadge from '../components/MatchBadge';
import { api, ApiError } from '../lib/api';
import { statusLabel, statusStyle } from '../lib/application';
import type { Applicant, ApplicantsResponse } from '../lib/business';

const isSafeLink = (url: string) => /^https?:\/\//i.test(url);

export default function OpportunityApplicants() {
    const { id } = useParams();
    const [data, setData] = useState<ApplicantsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setData(await api<ApplicantsResponse>(`/business/opportunities/${id}/applications`, { auth: true }));
            setError(null);
        } catch (err) {
            setError(
                err instanceof ApiError && err.status === 404 ? 'Opportunity not found.' : 'Could not load applicants.'
            );
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function decide(a: Applicant, status: 'SHORTLISTED' | 'REJECTED' | 'SELECTED') {
        const verb = { SHORTLISTED: 'shortlist', REJECTED: 'reject', SELECTED: 'select' }[status];
        if (!window.confirm(`Are you sure you want to ${verb} ${a.talent.name}?`)) return;

        setActionError(null);
        try {
            await api(`/business/applications/${a.id}/status`, { method: 'PATCH', auth: true, body: { status } });
            await load();
        } catch (err) {
            setActionError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8 max-w-4xl">
                <Link to="/business" className="text-sm text-muted hover:text-primary mb-4 inline-block">
                ← Back to opportunities
                </Link>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {data && (
                    <>
                        <header className="mb-6">
                        <h1 className="text-2xl font-bold text-ink">Applicants: {data.opportunity.title}</h1>
                        <p className="text-sm text-muted mb-2">
                            Ranked by how many of the required skills each applicant has. The decision is yours.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {data.opportunity.requiredSkills.map((s) => (
                            <span key={s} className="text-xs bg-white border border-border rounded-full px-3 py-1 text-ink">
                                {s}
                            </span>
                            ))}
                        </div>
                        </header>

                        {actionError && <p className="text-sm text-error mb-4">{actionError}</p>}
                        {data.applications.length === 0 && <p className="text-sm text-muted">No applications yet.</p>}

                        <div className="flex flex-col gap-4">
                        {data.applications.map((a) => (
                            <div key={a.id} className="bg-white border border-border rounded-card p-6 shadow-sm">
                                <div className="flex justify-between items-start gap-3 mb-1">
                                    <div>
                                    <h2 className="text-lg font-semibold text-ink">{a.talent.name}</h2>
                                    <p className="text-sm text-muted">{a.talent.headline ?? 'No headline'}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                    <MatchBadge score={a.matchScore} />
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[a.status]}`}>
                                        {statusLabel[a.status]}
                                    </span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted mb-3">
                                    {[a.talent.location, a.talent.availability].filter(Boolean).join(' · ') || 'No location or availability listed'}
                                </p>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {a.matchedSkills.map((s) => (
                                    <span key={s} className="text-xs bg-success/10 text-success rounded-full px-3 py-1">
                                        {s}
                                    </span>
                                    ))}
                                    {a.missingSkills.map((s) => (
                                    <span key={s} className="text-xs bg-surface text-muted rounded-full px-3 py-1">
                                        missing: {s}
                                    </span>
                                    ))}
                                </div>

                                <p className="text-sm text-ink mb-3 whitespace-pre-line">{a.proposal}</p>

                                {a.portfolioLinks.length > 0 && (
                                    <div className="flex flex-wrap gap-3 mb-3 text-sm">
                                    {a.portfolioLinks.map((l) =>
                                        isSafeLink(l.url) ? (
                                        <a
                                            key={l.url}
                                            href={l.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary font-medium"
                                        >
                                            {l.title}
                                        </a>
                                        ) : (
                                        <span key={l.url} className="text-muted">
                                            {l.title}
                                        </span>
                                        )
                                    )}
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    {a.status === 'SUBMITTED' && (
                                    <button
                                        onClick={() => decide(a, 'SHORTLISTED')}
                                        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
                                    >
                                        Shortlist
                                    </button>
                                    )}
                                    {a.status === 'SHORTLISTED' && (
                                    <button
                                        onClick={() => decide(a, 'SELECTED')}
                                        className="bg-success text-white text-sm font-medium px-4 py-2 rounded-md"
                                    >
                                        Select
                                    </button>
                                    )}
                                    {(a.status === 'SUBMITTED' || a.status === 'SHORTLISTED') && (
                                    <button
                                        onClick={() => decide(a, 'REJECTED')}
                                        className="border border-error text-error text-sm font-medium px-4 py-2 rounded-md"
                                    >
                                        Reject
                                    </button>
                                    )}
                                </div>
                            </div>
                        ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}