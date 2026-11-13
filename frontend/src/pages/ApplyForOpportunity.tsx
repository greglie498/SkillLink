import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TextAreaField from '../components/TextAreaField';
import { api, ApiError } from '../lib/api';
import { toOpportunity, type ApiOpportunity } from '../lib/opportunities';
import type { Opportunity } from '../data/mockData';
import { validateRequired, validateLength } from '../utils/validation';

interface PortfolioLink {
    id: string;
    title: string;
    url: string;
}

export default function ApplyForOpportunity() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
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
        ])
            .then(([opp, profile]) => {
                if (cancelled) return;
                setOpportunity(toOpportunity(opp));
                setLinks(profile.portfolioLinks);
            })
            .catch((err) => {
                if (cancelled) return;
                setLoadError(
                    err instanceof ApiError && err.status === 404 ? 'Opportunity not found.' : 'Could not load this page.'
                );
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
            <main className="flex-1 p-8 max-w-2xl">
                <Link to={`/opportunities/${id}`} className="text-sm text-muted hover:text-primary mb-4 inline-block">
                    ← Back to opportunity
                </Link>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {loadError && <p className="text-sm text-error">{loadError}</p>}

                {opportunity && (
                    <>
                        <header className="mb-6">
                            <h1 className="text-2xl font-bold text-ink">Apply: {opportunity.title}</h1>
                            <p className="text-sm text-muted">
                                {opportunity.business} · {opportunity.budget} · due {opportunity.deadline}
                            </p>
                        </header>

                        <form
                            onSubmit={handleSubmit}
                            noValidate
                            className="bg-white border border-border rounded-card p-6 shadow-sm"
                        >
                            {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                            <TextAreaField
                                label="Proposal: why are you a good fit?"
                                value={proposal}
                                onChange={setProposal}
                                error={proposalError}
                                maxLength={1000}
                            />

                            {links.length > 0 && (
                                <fieldset className="mb-4">
                                    <legend className="block text-sm font-medium text-ink mb-2">
                                        Attach portfolio links (optional)
                                    </legend>
                                    <div className="flex flex-col gap-2">
                                        {links.map((link) => (
                                            <label key={link.id} className="flex items-center gap-2 text-sm text-ink cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(link.id)}
                                                    onChange={() => toggleLink(link.id)}
                                                />
                                                <span>{link.title}</span>
                                                <span className="text-xs text-muted truncate">{link.url}</span>
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
                            >
                                {submitting ? 'Submitting...' : 'Submit application'}
                            </button>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
}