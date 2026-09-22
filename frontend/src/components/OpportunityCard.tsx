import MatchBadge from './MatchBadge';
import type { Opportunity } from '../data/mockData';

export default function OpportunityCard({ opportunity }: {opportunity: Opportunity }) {
    return (
        <div className='bg-white border-border rounded-card p-6 shadow-sm hover:shadow-md transition-shadow'>
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-ink">{opportunity.title}</h3>
                <MatchBadge score={opportunity.matchScore} />
            </div>
            <p className="text-sm text-muted mb-3">{opportunity.business}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {opportunity.skills.map((skill) => (
                    <span
                        key={skill}
                        className="text-xs bg-surface border border-border rounded-full px-3 py-1 text-ink"
                    >
                        {skill}
                    </span>
                ))}
            </div>
            <div className="flex justify-between text-sm text-muted">
                <span>{opportunity.budget}</span>
                <span>{opportunity.duration}</span>
                <span>Due {opportunity.deadline}</span>
            </div>
            <button className="mt-4 w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2 rounded-md transition-colors">
                View Details
            </button>
        </div>
    )
}