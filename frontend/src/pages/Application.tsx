import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { api } from '../lib/api';
import { statusLabel, statusStyle, type ApplicationDto } from '../lib/application';

export default function Applications() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<ApplicationDto[]>('/applications', { auth: true })
      .then((data) => {
        if (!cancelled) setApplications(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your applications.');
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
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">My Applications</h1>
          <p className="text-sm text-muted">Track the status of every opportunity you applied to.</p>
        </header>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {!loading && !error && applications.length === 0 && (
          <div className="bg-white border border-border rounded-card p-6 shadow-sm max-w-xl">
            <p className="text-sm text-ink mb-3">You have not applied to any opportunities yet.</p>
            <Link to="/opportunities" className="text-sm text-primary font-medium">
              Browse opportunities
            </Link>
          </div>
        )}

        {applications.length > 0 && (
          <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-border">
                  <th className="px-6 py-3 font-medium">Opportunity</th>
                  <th className="px-6 py-3 font-medium">Business</th>
                  <th className="px-6 py-3 font-medium">Applied</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3">
                      <Link to={`/opportunities/${a.opportunityId}`} className="text-ink hover:text-primary font-medium">
                        {a.opportunityTitle}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-ink">{a.business}</td>
                    <td className="px-6 py-3 text-muted">{new Date(a.appliedAt).toLocaleDateString('en-KE')}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyle[a.status]}`}>
                        {statusLabel[a.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}