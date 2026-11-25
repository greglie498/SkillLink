export type Tally = Record<string, number>;

export const count = (t: Tally | undefined, key: string): number => t?.[key] ?? 0;

export interface AdminSummary {
    users: { total: number; byRole: Tally; byStatus: Tally };
    businesses: { byVerification: Tally };
    opportunities: { total: number; byStatus: Tally, publishedWithoutApplicants: number };
    applications: { total: number; byStatus: Tally; stalled: number};
    projects: { total: number; byStatus: Tally};
    generatedAt: string;
}

export interface PendingBusiness {
    id: string;
    name: string;
    industry: string | null;
    location: string | null;
    verification: 'PENDING' | 'VERIFIED' | 'REJECTED';
    email: string;
    documentUrl: string | null;
    submittedAt: string | null;
}

export interface AdminUser {
    name: string;
    id: string;
    email: string;
    role: 'TALENT' | 'BUSINESS' | 'ADMIN';
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    emailVerified: boolean;
    createdAt: string;
}

export interface AuditStats {
    last24h: number;
    failedLogin24h: number;
    adminActions7d: number;
}

export interface AdminOpportunity {
    id: string;
    title: string;
    business: string;
    category: string;
    type: string;
    status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
    deadline: string;
    applicants: number;
    createdAt: string;
}

export interface AnalyticsData {
    newUsers: { last30Days: number; byRole: Tally };
    weeklySignups: { weekStart: string; talent: number; business: number }[];
    opportunitiesByCategory: { name: string; count: number }[];
    topSkills: { name: string; count: number }[];
    applications: { total: number; byStatus: Tally };
    generatedAt: string;
}

export interface AuditRow {
    id: string;
    action: string;
    actor: string | null;
    targetType: string | null;
    targetId: string | null;
    metadata: unknown;
    createdAt: string;
}

export interface BusinessReportData {
    verification: 'PENDING' | 'VERIFIED' | 'REJECTED';
    opportunities: { total: number; byStatus: Tally };
    applications: { total: number; byStatus: Tally };
    perOpportunity: {
        id: string;
        title: string;
        status: string;
        deadline: string;
        applicants: string;
        submitted: number;
        shortlisted: number;
        selected: number;
        rejected: number;
    }[];
    needsAttention: { id: string; title: string; reasons: string[] }[];
}

export interface PeriodReport {
    from: string;
    to: string;
    registrations: {
      talent: any; total: number; business: number
};
    opportunitiesPosted: number;
    applications: number;
    selections: number;
    completedProjects: number;
    activeNow: number;
}