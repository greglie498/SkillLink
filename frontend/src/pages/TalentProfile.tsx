import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import TextAreaField from '../components/TextAreaField';
import SkillsInput, { type ProfileSkill } from '../components/SkillsInput';
import { api, ApiError } from '../lib/api';
import type { ApplicationDto } from '../lib/application';
import PortfolioSection, { type PortfolioItem } from '../components/PortfolioSection';
import EducationSection, { type EducationItem } from '../components/EducationSection';
import { validateRequired, validateMaxLength } from '../utils/validation';

interface ProfileDto {
    fullName: string;
    headline: string | null;
    bio: string | null;
    location: string | null;
    availability: string | null;
    skills: ProfileSkill[];
    education: EducationItem[];
    portfolioLinks: PortfolioItem[];
}

interface ProfileErrors {
  headline: string | null;
  bio: string | null;
  location: string | null;
  availability: string | null;
}

const cardClass = 'bg-white border border-[#E8E8ED] rounded-card p-5 shadow-sm';

export default function TalentProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ProfileDto | null>(null);
    const [applications, setApplications] = useState<ApplicationDto[]>([]);
    const [catalogue, setCatalogue] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [headline, setHeadline] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [availability, setAvailability] = useState('');
    const [skills, setSkills] = useState<ProfileSkill[]>([]);
    const [education, setEducation] = useState<EducationItem[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

    const [errors, setErrors] = useState<Partial<ProfileErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
        api<ProfileDto>('/talent/profile', { auth: true }),
        api<{ id: string; name: string }[]>('/skills'),
        api<ApplicationDto[]>('/applications', { auth: true }).catch(() => [] as ApplicationDto[]),
        ])
        .then(([p, allSkills, apps]) => {
            if (cancelled) return;
            setProfile(p);
            setHeadline(p.headline ?? '');
            setBio(p.bio ?? '');
            setLocation(p.location ?? '');
            setAvailability(p.availability ?? '');
            setSkills(p.skills);
            setCatalogue(allSkills.map((s) => s.name));
            setApplications(apps);
            setEducation(p.education);
            setPortfolio(p.portfolioLinks);
        })
        .catch((err) => {
            if (cancelled) return;
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
            navigate('/login');
            } else {
            setLoadError('Could not load your profile. Is the API running?');
            }
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
        cancelled = true;
        };
    }, [navigate]);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setSaved(false);

        const newErrors: ProfileErrors = {
        headline: validateRequired(headline, 'Headline') ?? validateMaxLength(headline, 'Headline', 80),
        bio: validateMaxLength(bio, 'Bio', 300),
        location: validateRequired(location, 'Location'),
        availability: validateMaxLength(availability, 'Availability', 60),
        };
        setErrors(newErrors);
        if (Object.values(newErrors).some((err) => err !== null)) return;

        setSaving(true);
        try {
        await api('/talent/profile', {
            method: 'PUT',
            auth: true,
            body: { headline, bio, location, availability },
        });
        setProfile((prev) => (prev ? { ...prev, headline, bio, location, availability } : prev));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors({
            headline: err.fieldErrors.headline ?? null,
            bio: err.fieldErrors.bio ?? null,
            location: err.fieldErrors.location ?? null,
            availability: err.fieldErrors.availability ?? null,
            });
        } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
        setSaving(false);
        }
    }

    async function handleAddSkill(name: string): Promise<string | null> {
        try {
        const created = await api<ProfileSkill>('/talent/skills', { method: 'POST', auth: true, body: { name } });
        setSkills((prev) => [...prev, created]);
        return null;
        } catch (err) {
        if (err instanceof ApiError) return err.fieldErrors?.name ?? err.message;
        return 'Could not reach the server.';
        }
    }

    async function handleRemoveSkill(skillId: string) {
        try {
        await api(`/talent/skills/${skillId}`, { method: 'DELETE', auth: true });
        setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
        } catch {
        setFormError('Could not remove that skill. Please try again.');
        }
    }

    const checks = profile
        ? [
            { label: 'Headline', done: Boolean(profile.headline?.trim()) },
            { label: 'Bio', done: Boolean(profile.bio?.trim()) },
            { label: 'Location', done: Boolean(profile.location?.trim()) },
            { label: 'Availability', done: Boolean(profile.availability?.trim()) },
            { label: 'At least one skill', done: skills.length > 0 },
            { label: 'Education', done: education.length > 0 },
            { label: 'Portfolio link', done: portfolio.length > 0 },
        ]
        : [];
    const pct = checks.length ? Math.round((checks.filter((c) => c.done).length / checks.length) * 100) : 0;
    const initials = profile
        ? profile.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '';
    const selected = applications.filter((a) => a.status === 'SELECTED').length;

    return (
        <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <main className="flex-1 min-w-0 p-8">
            <PageHeader title="My Profile" sub="Keep your profile up to date to get better matches." />

            {loading && <p className="text-sm text-muted">Loading...</p>}
            {loadError && <p className="text-sm text-error">{loadError}</p>}

            {profile && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="space-y-6">
                <div className={`${cardClass} text-center`}>
                    <div className="w-20 h-20 mx-auto rounded-full bg-primary-tint border border-primary-light text-primary-dark text-2xl font-bold flex items-center justify-center">
                    {initials}
                    </div>
                    <h2 className="text-lg font-bold text-slate-dark mt-4">{profile.fullName}</h2>
                    <p className="text-sm text-muted mt-1">{profile.headline || 'Add a headline'}</p>
                    <p className="text-xs text-muted mt-2">
                    {[profile.location, profile.availability].filter(Boolean).join(' - ') || 'Add your location and availability'}
                    </p>
                </div>

                <div className={cardClass}>
                    <p className="text-[11px] uppercase tracking-[.14em] font-bold text-muted mb-3">Profile strength</p>
                    <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">Completion</span>
                    <span className="font-semibold text-slate-dark">{pct}%</span>
                    </div>
                    <div className="h-2 bg-[#EEEEF1] rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <ul className="space-y-2">
                    {checks.map((c) => (
                        <li key={c.label} className="flex items-center gap-2 text-xs">
                        <span className={`w-2 h-2 rounded-full ${c.done ? 'bg-success' : 'bg-border'}`} />
                        <span className={c.done ? 'text-ink' : 'text-muted'}>{c.label}</span>
                        </li>
                    ))}
                    </ul>
                </div>

                <div className={cardClass}>
                    <p className="text-[11px] uppercase tracking-[.14em] font-bold text-muted mb-3">Activity</p>
                    <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted">Applications sent</span>
                        <span className="font-semibold text-ink">{applications.length}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted">Selected</span>
                        <span className="font-semibold text-ink">{selected}</span>
                    </div>
                    </div>
                    <Link to="/applications" className="inline-block mt-4 text-[13px] font-semibold text-primary-dark">
                    View applications
                    </Link>
                </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} noValidate className={`${cardClass} p-6`}>
                        <h2 className="text-[15px] font-bold text-slate-dark mb-5">Edit profile</h2>
                        {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                        <FormField
                        label="Professional headline"
                        value={headline}
                        onChange={setHeadline}
                        error={errors.headline}
                        placeholder="e.g. Frontend Developer | React and TypeScript"
                        />
                        <TextAreaField label="Bio" value={bio} onChange={setBio} error={errors.bio} maxLength={300} />
                        <FormField
                        label="Location"
                        value={location}
                        onChange={setLocation}
                        error={errors.location}
                        placeholder="e.g. Nairobi, Kenya"
                        />
                        <FormField
                        label="Availability"
                        value={availability}
                        onChange={setAvailability}
                        error={errors.availability}
                        placeholder="e.g. 10-15 hrs/week"
                        />

                        <SkillsInput skills={skills} catalogue={catalogue} onAdd={handleAddSkill} onRemove={handleRemoveSkill} />
                        <div>
                            <button type="submit" disabled={saving} className="btn btn-primary w-full">
                            {saved ? 'Saved' : saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </div>
                    </form>

                    <EducationSection items={education} onChange={setEducation} />
                    <PortfolioSection items={portfolio} onChange={setPortfolio} />
                </div>
            </div>
            )}
        </main>
        </div>
    );
}