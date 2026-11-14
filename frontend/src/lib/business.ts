export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export interface BusinessOpportunity {
    id: string;
    title: string;
    status: OpportunityStatus;
    deadline: string;
    createdAt: string;
    applicants: number;
}

export const opportunityStatusLabel: Record<OpportunityStatus, string> = {
    DRAFT: 'Draft',
    PUBLISHED: 'Published',
    CLOSED: 'Closed',
    ARCHIVED: 'Archived',
};

export const opportunityStatusStyle: Record<OpportunityStatus, string> = {
    DRAFT: 'bg-[#FFF6E5] text-[#A66E12] border border-[#F5DFB4]',
    PUBLISHED: 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]',
    CLOSED: 'bg-[#F2F2F5] text-[#60606B] border border-transparent',
    ARCHIVED: 'bg-[#F2F2F5] text-[#60606B] border border-transparent',
};

export interface Applicant {
    id: string;
    status: 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
    proposal: string;
    appliedAt: string;
    talent: {
        name: string;
        headline: string | null;
        location: string | null;
        availability: string | null;
        skills: {name: string; profienciency: string }[];
    };
    portfolioLinks: { title: string, url: string }[];
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
}

export interface ApplicantsResponse {
    opportunity: { id: string; title: string; status: OpportunityStatus; requiredSkills: string[] };
    applications: Applicant[];
}