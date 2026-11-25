import { useEffect, useState, type FormEvent } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import TextAreaField from '../components/TextAreaField';
import { api, ApiError } from '../lib/api';
import { verificationLabel, verificationStyle, type BusinessProfileDto } from '../lib/business';
import { validateRequired, validateMaxLength } from '../utils/validation';
import ReviewsCard from '../components/ReviewCard';

interface ProfileErrors {
  organisationName: string | null;
  industry: string | null;
  description: string | null;
  contactPerson: string | null;
  location: string | null;
}

interface Activity {
  opportunities: { total: number };
  applications: { total: number };
}

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6';
const isSafeLink = (url: string) => /^https?:\/\//i.test(url);

export default function BusinessProfile() {
    const [profile, setProfile] = useState<BusinessProfileDto | null>(null);
    const [activity, setActivity] = useState<Activity | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [industry, setIndustry] = useState('');
    const [description, setDescription] = useState('');
    const [contact, setContact] = useState('');
    const [location, setLocation] = useState('');
    const [errors, setErrors] = useState<Partial<ProfileErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [docUrl, setDocUrl] = useState('');
    const [docError, setDocError] = useState<string | null>(null);
    const [docMessage, setDocMessage] = useState<string | null>(null);
    const [docBusy, setDocBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all([
        api<BusinessProfileDto>('/business/profile', { auth: true }),
        api<Activity>('/business/report', { auth: true }).catch(() => null),
        ])
        .then(([p, a]) => {
            if (cancelled) return;
            setProfile(p);
            setActivity(a);
            setName(p.organisationName);
            setIndustry(p.industry ?? '');
            setDescription(p.description ?? '');
            setContact(p.contactPerson ?? '');
            setLocation(p.location ?? '');
        })
        .catch(() => {
            if (!cancelled) setLoadError('Could not load your profile. Is the API running?');
        })
        .finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => {
        cancelled = true;
        };
    }, []);

    async function handleSave(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);
        setSaved(false);

        const found: ProfileErrors = {
        organisationName: validateRequired(name, 'Business name') ?? validateMaxLength(name, 'Business name', 120),
        industry: validateMaxLength(industry, 'Industry', 80),
        description: validateMaxLength(description, 'Description', 1000),
        contactPerson: validateMaxLength(contact, 'Contact person', 120),
        location: validateMaxLength(location, 'Location', 120),
        };
        setErrors(found);
        if (Object.values(found).some((x) => x !== null)) return;

        setSaving(true);
        try {
        const updated = await api<Omit<BusinessProfileDto, 'submission'>>('/business/profile', {
            method: 'PUT',
            auth: true,
            body: {
            organisationName: name.trim(),
            industry: industry.trim(),
            description: description.trim(),
            contactPerson: contact.trim(),
            location: location.trim(),
            },
        });
        setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors({
            organisationName: err.fieldErrors.organisationName ?? null,
            industry: err.fieldErrors.industry ?? null,
            description: err.fieldErrors.description ?? null,
            contactPerson: err.fieldErrors.contactPerson ?? null,
            location: err.fieldErrors.location ?? null,
            });
        } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
        setSaving(false);
        }
    }

    async function submitDocument(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setDocMessage(null);

        if (!/^https?:\/\//i.test(docUrl.trim())) {
        setDocError('Enter a link starting with http:// or https://');
        return;
        }
        setDocError(null);

        setDocBusy(true);
        try {
        const created = await api<NonNullable<BusinessProfileDto['submission']>>('/business/verification', {
            method: 'POST',
            auth: true,
            body: { documentUrl: docUrl.trim() },
        });
        setProfile((prev) =>
            prev ? { ...prev, verification: prev.verification === 'REJECTED' ? 'PENDING' : prev.verification, submission: created } : prev
        );
        setDocUrl('');
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors?.documentUrl) setDocError(err.fieldErrors.documentUrl);
        else setDocMessage(err instanceof ApiError ? err.message : 'Could not reach the server.');
        } finally {
        setDocBusy(false);
        }
    }

    const awaitingReview = profile?.verification === 'PENDING' && profile.submission?.status === 'PENDING';

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8">
                <PageHeader title="Business Profile" sub="How your business appears to talent." />

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {loadError && <p className="text-sm text-error">{loadError}</p>}

                {profile && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="space-y-6">
                        <div className={`${card} text-center`}>
                            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-tint border border-primary-light text-primary-dark text-3xl font-bold flex items-center justify-center">
                            {profile.organisationName.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-lg font-bold text-slate-dark mt-4">{profile.organisationName}</h2>
                            <p className="text-sm text-muted mt-1">{profile.industry || 'Add your industry'}</p>
                            <p className="text-xs text-muted mt-1">{profile.location || 'Add your location'}</p>
                            <span className={`inline-block mt-3 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${verificationStyle[profile.verification]}`}>
                            {verificationLabel[profile.verification]}
                            </span>
                        </div>

                        <div className={card}>
                            <p className="text-[11px] uppercase tracking-[.14em] font-bold text-muted mb-3">Activity</p>
                            <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted">Opportunities posted</span>
                                <span className="font-semibold text-ink">{activity?.opportunities.total ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted">Applications received</span>
                                <span className="font-semibold text-ink">{activity?.applications.total ?? 0}</span>
                            </div>
                            </div>
                        </div>
                        </div>

                        <div className="xl:col-span-2 space-y-6">
                        <form onSubmit={handleSave} noValidate className={card}>
                            <h2 className="text-[15px] font-bold text-slate-dark mb-5">Business information</h2>
                            {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
                            <FormField label="Business name" value={name} onChange={setName} error={errors.organisationName} />
                            <FormField label="Industry" value={industry} onChange={setIndustry} error={errors.industry} placeholder="e.g. Retail" />
                            <FormField label="Contact person" value={contact} onChange={setContact} error={errors.contactPerson} />
                            <FormField label="Location" value={location} onChange={setLocation} error={errors.location} placeholder="e.g. Nairobi, Kenya" />
                            </div>
                            <TextAreaField label="About your business" value={description} onChange={setDescription} error={errors.description} maxLength={1000} />

                            <button type="submit" disabled={saving} className="btn btn-primary w-full">
                                {saved ? 'Saved' : saving ? 'Saving...' : 'Save changes'}
                            </button>
                        </form>

                        <div className={card}>
                            <div className="flex items-center justify-between gap-3 mb-2">
                            <h2 className="text-[15px] font-bold text-slate-dark">Verification</h2>
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${verificationStyle[profile.verification]}`}>
                                {verificationLabel[profile.verification]}
                            </span>
                            </div>

                            {profile.verification === 'VERIFIED' && (
                            <p className="text-sm text-[#454550]">Your business is verified. You can publish opportunities.</p>
                            )}

                            {awaitingReview && profile.submission && (
                            <p className="text-sm text-[#454550]">
                                Your document was submitted on {new Date(profile.submission.createdAt).toLocaleDateString('en-KE')} and is awaiting
                                review by an administrator.{' '}
                                {isSafeLink(profile.submission.documentUrl) && (
                                <a href={profile.submission.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary-dark font-semibold">
                                    View submitted link
                                </a>
                                )}
                            </p>
                            )}

                            {profile.verification !== 'VERIFIED' && !awaitingReview && (
                            <form onSubmit={submitDocument} noValidate>
                                <p className="text-sm text-[#454550] mb-4">
                                    {profile.verification === 'REJECTED'
                                        ? 'Your last submission was not approved. Submit a new link to be reviewed again.'
                                        : 'Submit a link to your business registration certificate so an administrator can verify you. You can only publish opportunities once verified.'}
                                </p>
                                {docMessage && <p className="text-sm text-error mb-3">{docMessage}</p>}
                                <FormField
                                    label="Link to your registration document"
                                    value={docUrl}
                                    onChange={setDocUrl}
                                    error={docError}
                                    placeholder="https://drive.google.com/..."
                                />
                                <p className="text-xs text-muted -mt-2 mb-4">Use a share link that an administrator can open (Google Drive, Dropbox or similar).</p>
                                <button type="submit" disabled={docBusy} className="btn btn-secondary btn-sm">
                                    {docBusy ? 'Submitting...' : 'Submit for verification'}
                                </button>
                                <ReviewsCard rating={profile.rating} reviews={profile.reviews} />
                            </form>
                            )}
                        </div>
                    </div>
                </div>
                )}
            </main>
        </div>
    );
    }