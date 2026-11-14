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
    SUBMITTED: 'bg-[#FFF6E5] text-[#A66E12] border border-[#F5DFB4]',
    SHORTLISTED: 'bg-[#EAF2FA] text-[#2D6D9E] border border-[#C9DFF0]',
    REJECTED: 'bg-[#FDEEEE] text-[#B83A3A] border border-[#F5CCCC]',
    SELECTED: 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]',
};