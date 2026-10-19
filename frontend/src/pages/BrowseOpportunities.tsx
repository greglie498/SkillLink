import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import OpportunityCard from "../components/OpportunityCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { type Opportunity } from "../data/mockData";
import { toOpportunity, type ApiOpportunity } from "../lib/Opportunities";
import { api } from "../lib/api";

export default function BrowseOpportunities() {
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState('All Skills');
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const timer = setTimeout(() => {
            const params = new URLSearchParams();
            if (search.trim()) params.set('q', search.trim());
            if (skillFilter !== 'All skills') params.set('skill', skillFilter);
            const query = params.toString();

            setLoading(true);
            setError(null);
            api<ApiOpportunity[]>(`/opportunities${query ? `?${query}` : ''}`)
                .then((data) => {
                    if (!cancelled) setOpportunities(data.map(toOpportunity));
                })
                .catch(() => {
                    if (!cancelled) setError('Could not load opportunities. Is the API running?');
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [search, skillFilter]);

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-ink">Find Opportunities</h1>
                    <p className="text-sm text-muted">Browse projects matched to your skills.</p>
                </header>

                <div className="flex flex-col gap-4 mb-8">
                    <SearchBar value={search} onChange={setSearch} />
                    <FilterBar selected={skillFilter} onChange={setSkillFilter} />
                </div>

                {error && <p className="text-sm text-error mb-4">{error}</p>}
                {loading && <p className="text-sm text-muted">Loading...</p>}

                {!loading && !error && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {opportunities.map((opp) => (
                                <OpportunityCard key={opp.id} opportunity={opp} />
                            ))}
                        </div>
                        {opportunities.length === 0 && (
                            <p className="text-sm text-muted text-center mt-12">No opportunities match your search</p>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}
