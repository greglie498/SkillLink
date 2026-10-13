import { useState, type KeyboardEvent } from "react";

interface SkillsInputProps {
    skills: string[];
    onChange: (skills: string[]) => void;
}

export default function SkillsInput({ skills, onChange}: SkillsInputProps) {
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    function addSkill() {
        const trimmed = input.trim();
        if (!trimmed) {
            setError('Enter a skill before adding.');
            return;
        }
        if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
            setError('That skill is already added.');
            return;
        }
        onChange([...skills, trimmed]);
        setInput('');
        setError(null);
    }

    function removeSkill(skillToRemove: string) {
        onChange(skills.filter((s) => s !== skillToRemove));
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

            <div className="flex felx-wrap gap-2 mb-2">
                {skills.map((skill) => (
                    <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 text-xs bg-surface border border-border rounded-full px-3 py-1.5 text-ink"
                    >
                        {skill}
                        <button
                            type="button"
                            onClick={() => removeSkill(skill)}
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
                    value={input}
                    onChange={(e) => { setInput(e.target.value); setError(null); }}
                    onKeyDown={handleKeyDown}
                    placeholder="e.g. Node.js"
                    className={`flex-1 border rounded-md px-3 py-1.5 text-sm text-ink
                        focus:outline-none focus:ring-2 focus:ring-primary/40
                        ${error ? 'border-error' : 'border-border focus:border-primary'}`}
                />
                <button
                    type="button"
                    onClick={addSkill}
                    className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-1.5 rounded-md transition-colors"
                >
                    Add
                </button>
            </div>
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    )
}