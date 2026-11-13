import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import StatBars from '../components/StatBars';
import { api } from '../lib/api';
import { count, type BusinessReportData } from '../lib/reports';

export default function BusinessReport() {
  const [data, setData] = useState<BusinessReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<BusinessReportData>('/business/report', { auth: true })
      .then(setData)
      .catch(() => setError('Could not load the report.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-ink">Hiring Report</h1>
          <p className="text-sm text-muted">Where your opportunities and applicants stand right now.</p>
        </header>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard label="Opportunities" value={data.opportunities.total} hint={`${count(data.opportunities.byStatus, 'PUBLISHED')} published`} />
              <StatCard label="Applications received" value={data.applications.total} />
              <StatCard
                label="Awaiting your decision"
                value={count(data.applications.byStatus, 'SUBMITTED')}
                warn={count(data.applications.byStatus, 'SUBMITTED') > 0}
              />
              <StatCard label="Selected" value={count(data.applications.byStatus, 'SELECTED')} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                <StatBars
                    title="Applications by current status"
                    bars={[
                    { label: 'Submitted', value: count(data.applications.byStatus, 'SUBMITTED'), color: 'bg-warning' },
                    { label: 'Shortlisted', value: count(data.applications.byStatus, 'SHORTLISTED'), color: 'bg-info' },
                    { label: 'Selected', value: count(data.applications.byStatus, 'SELECTED'), color: 'bg-success' },
                    { label: 'Rejected', value: count(data.applications.byStatus, 'REJECTED'), color: 'bg-error' },
                    ]}
                />
                <div className="bg-white border border-border rounded-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-ink mb-4">Needs your attention</h3>
                    {data.needsAttention.length === 0 ? (
                    <p className="text-sm text-muted">Nothing needs attention right now.</p>
                    ) : (
                    <ul className="space-y-3">
                        {data.needsAttention.map((n) => (
                        <li key={n.id} className="text-sm">
                            <Link to={`/business/opportunities/${n.id}/applicants`} className="text-ink font-medium hover:text-primary">
                            {n.title}
                            </Link>
                            <p className="text-xs text-muted">{n.reasons.join('; ')}</p>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
            </div>

            <h2 className="text-sm font-semibold text-ink mb-3">By opportunity</h2>
            <div className="bg-white border border-border rounded-card shadow-sm overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="px-6 py-3 font-medium">Opportunity</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Deadline</th>
                    <th className="px-6 py-3 font-medium">Applicants</th>
                    <th className="px-6 py-3 font-medium">Awaiting</th>
                    <th className="px-6 py-3 font-medium">Shortlisted</th>
                    <th className="px-6 py-3 font-medium">Selected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.perOpportunity.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-3">
                        <Link to={`/business/opportunities/${o.id}/applicants`} className="text-ink font-medium hover:text-primary">
                          {o.title}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-ink">{o.status}</td>
                      <td className="px-6 py-3 text-muted">{o.deadline}</td>
                      <td className="px-6 py-3 text-ink">{o.applicants}</td>
                      <td className="px-6 py-3 text-ink">{o.submitted}</td>
                      <td className="px-6 py-3 text-ink">{o.shortlisted}</td>
                      <td className="px-6 py-3 text-ink">{o.selected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}