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
    id: string;
    email: string;
    role: 'TALENT' | 'BUSINESS' | 'ADMIN';
    status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
    emailVerified: boolean;
    createdAt: string;
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