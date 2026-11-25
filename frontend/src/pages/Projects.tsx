import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';
import { projectStatusLabel, projectStatusStyle, type ProjectListItem } from '../lib/project';

export default function Projects() {
    const isBusiness = getUser()?.role === 'BUSINESS';
    const base = isBusiness ? '/business/projects' : '/projects';
    const [items, setItems] = useState<ProjectListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        api<ProjectListItem[]>('/projects', { auth: true })
        .then((d) => {
            if (!cancelled) setItems(d);
        })
        .catch(() => {
            if (!cancelled) setError('Could not load your projects.');
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
        cancelled = true;
        };
    }, []);

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-8xl">
                <PageHeader
                title="Projects"
                sub={isBusiness ? 'Work you have agreed with selected talent.' : 'Work you have been selected for.'}
                />

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {!loading && !error && items.length === 0 && (
                    <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-8 max-w-xl">
                        <p className="text-sm text-ink">
                        {isBusiness
                            ? 'No projects yet. A project is created when you select an applicant.'
                            : 'No projects yet. A project is created when a business selects your application.'}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    {items.map((p) => (
                        <Link
                        key={p.id}
                        to={`${base}/${p.id}`}
                        className="bg-white border border-[#E8E8ED] rounded-card shadow-sm hover:shadow-lift transition-all p-5 flex flex-wrap items-center gap-4"
                        >
                            <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary font-bold flex items-center justify-center shrink-0">
                                {p.counterpart.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-dark truncate">{p.title}</p>
                                <p className="text-xs text-muted">
                                {p.counterpart} - Deadline {p.deadline}
                                </p>
                            </div>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${projectStatusStyle[p.status]}`}>
                                {projectStatusLabel[p.status]}
                            </span>
                        </Link>
                    ))}
                </div>
            </main>
        </div>
    );
}