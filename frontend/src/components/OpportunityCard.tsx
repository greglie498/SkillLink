import { Link } from 'react-router-dom';
import MatchBadge from './MatchBadge';
import type { Opportunity } from '../data/mockData';
import RatingBadge from './RatingBadge';

const chip = 'text-xs bg-surface border border-border rounded-full px-2.5 py-0.5 text-ink';

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
    const initial = opportunity.business.charAt(0).toUpperCase();

    return (
        <div className="bg-white border border-[#E8E8ED] rounded-card p-5 shadow-sm hover:shadow-lift hover:-translate-y-0.5 transition-all flex flex-col">
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary font-bold flex items-center justify-center shrink-0">
                {initial}
                </div>
                <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-bold text-slate-dark leading-snug">{opportunity.title}</h3>
                <p className="text-xs text-muted mt-0.5">{opportunity.business}</p>
                </div>
                {opportunity.matchScore !== undefined && (
                <div className="shrink-0">
                    <MatchBadge score={opportunity.matchScore} />
                </div>
                )}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
                {opportunity.skills.map((skill) => (
                    <span key={skill} className={chip}>
                        {skill}
                    </span>
                ))}
            </div>

            {opportunity.matchedSkills && opportunity.matchedSkills.length > 0 && (
                <p className="text-xs text-muted mt-3">Matches your skills: {opportunity.matchedSkills.join(', ')}</p>
            )}

            <div className='mt-1'>
                <RatingBadge rating={opportunity.businessRating} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#EEEEF1] text-xs">
                <div>
                    <p className="text-muted">Budget</p>
                    <p className="font-semibold text-ink mt-0.5">{opportunity.budget}</p>
                </div>
                <div>
                    <p className="text-muted">Duration</p>
                    <p className="font-semibold text-ink mt-0.5">{opportunity.duration}</p>
                </div>
                <div>
                    <p className="text-muted">Due</p>
                    <p className="font-semibold text-ink mt-0.5">{opportunity.deadline}</p>
                </div>
            </div>

            <Link to={`/opportunities/${opportunity.id}`} className="btn btn-secondary btn-sm w-full mt-5">
                View details
            </Link>
        </div>
    );
}