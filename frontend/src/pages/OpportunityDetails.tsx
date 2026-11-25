import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MatchBadge from '../components/MatchBadge';
import { api, ApiError } from '../lib/api';
import { formatBudget, formatDuration, type ApiOpportunity, type MatchDto } from '../lib/opportunities';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';
import RatingBadge from '../components/RatingBadge';

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm';
const pill = 'text-xs border border-border rounded-full px-2.5 py-0.5 bg-white text-[#60606B]';

export default function OpportunityDetails() {
    const { id } = useParams();
    const [opp, setOpp] = useState<ApiOpportunity | null>(null);
    const [match, setMatch] = useState<MatchDto | null>(null);
    const [application, setApplication] = useState<ApplicationDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        api<ApiOpportunity>(`/opportunities/${id}`)
            .then((d) => {
                if (!cancelled) setOpp(d);
        })
        .catch((err) => {
            if (cancelled) return;
            setError(
                err instanceof ApiError && err.status === 404 ? 'Opportunity not found.' : 'Could not load this opportunity.'
            );
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });

        api<MatchDto>(`/talent/opportunities/${id}/match`, { auth: true })
        .then((m) => {
            if (!cancelled) setMatch(m);
        })
        .catch(() => {
            /* the page works without the match card */
        });

        api<ApplicationDto[]>('/applications', { auth: true })
        .then((list) => {
            if (!cancelled) setApplication(list.find((a) => a.opportunityId === id) ?? null);
        })
        .catch(() => {
            /* the page works without the application status */
        });

        return () => {
        cancelled = true;
        };
    }, [id]);

    const closed = opp ? opp.deadline < new Date().toISOString().slice(0, 10) : false;
    const matchedSet = new Set((match?.matchedSkills ?? []).map((s) => s.toLowerCase()));

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8">
                <Link to="/opportunities" className="text-sm text-muted hover:text-primary mb-5 inline-block">
                    &larr; Back to opportunities
                </Link>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {opp && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                    <div className={`${card} p-6`}>
                        <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-tint text-primary text-xl font-bold flex items-center justify-center shrink-0">
                            {opp.business.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-deep">{opp.title}</h1>
                            <p className="text-sm text-muted mt-1">
                            {opp.business}
                            {opp.location ? ` - ${opp.location}` : ''}
                            </p>
                            <div className='mt-2'>
                                <RatingBadge rating={opp.businessRating} />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                            <span className={pill}>{opp.type}</span>
                            <span className={pill}>{opp.isRemote ? 'Remote' : 'On-site'}</span>
                            <span className={pill}>{opp.category}</span>
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className={`${card} p-6`}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-3">About this opportunity</h2>
                        <p className="text-sm leading-6 text-[#454550] whitespace-pre-line">{opp.description}</p>
                    </div>

                    <div className={`${card} p-6`}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-3">Required skills</h2>
                        <div className="flex flex-wrap gap-2">
                        {opp.skills.map((s) => (
                            <span
                            key={s}
                            className={`text-xs font-medium rounded-full px-3 py-1 border ${
                                matchedSet.has(s.toLowerCase())
                                ? 'bg-[#EAF7F0] text-[#237D50] border-[#C7EAD7]'
                                : 'bg-primary-tint text-primary-dark border-primary-light'
                            }`}
                            >
                            {s}
                            </span>
                        ))}
                        </div>
                        {match && <p className="text-xs text-muted mt-3">Green skills are ones you already have.</p>}
                    </div>
                    </div>

                    <aside className="space-y-6">
                    <div className={`${card} p-5`}>
                        {application ? (
                        <div className="text-center">
                            <p className="text-xs text-muted mb-2">Your application</p>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[application.status]}`}>
                            {statusLabel[application.status]}
                            </span>
                            <Link to="/applications" className="block mt-4 text-[13px] font-semibold text-primary-dark">
                            View your applications
                            </Link>
                        </div>
                        ) : closed ? (
                        <p className="text-sm text-muted text-center">Applications for this opportunity have closed.</p>
                        ) : (
                        <Link to={`/opportunities/${opp.id}/apply`} className="btn btn-primary w-full">
                            Apply now
                        </Link>
                        )}
                    </div>

                    {match && (
                        <div className={`${card} p-5`}>
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                            <p className="text-sm font-bold text-slate-dark">Your skills match</p>
                            <p className="text-[11px] text-muted mt-0.5">Based on your current profile</p>
                            </div>
                            <MatchBadge score={match.score} />
                        </div>
                        <div className="flex justify-between text-[11px] mb-1.5">
                            <span className="text-[#60606B]">Required skills you have</span>
                            <span className="font-bold text-slate-dark">
                            {match.matchedSkills.length} of {match.matchedSkills.length + match.missingSkills.length}
                            </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#EEEEF1] overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${match.score}%` }} />
                        </div>
                        {match.matchedSkills.length > 0 && (
                            <div className="mt-4">
                            <p className="text-[11px] font-semibold text-[#60606B] mb-2">Matched skills</p>
                            <div className="flex flex-wrap gap-1.5">
                                {match.matchedSkills.map((s) => (
                                <span key={s} className="text-xs bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7] rounded-full px-2.5 py-0.5">
                                    {s}
                                </span>
                                ))}
                            </div>
                            </div>
                        )}
                        {match.missingSkills.length > 0 && (
                            <div className="mt-3">
                            <p className="text-[11px] font-semibold text-[#60606B] mb-2">Skills you could add</p>
                            <div className="flex flex-wrap gap-1.5">
                                {match.missingSkills.map((s) => (
                                <span key={s} className={pill}>
                                    {s}
                                </span>
                                ))}
                            </div>
                            </div>
                        )}
                        <p className="text-[11px] text-muted mt-4 pt-3 border-t border-[#EEEEF1]">
                            The score looks at skills only. The business makes the final decision.
                        </p>
                        </div>
                    )}

                    <div className={`${card} p-5`}>
                        <dl className="space-y-3 text-sm">
                        {[
                            ['Budget', formatBudget(opp.compensationAmount)],
                            ['Duration', formatDuration(opp.durationWeeks)],
                            ['Work mode', opp.isRemote ? 'Remote' : 'On-site'],
                            ['Location', opp.location ?? 'Not specified'],
                            ['Deadline', opp.deadline],
                        ].map(([k, v]) => (
                            <div key={k} className="flex justify-between gap-3">
                            <dt className="text-muted">{k}</dt>
                            <dd className="font-semibold text-ink text-right">{v}</dd>
                            </div>
                        ))}
                        </dl>
                    </div>
                    </aside>
                </div>
                )}
            </main>
        </div>
    );
}