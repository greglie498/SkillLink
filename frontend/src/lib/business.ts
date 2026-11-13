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
    DRAFT: 'bg-surface text-muted',
    PUBLISHED: 'bg-success/10 text-success',
    CLOSED: 'bg-warning/10 text-warning',
    ARCHIVED: 'bg-surface text-muted',
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