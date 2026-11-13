import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FormField from '../components/FormField';
import TextAreaField from '../components/TextAreaField';
import { api, ApiError } from '../lib/api';

interface Option {
  id: string;
  name: string;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  error?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border rounded-md px-4 py-2 text-sm text-ink bg-white
          focus:outline-none focus:ring-2 focus:ring-primary/40
          ${error ? 'border-error' : 'border-border focus:border-primary'}`}
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

export default function CreateOpportunity() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Option[]>([]);
    const [types, setTypes] = useState<Option[]>([]);
    const [skills, setSkills] = useState<Option[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [typeId, setTypeId] = useState('');
    const [durationWeeks, setDurationWeeks] = useState('');
    const [compensation, setCompensation] = useState('');
    const [isRemote, setIsRemote] = useState(false);
    const [location, setLocation] = useState('');
    const [deadline, setDeadline] = useState('');
    const [skillIds, setSkillIds] = useState<string[]>([]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);

    useEffect(() => {
        Promise.all([
            api<Option[]>('/meta/categories'),
            api<Option[]>('/meta/types'),
            api<Option[]>('/skills'),
        ])
        .then(([c, t, s]) => {
            setCategories(c);
            setTypes(t);
            setSkills(s);
        })
        .catch(() => setLoadError('Could not load form options. Is the API running?'));
    }, []);

    function toggleSkill(id: string) {
        setSkillIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function validate(): Record<string, string> {
        const e: Record<string, string> = {};
        if (title.trim().length < 5) e.title = 'Title must be at least 5 characters.';
        else if (title.trim().length > 120) e.title = 'Title must be no more than 120 characters.';
        if (description.trim().length < 20) e.description = 'Description must be at least 20 characters.';
        else if (description.trim().length > 3000) e.description = 'Description must be no more than 3000 characters.';
        if (!categoryId) e.categoryId = 'Select a category.';
        if (!typeId) e.typeId = 'Select a type.';
        if (durationWeeks && (!Number.isInteger(Number(durationWeeks)) || Number(durationWeeks) < 1)) {
        e.durationWeeks = 'Enter a whole number of weeks (1 or more).';
        }
        if (compensation && (Number.isNaN(Number(compensation)) || Number(compensation) < 0)) {
        e.compensationAmount = 'Enter an amount of 0 or more.';
        }
        if (!deadline) e.deadline = 'Choose a deadline.';
        if (skillIds.length === 0) e.skillIds = 'Select at least one skill.';
        return e;
    }

    async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        setFormError(null);

        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setSaving(true);
        try {
        await api('/business/opportunities', {
            method: 'POST',
            auth: true,
            body: {
            title: title.trim(),
            description: description.trim(),
            categoryId,
            typeId,
            durationWeeks: durationWeeks ? Number(durationWeeks) : undefined,
            compensationAmount: compensation ? Number(compensation) : undefined,
            isRemote,
            location: location.trim() || undefined,
            deadline,
            skillIds,
            },
        });
        navigate('/business');
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors(err.fieldErrors);
        } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
        setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 p-8 max-w-2xl">
                <Link to="/business" className="text-sm text-muted hover:text-primary mb-4 inline-block">
                ← Back to opportunities
                </Link>
                <header className="mb-6">
                <h1 className="text-2xl font-bold text-ink">New Opportunity</h1>
                <p className="text-sm text-muted">It is saved as a draft. Publish it from your opportunities list.</p>
                </header>

                {loadError && <p className="text-sm text-error mb-4">{loadError}</p>}

                <form onSubmit={handleSubmit} noValidate className="bg-white border border-border rounded-card p-6 shadow-sm">
                    {formError && <p className="text-sm text-error mb-4">{formError}</p>}

                    <FormField label="Title" value={title} onChange={setTitle} error={errors.title} placeholder="e.g. Frontend developer for our online shop" />
                    <TextAreaField label="Description" value={description} onChange={setDescription} error={errors.description} maxLength={3000} />
                    <SelectField label="Category" value={categoryId} onChange={setCategoryId} options={categories} error={errors.categoryId} />
                    <SelectField label="Type" value={typeId} onChange={setTypeId} options={types} error={errors.typeId} />
                    <FormField label="Duration (weeks, optional)" value={durationWeeks} onChange={setDurationWeeks} error={errors.durationWeeks} placeholder="e.g. 4" />
                    <FormField label="Compensation in KES (optional)" value={compensation} onChange={setCompensation} error={errors.compensationAmount} placeholder="e.g. 20000" />

                    <label className="flex items-center gap-2 text-sm text-ink mb-4">
                        <input type="checkbox" checked={isRemote} onChange={(e) => setIsRemote(e.target.checked)} />
                        Remote work
                    </label>

                    <FormField label="Location (optional)" value={location} onChange={setLocation} error={errors.location} placeholder="e.g. Nairobi" />

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-ink mb-1">Application deadline</label>
                        <input
                            type="date"
                            min={tomorrow}
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className={`w-full border rounded-md px-4 py-2 text-sm text-ink
                                focus:outline-none focus:ring-2 focus:ring-primary/40
                                ${errors.deadline ? 'border-error' : 'border-border focus:border-primary'}`}
                        />
                        {errors.deadline && <p className="text-xs text-error mt-1">{errors.deadline}</p>}
                    </div>

                    <fieldset className="mb-4">
                        <legend className="block text-sm font-medium text-ink mb-2">Required skills</legend>
                        <div className="grid grid-cols-2 gap-2">
                            {skills.map((s) => (
                                <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                                <input type="checkbox" checked={skillIds.includes(s.id)} onChange={() => toggleSkill(s.id)} />
                                {s.name}
                                </label>
                            ))}
                        </div>
                        {errors.skillIds && <p className="text-xs text-error mt-1">{errors.skillIds}</p>}
                    </fieldset>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-md transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save as draft'}
                    </button>
                </form>
            </main>
        </div>
    );
}