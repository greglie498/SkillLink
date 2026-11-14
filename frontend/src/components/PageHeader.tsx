import type { ReactNode } from 'react';

export default function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
    return (
        <div className='mb-7 flex flex-wrap items-wrap items-start justify-between gap-4'>
            <div>
                <p className='text-[11px] uppercase tracking-[.16em] font-bold text-primary mb-2'>SkillLink Kenya</p>
                <h1 className='text-[28px] leading-tight font-bold tracking-tight text-slate-deep'>{title}</h1>
                {sub && <p className='text-sm text-muted mt-1.5'>{sub}</p>}
            </div>
            {action}
        </div>
    )
}