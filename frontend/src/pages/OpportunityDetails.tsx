import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MatchBadge from '../components/MatchBadge';
import { type Opportunity } from '../data/mockData';
import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import { type ApiOpportunity, toOpportunity } from '../lib/opportunities';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';

export default function OpportunityDetails() {
    const { id } = useParams();
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [application, setApplication] = useState<ApplicationDto | null>(null);
    const [loading, setLoading] = useState(true);
    const[error, setError] = useState<string | null>(null);
 
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        api<ApiOpportunity>(`/opportunities/${id}`)
            .then((data) => {
                if (cancelled) setOpportunity(toOpportunity(data));
            })
            .catch ((err) => {
                if (cancelled) return;
                setError(
                    err instanceof ApiError && err.status === 404
                        ? 'Opportunity not found.'
                        : 'Could not load this opportunity.'
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        api<ApplicationDto[]>('/applications', { auth: true })
            .then((list) => {
                if (!cancelled) setApplication(list.find((a) => a.opportunityId === id) ?? null);
            })
            .catch(() => {
                /* the page still works without the application status */
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const closed = opportunity ? opportunity.deadline < new Date().toISOString().slice(0, 10) : false;

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8 max-w-3xl">
                <Link to="/opportunities" className="text-sm text-muted hover:text-primary mb-4 inline-block">
                    &larr; Back to Find Opportunities
                </Link>

               {loading && <p className='text-sm text-muted'>Loading...</p>}
               {error && <p className='text-sm text-error'>{error}</p>}

               {opportunity && (
                <div className='bg-white border border-border rounded-card p-8 shadow-sm'>
                    <div className='flex justify-between items-start mb-2'>
                        <h1 className='text-2xl font-bold text-ink'>{opportunity.title}</h1>
                        {opportunity.matchScore !== undefined && <MatchBadge score={opportunity.matchScore} />}
                    </div>
                    <p className='text-sm text-muted mb-6'>{opportunity.business}</p>

                    <div className='flex flex-wrap gap-2 mb-6'>
                        {opportunity.skills.map((skill) => (
                            <span key={skill} className='text-xs bg-surface border border-border rounded-full px-3 py-1 text-ink'>
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div className='grid grid-cols-3 gap-4 mb-6 text-sm'>
                        <div>
                            <p className='text-muted mb-1'>Budget</p>
                            <p className='font-semibold text-ink'>{opportunity.budget}</p>
                        </div>
                        <div>
                            <p className='text-muted mb-1'>Duration</p>
                            <p className='font-semibold text-ink'>{opportunity.duration}</p>
                        </div>
                        <div>
                            <p className='text-muted mb-1'>Deadline</p>
                            <p className='font-semibold text-ink'>{opportunity.deadline}</p>
                        </div>
                    </div>

                    <p className='text-sm text-ink mb-6'>{opportunity.description}</p>

                    {application ? (
                        <div className='flex items-center gap-3'>
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[application.status]}`}>
                                {statusLabel[application.status]}
                            </span>
                            <Link to="/application" className='text-sm text-primary font-medium'>
                                View your applications
                            </Link>
                        </div>
                    ) : closed ? (
                        <p className='text-sm text-muted'>Application for this opportunity have closed.</p>
                    ) : (
                        <Link
                            to={`/opportunities/${opportunity.id}/apply`}
                            className='inline-block bg-primary hover:bg-primary-dark text-white text-center text-sm font-medium px-6 py-2.5 rounded-md transition-colors'
                        >
                            Apply for this opportunity
                        </Link>
                    )}
                </div>
               )}
            </main>
        </div>
    );
}

