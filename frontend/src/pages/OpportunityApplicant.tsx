import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import MatchBadge from '../components/MatchBadge';
import { api, ApiError } from '../lib/api';
import { statusLabel, statusStyle } from '../lib/application';
import type { Applicant, ApplicantsResponse } from '../lib/business';
import RatingBadge from '../components/RatingBadge';

const isSafeLink = (url: string) => /^https?:\/\//i.test(url);
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

type Filter = 'ALL' | Applicant['status'];

export default function OpportunityApplicants() {
  const { id } = useParams();
  const [data, setData] = useState<ApplicantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [open, setOpen] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setData(await api<ApplicantsResponse>(`/business/opportunities/${id}/applications`, { auth: true }));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 404 ? 'Opportunity not found.' : 'Could not load applicants.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(a: Applicant, status: 'SHORTLISTED' | 'REJECTED' | 'SELECTED') {
    const verb = { SHORTLISTED: 'shortlist', REJECTED: 'reject', SELECTED: 'select' }[status];
    if (!window.confirm(`Are you sure you want to ${verb} ${a.talent.name}?`)) return;

    setActionError(null);
    try {
      await api(`/business/applications/${a.id}/status`, { method: 'PATCH', auth: true, body: { status } });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not reach the server.');
    }
  }

  function toggle(appId: string) {
    setOpen((prev) => (prev.includes(appId) ? prev.filter((x) => x !== appId) : [...prev, appId]));
  }

  const shown = data ? data.applications.filter((a) => filter === 'ALL' || a.status === filter) : [];

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 min-w-0 p-8 max-w-none">
        <Link to="/business" className="text-sm text-muted hover:text-primary mb-5 inline-block">
          &larr; Back to dashboard
        </Link>

        {loading && <p className="text-sm text-muted">Loading...</p>}
        {error && <p className="text-sm text-error">{error}</p>}

        {data && (
          <>
            <header className="mb-6">
              <p className="text-[11px] uppercase tracking-[.16em] font-bold text-primary mb-2">Applicants</p>
              <h1 className="text-[28px] leading-tight font-bold tracking-tight text-slate-deep">{data.opportunity.title}</h1>
              <p className="text-sm text-muted mt-1.5 mb-3">
                Ranked by how many of the required skills each applicant has. The decision is yours.
              </p>
              <div className="flex flex-wrap gap-2">
                {data.opportunity.requiredSkills.map((s) => (
                  <span key={s} className="text-xs bg-white border border-border rounded-full px-3 py-1 text-ink">
                    {s}
                  </span>
                ))}
              </div>
            </header>

            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted">
                {shown.length} {shown.length === 1 ? 'application' : 'applications'}
              </p>
              <select
                className="field w-auto py-2"
                value={filter}
                onChange={(e) => setFilter(e.target.value as Filter)}
                aria-label="Filter by status"
              >
                <option value="ALL">All statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="SELECTED">Selected</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            {actionError && <p className="text-sm text-error mb-4">{actionError}</p>}
            {data.applications.length === 0 && <p className="text-sm text-muted">No applications yet.</p>}

            <div className="flex flex-col gap-4">
              {shown.map((a) => {
                const expanded = open.includes(a.id);
                return (
                  <div key={a.id} className="bg-white border border-[#E8E8ED] rounded-card p-6 shadow-sm">
                    <div className="flex flex-wrap items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-tint border border-primary-light text-primary-dark font-bold flex items-center justify-center shrink-0">
                        {a.talent.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-dark">{a.talent.name}</h2>
                        <p className="text-sm text-muted">{a.talent.headline ?? 'No headline'}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {[a.talent.location, a.talent.availability].filter(Boolean).join(' - ') || 'No location or availability listed'}
                        </p>
                      </div>
                      <div className='mt-1'>
                        <RatingBadge rating={a.rating} />
                      </div>
                      <div className="flex items-center gap-2">
                        <MatchBadge score={a.matchScore} />
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${statusStyle[a.status]}`}>
                          {statusLabel[a.status]}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {a.matchedSkills.map((s) => (
                        <span key={s} className="text-xs bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7] rounded-full px-3 py-1">
                          {s}
                        </span>
                      ))}
                      {a.missingSkills.map((s) => (
                        <span key={s} className="text-xs bg-surface text-muted border border-border rounded-full px-3 py-1">
                          missing: {s}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#EEEEF1]">
                      <p className="text-[11px] font-semibold text-[#60606B] mb-1">Cover message</p>
                      <p className="text-sm text-[#454550] whitespace-pre-line">{a.proposal}</p>
                    </div>

                    {a.portfolioLinks.length > 0 && (
                      <div className="flex flex-wrap gap-4 mt-3 text-sm">
                        {a.portfolioLinks.map((l) =>
                          isSafeLink(l.url) ? (
                            <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary-dark font-semibold">
                              {l.title}
                            </a>
                          ) : (
                            <span key={l.url} className="text-muted">
                              {l.title}
                            </span>
                          )
                        )}
                      </div>
                    )}

                    {expanded && (
                      <div className="mt-4 pt-4 border-t border-[#EEEEF1] space-y-4 text-sm">
                        {a.talent.bio && (
                          <div>
                            <p className="text-[11px] font-semibold text-[#60606B] mb-1">About</p>
                            <p className="text-[#454550] whitespace-pre-line">{a.talent.bio}</p>
                          </div>
                        )}
                        {a.talent.skills.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-[#60606B] mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {a.talent.skills.map((s) => (
                                <span key={s.name} className="text-xs bg-primary-tint text-primary-dark border border-primary-light rounded-full px-3 py-1">
                                  {s.name} - {cap(s.proficiency)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {a.talent.education.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-[#60606B] mb-2">Education</p>
                            <ul className="space-y-2">
                              {a.talent.education.map((e, i) => (
                                <li key={i}>
                                  <p className="font-semibold text-ink">{e.qualification}</p>
                                  <p className="text-xs text-muted">
                                    {e.institution}
                                    {(e.startYear || e.endYear) && ` - ${e.startYear ?? ''}${e.startYear && e.endYear ? ' to ' : ''}${e.endYear ?? ''}`}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!a.talent.bio && a.talent.skills.length === 0 && a.talent.education.length === 0 && (
                          <p className="text-muted">This applicant has not added more profile details.</p>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button onClick={() => toggle(a.id)} className="btn btn-ghost btn-sm">
                        {expanded ? 'Hide profile' : 'View profile'}
                      </button>
                      {a.status === 'SUBMITTED' && (
                        <button onClick={() => decide(a, 'SHORTLISTED')} className="btn btn-secondary btn-sm">
                          Shortlist
                        </button>
                      )}
                      {a.status === 'SHORTLISTED' && (
                        <button onClick={() => decide(a, 'SELECTED')} className="btn btn-primary btn-sm">
                          Select candidate
                        </button>
                      )}
                      {(a.status === 'SUBMITTED' || a.status === 'SHORTLISTED') && (
                        <button onClick={() => decide(a, 'REJECTED')} className="btn btn-danger btn-sm">
                          Reject
                        </button>
                      )}
                      {a.projectId && (
                        <Link to={`/business/projects/${a.projectId}`} className="btn btn-primary btn-sm">
                          View project
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}