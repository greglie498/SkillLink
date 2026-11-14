import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatBars from '../components/StatBars';
import { api } from '../lib/api';
import { count, type AnalyticsData } from '../lib/reports';

export default function AdminAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api<AnalyticsData>('/admin/reports/analytics', { auth: true })
        .then(setData)
        .catch(() => setError('Could not load analytics.'))
        .finally(() => setLoading(false));
    }, []);

    const maxWeek = data ? Math.max(1, ...data.weeklySignups.map((w) => w.talent + w.business)) : 1;
    const selected = data ? count(data.applications.byStatus, 'SELECTED') : 0;
    const rate = data && data.applications.total > 0 ? Math.round((selected / data.applications.total) * 100) : 0;

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8">
                <PageHeader
                title="Analytics"
                sub={data ? `Platform performance. Generated ${new Date(data.generatedAt).toLocaleString('en-KE')}` : 'Platform performance'}
                />

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {data && (
                <>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <StatCard icon="users" label="New users (30 days)" value={data.newUsers.last30Days} hint={`${count(data.newUsers.byRole, 'TALENT')} talent, ${count(data.newUsers.byRole, 'BUSINESS')} business`} />
                        <StatCard icon="briefcase" label="Opportunities posted" value={data.opportunitiesByCategory.reduce((n, c) => n + c.count, 0)} hint="Excluding drafts" />
                        <StatCard icon="file" label="Applications" value={data.applications.total} />
                        <StatCard icon="check" label="Selection rate" value={`${rate}%`} hint="Selected applications as a share of all applications" />
                    </div>

                    <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-5 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-[15px] font-bold text-slate-dark">Signups per week (last 8 weeks)</h2>
                        <div className="flex gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                            Talent
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm bg-info" />
                            Business
                        </span>
                        </div>
                    </div>
                    <div className="flex items-end gap-3">
                        {data.weeklySignups.map((w) => (
                        <div key={w.weekStart} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full h-40 flex flex-col justify-end">
                            <div className="bg-info rounded-t" style={{ height: `${(w.business / maxWeek) * 100}%` }} />
                            <div className="bg-primary" style={{ height: `${(w.talent / maxWeek) * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-muted">
                            {new Date(w.weekStart).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                            </span>
                        </div>
                        ))}
                    </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StatBars
                        title="Opportunities by category"
                        bars={data.opportunitiesByCategory.map((c) => ({ label: c.name, value: c.count, color: 'bg-primary' }))}
                    />
                    <StatBars
                        title="Top skills in demand (published)"
                        bars={data.topSkills.map((s) => ({ label: s.name, value: s.count, color: 'bg-info' }))}
                    />
                    <StatBars
                        title="Applications by current status"
                        bars={[
                        { label: 'Submitted', value: count(data.applications.byStatus, 'SUBMITTED'), color: 'bg-warning' },
                        { label: 'Shortlisted', value: count(data.applications.byStatus, 'SHORTLISTED'), color: 'bg-info' },
                        { label: 'Selected', value: selected, color: 'bg-success' },
                        { label: 'Rejected', value: count(data.applications.byStatus, 'REJECTED'), color: 'bg-error' },
                        ]}
                    />
                    </div>
                </>
                )}
            </main>
        </div>
    );
}