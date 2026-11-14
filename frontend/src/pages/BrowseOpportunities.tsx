import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import OpportunityCard from '../components/OpportunityCard';
import Icon from '../components/Icon';
import { api } from '../lib/api';
import { toOpportunity, type ApiOpportunity } from '../lib/opportunities';

type Sort = 'newest' | 'deadline' | 'budget';

const amountOf = (o: ApiOpportunity): number | null =>
  o.compensationAmount ? Number(o.compensationAmount) : null;

function Select({
  label,
  value,
  onChange,
  children,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    children: ReactNode;
}) {
    return (
        <div className="mb-4">
        <label className="field-label">{label}</label>
        <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
            {children}
        </select>
        </div>
    );
}

export default function BrowseOpportunities() {
    const [all, setAll] = useState<ApiOpportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [mode, setMode] = useState('');
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [skill, setSkill] = useState('');
    const [before, setBefore] = useState('');
    const [sort, setSort] = useState<Sort>('newest');

    useEffect(() => {
        let cancelled = false;
        api<ApiOpportunity[]>('/opportunities')
        .then((data) => {
            if (!cancelled) setAll(data);
        })
        .catch(() => {
            if (!cancelled) setError('Could not load opportunities. Is the API running?');
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
        cancelled = true;
        };
    }, []);

    const types = useMemo(() => [...new Set(all.map((o) => o.type))].sort(), [all]);
    const skills = useMemo(() => [...new Set(all.flatMap((o) => o.skills))].sort(), [all]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = all.filter((o) => {
        if (
            q &&
            !(
            o.title.toLowerCase().includes(q) ||
            o.business.toLowerCase().includes(q) ||
            o.skills.some((s) => s.toLowerCase().includes(q))
            )
        ) {
            return false;
        }
        if (type && o.type !== type) return false;
        if (mode === 'remote' && !o.isRemote) return false;
        if (mode === 'onsite' && o.isRemote) return false;
        if (skill && !o.skills.includes(skill)) return false;
        if (before && o.deadline > before) return false;
        if (duration) {
            const w = o.durationWeeks;
            if (w === null) return false;
            if (duration === 'short' && w > 2) return false;
            if (duration === 'medium' && (w < 3 || w > 8)) return false;
            if (duration === 'long' && w <= 8) return false;
        }
        if (budget) {
            const a = amountOf(o);
            if (a === null) return false;
            if (budget === 'low' && a >= 10000) return false;
            if (budget === 'mid' && (a < 10000 || a > 20000)) return false;
            if (budget === 'high' && a <= 20000) return false;
        }
        return true;
        });
        if (sort === 'deadline') list.sort((a, b) => a.deadline.localeCompare(b.deadline));
        if (sort === 'budget') list.sort((a, b) => (amountOf(b) ?? -1) - (amountOf(a) ?? -1));
        return list;
    }, [all, search, type, mode, duration, budget, skill, before, sort]);

    function resetFilters() {
        setSearch('');
        setType('');
        setMode('');
        setDuration('');
        setBudget('');
        setSkill('');
        setBefore('');
        setSort('newest');
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8">
                <PageHeader title="Find Opportunities" sub="Browse paid projects, internships and entry-level work from verified businesses." />

                <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                    <Icon name="search" className="w-[18px] h-[18px]" />
                </span>
                <input
                    className="field pl-11 py-3 bg-white shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, business or skill"
                />
                </div>

                {error && <p className="text-sm text-error mb-4">{error}</p>}
                {loading && <p className="text-sm text-muted">Loading...</p>}

                {!loading && !error && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <aside className="bg-white border border-[#E8E8ED] rounded-card p-5 shadow-sm self-start">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[15px] font-bold text-slate-dark">Filters</h2>
                            <button onClick={resetFilters} className="text-xs font-semibold text-primary-dark">
                                Reset
                            </button>
                        </div>

                        <Select label="Type" value={type} onChange={setType}>
                            <option value="">All types</option>
                            {types.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </Select>
                        <Select label="Work mode" value={mode} onChange={setMode}>
                            <option value="">Any</option>
                            <option value="remote">Remote</option>
                            <option value="onsite">On-site</option>
                        </Select>
                        <Select label="Budget (KES)" value={budget} onChange={setBudget}>
                            <option value="">Any budget</option>
                            <option value="low">Under 10,000</option>
                            <option value="mid">10,000 to 20,000</option>
                            <option value="high">Over 20,000</option>
                        </Select>
                        <Select label="Duration" value={duration} onChange={setDuration}>
                            <option value="">Any duration</option>
                            <option value="short">Up to 2 weeks</option>
                            <option value="medium">3 to 8 weeks</option>
                            <option value="long">Over 8 weeks</option>
                        </Select>
                        <Select label="Skill" value={skill} onChange={setSkill}>
                            <option value="">Any skill</option>
                            {skills.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </Select>
                        <div>
                            <label className="field-label">Deadline before</label>
                            <input type="date" className="field" value={before} onChange={(e) => setBefore(e.target.value)} />
                        </div>
                    </aside>

                    <section className="lg:col-span-3">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <p className="text-sm text-muted">
                                {filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'} found
                            </p>
                            <select
                                className="field w-auto py-2"
                                value={sort}
                                onChange={(e) => setSort(e.target.value as Sort)}
                                aria-label="Sort opportunities"
                            >
                                <option value="newest">Newest</option>
                                <option value="deadline">Deadline: soonest</option>
                                <option value="budget">Budget: high to low</option>
                            </select>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="bg-white border border-[#E8E8ED] rounded-card p-8 shadow-sm text-center">
                                <p className="text-sm text-ink mb-4">No opportunities match your filters.</p>
                                <button onClick={resetFilters} className="btn btn-secondary btn-sm">
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {filtered.map((o) => (
                                    <OpportunityCard key={o.id} opportunity={toOpportunity(o)} />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
                )}
            </main>
        </div>
    );
}