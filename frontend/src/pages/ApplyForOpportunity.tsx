import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import TextAreaField from '../components/TextAreaField';
import { api, ApiError } from '../lib/api';
import { formatBudget, type ApiOpportunity, type MatchDto } from '../lib/opportunities';
import { validateRequired, validateLength } from '../utils/validation';

interface PortfolioLink {
  id: string;
  title: string;
  url: string;
}

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6';

export default function ApplyForOpportunity() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [opp, setOpp] = useState<ApiOpportunity | null>(null);
    const [match, setMatch] = useState<MatchDto | null>(null);
    const [links, setLinks] = useState<PortfolioLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [proposal, setProposal] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [proposalError, setProposalError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
        api<ApiOpportunity>(`/opportunities/${id}`),
        api<{ portfolioLinks: PortfolioLink[] }>('/talent/profile', { auth: true }),
        api<MatchDto>(`/talent/opportunities/${id}/match`, { auth: true }).catch(() => null),
        ])
        .then(([o, profile, m]) => {
            if (cancelled) return;
            setOpp(o);
            setLinks(profile.portfolioLinks);
            setMatch(m);
        })
        .catch((err) => {
            if (cancelled) return;
            setLoadError(err instanceof ApiError && err.status === 404 ? 'Opportunity not found.' : 'Could not load this page.');
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
        cancelled = true;
        };
    }, [id]);

    function toggleLink(linkId: string) {
        setSelected((prev) => (prev.includes(linkId) ? prev.filter((x) => x !== linkId) : [...prev, linkId]));
    }

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        const problem = validateRequired(proposal, 'Proposal') ?? validateLength(proposal.trim(), 'Proposal', 20, 1000);
        setProposalError(problem);
        if (problem) return;

        setSubmitting(true);
        try {
        await api('/applications', {
            method: 'POST',
            auth: true,
            body: { opportunityId: id, proposal: proposal.trim(), portfolioLinkIds: selected },
        });
        navigate('/applications');
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setProposalError(err.fieldErrors.proposal ?? null);
            setFormError(err.fieldErrors.portfolioLinkIds ?? err.fieldErrors.opportunityId ?? null);
        } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
        setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-3xl">
                <Link to={`/opportunities/${id}`} className="text-sm text-muted hover:text-primary mb-5 inline-block">
                &larr; Back to opportunity
                </Link>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {loadError && <p className="text-sm text-error">{loadError}</p>}

                {opp && (
                <>
                    <PageHeader
                    title={`Apply: ${opp.title}`}
                    sub={`${opp.business} - Deadline ${opp.deadline} - ${formatBudget(opp.compensationAmount)}`}
                    />

                    <form onSubmit={handleSubmit} noValidate className="space-y-6">
                    {formError && <p className="text-sm text-error">{formError}</p>}

                    <div className={card}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-4">Cover message</h2>
                        <TextAreaField
                        label="Why are you a good fit for this opportunity?"
                        value={proposal}
                        onChange={setProposal}
                        error={proposalError}
                        maxLength={1000}
                        />
                        <p className="text-xs text-muted -mt-2">Mention the skills and experience that are relevant to this work.</p>
                    </div>

                    {match && (
                        <div className={card}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-1">Your matching skills</h2>
                        <p className="text-xs text-muted mb-4">
                            Skills from your profile that this opportunity asks for. The business sees them with your application.
                        </p>
                        {match.matchedSkills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                            {match.matchedSkills.map((s) => (
                                <span key={s} className="text-xs font-medium bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7] rounded-full px-3 py-1">
                                {s}
                                </span>
                            ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted">None of your current skills match. You can still apply.</p>
                        )}
                        {match.missingSkills.length > 0 && (
                            <p className="text-xs text-muted mt-3">Not on your profile yet: {match.missingSkills.join(', ')}</p>
                        )}
                        </div>
                    )}

                    <div className={card}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-4">Portfolio links</h2>
                        {links.length === 0 ? (
                        <p className="text-sm text-muted">
                            You have no portfolio links on your profile yet, so there is nothing to attach.
                        </p>
                        ) : (
                        <div className="space-y-2">
                            {links.map((link) => (
                            <label
                                key={link.id}
                                className="flex items-center gap-3 p-3 border border-border rounded-lg text-sm text-ink cursor-pointer hover:border-primary transition-colors"
                            >
                                <input type="checkbox" checked={selected.includes(link.id)} onChange={() => toggleLink(link.id)} />
                                <span className="font-medium">{link.title}</span>
                                <span className="text-xs text-muted truncate">{link.url}</span>
                            </label>
                            ))}
                        </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="submit" disabled={submitting} className="btn btn-primary btn-lg px-8">
                        {submitting ? 'Submitting...' : 'Submit application'}
                        </button>
                        <Link to={`/opportunities/${id}`} className="btn btn-secondary btn-lg">
                        Cancel
                        </Link>
                    </div>
                    </form>
                </>
                )}
            </main>
        </div>
    );
}