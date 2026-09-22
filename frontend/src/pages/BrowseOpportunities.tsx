import { useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import OpportunityCard from "../components/OpportunityCard";
import SearchBar from "../components/SearchBar";
import FilterBar from "../components/FilterBar";
import { allOpportunities } from "../data/mockData";

export default function BrowseOpportunities() {
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState('All Skills');

    const filtered = useMemo (() => {
        return allOpportunities.filter((opp) => {
            const matchesSearch = opp.title.toLowerCase().includes(search.toLowerCase());
            const matchesSkill = skillFilter === 'All Skills' || opp.skills.includes(skillFilter);
            return matchesSearch && matchesSkill;
        });
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((opp) => (
                        <OpportunityCard key={opp.id} opportunity={opp} />
                    ))}
                </div>

                {filtered.length === 0 && (
                    <p className="text-sm text-muted text-center mt-12">No opportunities match your search.</p>
                )}
            </main>
        </div>
    )
}
