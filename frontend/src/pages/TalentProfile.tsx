import { useEffect, useState, type FormEvent } from "react";
import { mockProfile } from "../data/mockData";
import { validateRequired, validateMaxLength } from "../utils/validation";
import Sidebar from "../components/Sidebar";
import FormField from "../components/FormField";
import TextAreaField from "../components/TextAreaField";
import SkillsInput, { type ProfileSkill } from "../components/SkillsInput";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";

interface ProfileDto {
    headline: string | null;
    bio: string | null;
    location: string | null;
    availability: string | null;
    skills: ProfileSkill[];
}

interface ProfileErrors {
    headline: string | null;
    bio: string | null;
    location: string | null;
    availability: string | null;
}

export default function TalentProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [headline, setHeadline] = useState(mockProfile.headline);
    const [bio, setBio] = useState(mockProfile.bio);
    const [location, setLocation] = useState(mockProfile.location);
    const [availability, setAvailability] = useState(mockProfile.availability);
    const [skills, setSkills] = useState<ProfileSkill[]>([]);
    const [catalogue, setCatalogue] = useState<string[]>([]);
    
    const [errors, setErrors] = useState<Partial<ProfileErrors>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        let cancelled = false;

        Promise.all([
            api<ProfileDto>('/talent/profile', { auth: true }),
            api<{ id: string; name: string }[]>('/skills'),
        ])
        .then(([profile, allSkills]) => {
            if (cancelled) return;
            setHeadline(profile.headline ?? '');
            setBio(profile.bio ?? '');
            setLocation(profile.location ?? '');
            setAvailability(profile.availability ?? '');
            setSkills(profile.skills);
            setCatalogue(allSkills.map((s) => s.name));
        })
        .catch((err) => {
            if (cancelled) return;
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                navigate('/login');
            } else {
                setLoadError('Could noit load your profile. Is the Api running?');
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

        const hasErrors = Object.values(newErrors).some((err) => err !== null);
        if (hasErrors) {
            setSaved(false);
            return;
        }

        if (Object.values(newErrors).some((err) => err !== null)) return;

        setSaving(true);
        try {
            await api('/talent/profile', {
                method: 'PUT',
                auth: true,
                body: { headline, bio, location, availability },
            });
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
                setFormError(err instanceof ApiError ? err.message : 'Could not reach the server');
            }
        } finally {
            setSaving(false);
        }
    }

    async function handleAddSkill(name: string): Promise<string | null> {
        try {
            const created = await api<ProfileSkill>('/talent/skills', {
                method: 'POST',
                auth: true,
                body: { name },
            });
            setSkills((prev) => [...prev, created]);
            return null;
        } catch (err) {
            if (err instanceof ApiError) return err.fieldErrors?.name ?? err.message;
            return 'Could not reach the server'
        }
    }

    async function handleRemoveSkill(skillId: string) {
        try {
            await api(`/talent/skills/${skillId}`, { method: 'DELETE', auth: true });
            setSkills((prev) => prev.filter((s) => s.skillId !== skillId));
        } catch {
            setFormError('Could not remove that skill. Please try again.')
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8 max-w-2xl">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-ink">Edit Profile</h1>
                    <p className="text-sm text-muted">Keep your profile up to date to get better matches. </p>
                </header>

                {loading && <p className="text-sm text-muted">Loading...</p>}
                {loadError && <p className="text-sm text-error">{loadError}</p>}

                {!loading && !loadError && (
                    <form onSubmit={handleSubmit} noValidate className="bg-white border border-border rounded-card p-6 shadow-sm">

                        {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                        <FormField
                            label="Professional Haedline"
                            value={headline}
                            onChange={setHeadline}
                            error={errors.headline}
                            placeholder="e.g. Frontend Developer | React & TypeScript"
                        />
                        <TextAreaField 
                            label="Bio"
                            value={bio}
                            onChange={setBio}
                            error={errors.bio}
                            maxLength={300}
                        />
                        <FormField 
                            label="Location"
                            value={location}
                            onChange={setLocation}
                            error={errors.location}
                            placeholder="e.g. Nairobi, Kenya"
                        />
                        <FormField 
                            label="Availabilty"
                            value={availability}
                            onChange={setAvailability}
                            error={errors.availability}
                            placeholder="e.g. 10-15 hrs/week"
                        />
                        <SkillsInput skills={skills} catalogue={catalogue} onAdd={handleAddSkill} onRemove={handleRemoveSkill} />

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors mt-2"
                        >
                            {saved ? 'Saved' : saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                )}
            </main>
        </div>
    )
}