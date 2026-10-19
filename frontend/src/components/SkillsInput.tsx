import { useState, type KeyboardEvent } from "react";

export interface ProfileSkill {
    skillId: string;
    name: string;
    proficiency: string;
}

interface SkillsInputProps {
    skills: ProfileSkill[];
    catalogue: string[];
    onAdd: (name: string) => Promise<string | null>;
    onRemove: (skillId: string) => Promise<void>;
}

export default function SkillsInput({ skills, catalogue, onAdd, onRemove}: SkillsInputProps) {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const available = catalogue.filter(
        (name) => !skills.some((s) => s.name.toLowerCase() === name.toLowerCase())
    );

    async function addSkill() {
        const trimmed = input.trim();
        if (!trimmed) {
            setError('Enter a skill before adding.');
            return;
        }
        if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
            setError('That skill is already added.');
            return;
        }
        
        setBusy(true);
        const serverError = await onAdd(trimmed);
        setBusy(false);

        if (serverError) {
            setError(serverError);
        } else {
            setInput('');
            setError(null);
        }
    }


    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addSkill();
        }
    }

    return (
        <div className="md-4">
            <label className="block text-sm font-medium text-ink mb-1">Skills</label>

            <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                    <span
                        key={skill.skillId}
                        className="inline-flex items-center gap-1.5 text-xs bg-surface border border-border rounded-full px-3 py-1.5 text-ink"
                    >
                        {skill.name}
                        <button
                            type="button"
                            onClick={() => onRemove(skill.skillId)}
                            className="text-muted hover:text-error font-bold leading-none"
                            aria-label={`Remove ${skill}`}
                        >
                            x
                        </button>
                    </span>
                ))}
                {skills.length === 0 && (
                    <span className="text-xs text-muted">No skills added yet.</span>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    list="skill-catalogue"
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(null); }}
                    onKeyDown={handleKeyDown}
                    placeholder="Pick or type a skill"
                    className={`flex-1 border rounded-md px-3 py-1.5 text-sm text-ink
                        focus:outline-none focus:ring-2 focus:ring-primary/40
                        ${error ? 'border-error' : 'border-border focus:border-primary'}`}
                />
                <datalist id="skill-catalogue">
                    {available.map((name) => (
                        <option key={name} value={name} />
                    ))}
                </datalist>
                <button
                    type="button"
                    onClick={addSkill}
                    disabled={busy}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
                >
                    Add
                </button>
            </div>
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    )
}