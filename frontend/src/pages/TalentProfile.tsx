import { useState, type FormEvent } from "react";
import { mockProfile } from "../data/mockData";
import { validateRequired, validateMaxLength } from "../utils/validation";
import Sidebar from "../components/Sidebar";
import FormField from "../components/FormField";
import TextAreaField from "../components/TextAreaField";
import SkillsInput from "../components/SkillsInput";

interface ProfileErrors {
    headline: string | null;
    bio: string | null;
    location: string | null;
}

export default function TalentProfile() {
    const [headline, setHeadline] = useState(mockProfile.headline);
    const [bio, setBio] = useState(mockProfile.bio);
    const [location, setLocation] = useState(mockProfile.location);
    const [availability, setAvailability] = useState(mockProfile.availability);
    const [skills, setSkills] = useState<string[]>(mockProfile.skills);
    const [errors, setErrors] = useState<Partial<ProfileErrors>>({});
    const [saved, setSaved] = useState(false);

    function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const newErrors: ProfileErrors = {
            headline: validateRequired(headline, 'Headline') ?? validateMaxLength(headline, 'Headline', 80),
            bio: validateMaxLength(bio, 'Bio', 300),
            location: validateRequired(location, 'Location'),
        };
        setErrors(newErrors);

        const hasErrors = Object.values(newErrors).some((err) => err !== null);
        if (hasErrors) {
            setSaved(false);
            return;
        }

        // Pending backend
        console.log('Profile update:', { headline, bio, location, availability, skills });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8 max-w-2xl">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-ink">Edit Profile</h1>
                    <p className="text-sm text-muted">Keep your profile up to date to get better matches. </p>
                </header>

                <form onSubmit={handleSubmit} noValidate className="bg-white border border-border rounded-card p-6 shadow-sm">
                    <FormField
                        label="Professional Haedline"
                        value={headline}
                        onChange={setHeadline}
                        error={errors.headline}
                        placeholder="e.g. Frontend Developer | React & TypeScript"
                    />
                    <TextAreaField 
                        label="Bio"
                        value={headline}
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
                        placeholder="e.g. 10-15 hrs/week"
                    />
                    <SkillsInput skills={skills} onChange={setSkills} />

                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-dark text-white text-sm font-medium py-2.5 rounded-md transition-colors mt-2"
                    >
                        {saved ? 'Saved' : 'Save Changes'}
                    </button>
                </form>
            </main>
        </div>
    )
}