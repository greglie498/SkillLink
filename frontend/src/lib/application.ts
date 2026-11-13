export interface ApplicationDto {
    id: string;
    status: 'SUBMITTED' | 'SHORTLISTED' | 'REJECTED' | 'SELECTED';
    appliedAt: string;
    opportunityId: string;
    opportunityTitle: string;
    business: string;
}

export const statusLabel: Record<ApplicationDto['status'], string> = {
    SUBMITTED: 'Submitted',
    SHORTLISTED: 'Shortlisted',
    REJECTED: 'Rejected',
    SELECTED: 'Selected',
};

export const statusStyle: Record<ApplicationDto['status'], string> = {
    SUBMITTED: 'bg-warning/10 text-warning',
    SHORTLISTED: 'bg-info/10 text-info',
    REJECTED: 'bg-error/10 text-error',
    SELECTED: 'bg-success/10 text-success',
};
