import type { Opportunity } from "../data/mockData";
import type {RatingDto} from "../components/RatingBadge";

export interface ApiOpportunity {
    id: string;
    title: string;
    description: string;
    business: string;
    category: string;
    type: string;
    skills: string[];
    compensationAmount: string | null;
    durationWeeks: number | null;
    isRemote: boolean;
    location: string | null;
    deadline: string;
    matchScore?: number;
    matchedSkills?: string[];
    businessRating?: RatingDto | null;
}

export interface MatchDto {
    score:  number;
    matchedSkills: string[];
    missingSkills: string[];
}

export function formatBudget(amount: string | null): string {
    return amount ? `KES ${Number(amount).toLocaleString('en-KE')}` : 'Negotiable';
}

export function formatDuration(weeks: number | null): string {
    if (!weeks) return 'Flexible';
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
}

export function toOpportunity(o: ApiOpportunity): Opportunity {
    return {
        id: o.id,
        title: o.title,
        business: o.business,
        skills: o.skills,
        description: o.description,
        matchScore: o.matchScore,
        matchedSkills: o.matchedSkills,
        budget: formatBudget(o.compensationAmount),
        duration: formatDuration(o.durationWeeks),
        deadline: o.deadline,
        businessRating: o.businessRating ?? null,
    };
}