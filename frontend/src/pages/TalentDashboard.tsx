import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import OpportunityCard from '../components/OpportunityCard';
import ApplicationsList from '../components/ApplicationsList';
import { api } from '../lib/api';
import { toOpportunity, type ApiOpportunity } from '../lib/opportunities';
import type { ApplicationDto } from '../lib/application';
import type { Opportunity } from '../data/mockData';
import ProfileCompletionCard from '../components/ProfileCompletionCard';

interface ProfileSummary {
  fullName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
  skills: unknown[];
  education: unknown[];
  portfolioLinks: unknown[];
}

function completion(p: ProfileSummary): number {
  const checks = [p.headline, p.bio, p.location, p.availability]
    .map((v) => Boolean(v && v.trim()))
    .concat(p.skills.length > 0, p.education.length > 0, p.portfolioLinks.length > 0);
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function TalentDashboard() {
  const [recommended, setRecommended] = useState<Opportunity[]>([]);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);

  useEffect(() => {
    api<ApiOpportunity[]>('/talent/recommendations', { auth: true })
      .then((data) => setRecommended(data.map(toOpportunity)))
      .catch(() => setRecommended([]));
    api<ProfileSummary>('/talent/profile', { auth: true })
      .then(setProfile)
      .catch(() => setProfile(null));
    api<ApplicationDto[]>('/applications', { auth: true })
      .then(setApplications)
      .catch(() => setApplications([]));
  }, []);

  const pct = profile ? completion(profile) : 0;
  const countStatus = (s: ApplicationDto['status']) => applications.filter((a) => a.status === s).length;

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8">
        <PageHeader
          title={`Welcome back${profile ? `, ${profile.fullName.split(' ')[0]}` : ''}`}
          sub="Here is what is happening with your applications and matches."
        />

        {profile && pct < 100 && (
          <div className="mb-6">
            <ProfileCompletionCard percent={pct} />
          </div>
        )}

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="file"
            label="Applications"
            value={applications.length}
            hint={`${countStatus('SUBMITTED')} awaiting a decision`}
            to='/applications'
          />
          <StatCard icon="users" label="Shortlisted" value={countStatus('SHORTLISTED')} />
          <StatCard icon="check" label="Selected" value={countStatus('SELECTED')} />
          <StatCard icon="spark" label="New matches" value={recommended.length} hint="Based on your skills" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-bold text-slate-dark">Recommended opportunities</h2>
              <Link to="/opportunities" className="text-[13px] font-semibold text-primary-dark">
                View all
              </Link>
            </div>
            {recommended.length === 0 ? (
              <p className="text-sm text-muted">
                No new opportunities to recommend right now. Adding skills to your profile improves your matches.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommended.slice(0, 4).map((opp) => (
                  <OpportunityCard key={opp.id} opportunity={opp} />
                ))}
              </div>
            )}
          </section>

          <aside>
            <ApplicationsList applications={applications} />
          </aside>
        </div>
      </main>
    </div>
  );
}