import Sidebar from "../components/Sidebar";
import OpportunityCard from "../components/OpportunityCard";
import ProfileCompletionCard from "../components/ProfileCompletionCard";
import ApplicationsList from "../components/ApplicationsList";
import { recommendedOpportunities, profileCompletion } from "../data/mockData";

export default function TalentDashboard() {
    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8">
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-ink">Welcome Back, John</h1>
                    <p className="text-sm text-muted">Here's what's happening with your account.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <ProfileCompletionCard percent={profileCompletion} />
                    <ApplicationsList />
                </div>

                <section>
                    <h2 className="text-lg font-semibold text-ink mb-4">Recommended Opportunities</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendedOpportunities.map((opp) => (
                            <OpportunityCard key={opp.id} opportunity={opp} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}