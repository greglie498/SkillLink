import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api, ApiError } from '../lib/api';
import {
  actionLabel,
  projectStatusLabel,
  projectStatusStyle,
  projectSteps,
  type ProjectDetailDto,
  type ProjectStatus,
} from '../lib/project';
import FeedbackPanel from '../components/FeedbackPanel';

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6';

export default function ProjectDetail() {
    const { id } = useParams();
    const [project, setProject] = useState<ProjectDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            setProject(await api<ProjectDetailDto>(`/projects/${id}`, { auth: true }));
            setError(null);
        } catch (err) {
            setError(err instanceof ApiError && err.status === 404 ? 'Project not found.' : 'Could not load this project.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    async function act(to: ProjectStatus) {
        if (!project) return;
        if ((to === 'COMPLETED' || to === 'CANCELLED') && !window.confirm('This cannot be undone. Continue?')) return;
        setNotice(null);
        try {
            await api(`/projects/${project.id}/status`, { method: 'PATCH', auth: true, body: { status: to } });
            await load();
        } catch (err) {
            setNotice(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
    }

    const base = project?.viewerSide === 'BUSINESS' ? '/business/projects' : '/projects';
    const currentIdx = project ? projectSteps.indexOf(project.status) : -1;

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-none">
                <Link to={base} className="text-sm text-muted hover:text-primary mb-5 inline-block">
                    &larr; Back to projects
                </Link>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {project && (
                    <div className="space-y-6">
                        <div className={card}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                            <p className="text-[11px] uppercase tracking-[.16em] font-bold text-primary mb-2">Project</p>
                            <h1 className="text-[28px] leading-tight font-bold tracking-tight text-slate-deep">{project.opportunity.title}</h1>
                            <p className="text-sm text-muted mt-1.5">
                                {project.business} with {project.talent.name}
                            </p>
                            </div>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${projectStatusStyle[project.status]}`}>
                            {projectStatusLabel[project.status]}
                            </span>
                        </div>

                        {project.status === 'CANCELLED' ? (
                            <p className="text-sm text-[#B83A3A] bg-[#FDEEEE] border border-[#F5CCCC] rounded-lg px-4 py-3 mt-6">
                            This project was cancelled.
                            </p>
                        ) : (
                            <ol className="flex items-center mt-8">
                            {projectSteps.map((s, i) => (
                                <li key={s} className="flex-1 flex items-center last:flex-none">
                                <div className="flex flex-col items-center gap-2">
                                    <span
                                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                                        i <= currentIdx ? 'bg-primary text-white' : 'bg-[#EEEEF1] text-muted'
                                    }`}
                                    >
                                    {i + 1}
                                    </span>
                                    <span className={`text-[11px] whitespace-nowrap ${i === currentIdx ? 'font-semibold text-ink' : 'text-muted'}`}>
                                    {projectStatusLabel[s]}
                                    </span>
                                </div>
                                {i < projectSteps.length - 1 && (
                                    <span className={`flex-1 h-0.5 mx-2 mb-6 ${i < currentIdx ? 'bg-primary' : 'bg-[#EEEEF1]'}`} />
                                )}
                                </li>
                            ))}
                            </ol>
                        )}

                        {notice && <p className="text-sm text-error mt-4">{notice}</p>}

                        {project.actions.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#EEEEF1]">
                            {project.actions.map((to) => (
                                <button
                                key={to}
                                onClick={() => act(to)}
                                className={`btn btn-sm ${to === 'CANCELLED' ? 'btn-danger' : to === 'IN_PROGRESS' && project.status === 'SUBMITTED' ? 'btn-secondary' : 'btn-primary'}`}
                                >
                                {actionLabel(project.status, to)}
                                </button>
                            ))}
                            </div>
                        )}
                        </div>

                        <div className={card}>
                            <h2 className="text-[15px] font-bold text-slate-dark mb-3">About the work</h2>
                            <p className="text-sm leading-6 text-[#454550] whitespace-pre-line">{project.opportunity.description}</p>
                            <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-5 border-t border-[#EEEEF1] text-sm">
                                <div>
                                    <dt className="text-muted">Budget</dt>
                                    <dd className="font-semibold text-ink mt-0.5">
                                        {project.opportunity.compensationAmount
                                        ? `KES ${Number(project.opportunity.compensationAmount).toLocaleString('en-KE')}`
                                        : 'Negotiable'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted">Duration</dt>
                                    <dd className="font-semibold text-ink mt-0.5">
                                        {project.opportunity.durationWeeks ? `${project.opportunity.durationWeeks} weeks` : 'Flexible'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted">Deadline</dt>
                                    <dd className="font-semibold text-ink mt-0.5">{project.opportunity.deadline}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted">Started</dt>
                                    <dd className="font-semibold text-ink mt-0.5">
                                        {project.startedAt ? new Date(project.startedAt).toLocaleDateString('en-KE') : 'Not started'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted">Completed</dt>
                                    <dd className="font-semibold text-ink mt-0.5">
                                        {project.completedAt ? new Date(project.completedAt).toLocaleDateString('en-KE') : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {project.status === 'COMPLETED' && <FeedbackPanel projectId={project.id} />}
                    </div>
                )}
            </main>
        </div>
    );
}