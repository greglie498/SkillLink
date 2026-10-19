import type { Opportunity } from "../data/mockData";

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
}

export function toOpportunity(o: ApiOpportunity): Opportunity {
    return {
        id: o.id,
        title: o.title,
        business: o.business,
        skills: o.skills,
        description: o.description,
        budget: o.compensationAmount
            ? `KES ${Number(o.compensationAmount)?.toLocaleString('en-KE')}`
            : 'Negotiable',
        duration: o.durationWeeks
            ? `${o.durationWeeks} ${o.durationWeeks === 1 ? 'week' : 'weeks'}`
            : 'Flexible',
        deadline: o.deadline,
    };
}