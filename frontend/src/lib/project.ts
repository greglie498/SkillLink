export type ProjectStatus = 'SELECTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export const projectStatusLabel: Record<ProjectStatus, string> = {
    SELECTED: 'Selected',
    IN_PROGRESS: 'In progress',
    SUBMITTED: 'Submitted for review',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
};

export const projectStatusStyle: Record<ProjectStatus, string> = {
    SELECTED: 'bg-[#EAF2FA] text-[#2D6D9E] border border-[#C9DFF0]',
    IN_PROGRESS: 'bg-[#FFF6E5] text-[#A66E12] border border-[#F5DFB4]',
    SUBMITTED: 'bg-primary-tint text-primary-dark border border-primary-light',
    COMPLETED: 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]',
    CANCELLED: 'bg-[#FDEEEE] text-[#B83A3A] border border-[#F5CCCC]',
};

export const projectSteps: ProjectStatus[] = ['SELECTED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED'];

export function actionLabel(from: ProjectStatus, to: ProjectStatus): string {
    if (to === 'IN_PROGRESS') return from === 'SUBMITTED' ? 'Request changes' : 'Start work';
    if (to === 'SUBMITTED') return 'Submit work for review';
    if (to === 'COMPLETED') return 'Mark as completed';
    if (to === 'CANCELLED') return 'Cancel project';
    return 'Update';
}

export interface ProjectListItem {
    id: string;
    status: ProjectStatus;
    startedAt: string | null;
    completedAt: string | null;
    title: string;
    counterpart: string;
    deadline: string;
}

export interface ProjectDetailDto {
    id: string;
    status: ProjectStatus;
    startedAt: string | null;
    completedAt: string | null;
    viewerSide: 'TALENT' | 'BUSINESS';
    opportunity: {
        id: string;
        title: string;
        description: string;
        compensationAmount: string | null;
        durationWeeks: number | null;
        deadline: string;
    };
    business: string;
    talent: { name: string; headline: string | null };
    actions: ProjectStatus[];
}