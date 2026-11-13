import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import OpportunityCard from '../components/OpportunityCard';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import ApplicationsList from '../components/ApplicationsList';
import { api } from '../lib/api';
import type { ApplicationDto } from '../lib/application';
import type { Opportunity } from '../data/mockData';
import { toOpportunity, type ApiOpportunity } from '../lib/opportunities';

interface ProfileSummary {
  fullName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  skills: unknown[];
}

function completion(p: ProfileSummary): number {
  const checks = [p.headline, p.bio, p.location, p.availability]
    .map((v) => Boolean(v && v.trim()))
    .concat(p.skills.length > 0);
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function TalentDashboard() {
  const [latest, setLatest] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);

  useEffect(() => {
    api<ApiOpportunity[]>('/talent/recommendations', { auth: true})
      .then((data) => setLatest(data.slice(0, 3).map(toOpportunity)))
      .catch(() => setLatest([]));
    api<ProfileSummary>('/talent/profile', { auth: true })
      .then(setProfile)
      .catch(() => setProfile(null));
    api<ApplicationDto[]>('/applications', { auth: true })
      .then(setApplications)
      .catch(() => setApplications([]));
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-ink">
            Welcome back{profile ? `, ${profile.fullName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-muted">Here's what's happening with your account.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ProfileCompletionCard percent={profile ? completion(profile) : 0} />
          <ApplicationsList applications={applications} />
        </div>

        <section>
          <h2 className="text-lg font-semibold text-ink mb-4">Recommended Opportunities.</h2>
          {latest.length === 0 && (
            <p className='text-sm text-muted mb-4'>
              No new opportunities to recommend right now. Adding skills to your profile improves your matches.
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}