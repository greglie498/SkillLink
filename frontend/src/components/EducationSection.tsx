import { useState, type FormEvent } from 'react';
import FormField from './FormField';
import { api, ApiError } from '../lib/api';

export interface EducationItem {
  id: string;
  institution: string;
  qualification: string;
  startYear: number | null;
  endYear: number | null;
}

type Errors = Partial<Record<'institution' | 'qualification' | 'startYear' | 'endYear', string | null>>;

function yearProblem(v: string): string | null {
  if (!v.trim()) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1950 || n > 2100) return 'Enter a year between 1950 and 2100.';
  return null;
}

export default function EducationSection({
  items,
  onChange,
}: {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}) {
    const [institution, setInstitution] = useState('');
    const [qualification, setQualification] = useState('');
    const [startYear, setStartYear] = useState('');
    const [endYear, setEndYear] = useState('');
    const [errors, setErrors] = useState<Errors>({});
    const [message, setMessage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function add(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);

        const found: Errors = {
        institution: institution.trim() ? null : 'Institution is required.',
        qualification: qualification.trim() ? null : 'Qualification is required.',
        startYear: yearProblem(startYear),
        endYear: yearProblem(endYear),
        };
        if (!found.startYear && !found.endYear && startYear.trim() && endYear.trim() && Number(endYear) < Number(startYear)) {
        found.endYear = 'End year cannot be before the start year.';
        }
        setErrors(found);
        if (Object.values(found).some(Boolean)) return;

        setBusy(true);
        try {
        const created = await api<EducationItem>('/talent/education', {
            method: 'POST',
            auth: true,
            body: {
            institution: institution.trim(),
            qualification: qualification.trim(),
            startYear: startYear.trim() ? Number(startYear) : undefined,
            endYear: endYear.trim() ? Number(endYear) : undefined,
            },
        });
        onChange([...items, created]);
        setInstitution('');
        setQualification('');
        setStartYear('');
        setEndYear('');
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors({
            institution: err.fieldErrors.institution ?? null,
            qualification: err.fieldErrors.qualification ?? null,
            startYear: err.fieldErrors.startYear ?? null,
            endYear: err.fieldErrors.endYear ?? null,
            });
        } else {
            setMessage(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
        setBusy(false);
        }
    }

    async function remove(id: string) {
        setMessage(null);
        try {
        await api(`/talent/education/${id}`, { method: 'DELETE', auth: true });
        onChange(items.filter((i) => i.id !== id));
        } catch (err) {
        setMessage(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
    }

    return (
        <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6">
        <h2 className="text-[15px] font-bold text-slate-dark mb-4">Education</h2>

        {message && <p className="text-sm text-error mb-3">{message}</p>}

        {items.length === 0 ? (
            <p className="text-sm text-muted mb-4">No education added yet.</p>
        ) : (
            <ul className="mb-5 divide-y divide-[#EEEEF1]">
            {items.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{e.qualification}</p>
                    <p className="text-xs text-muted">
                    {e.institution}
                    {(e.startYear || e.endYear) && ` - ${e.startYear ?? ''}${e.startYear && e.endYear ? ' to ' : ''}${e.endYear ?? ''}`}
                    </p>
                </div>
                <button onClick={() => remove(e.id)} className="text-xs font-semibold text-error shrink-0">
                    Remove
                </button>
                </li>
            ))}
            </ul>
        )}

        <form onSubmit={add} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <FormField label="Qualification" value={qualification} onChange={setQualification} error={errors.qualification ?? null} placeholder="e.g. BSc Software Engineering" />
            <FormField label="Institution" value={institution} onChange={setInstitution} error={errors.institution ?? null} placeholder="e.g. USIU-Africa" />
            <FormField label="Start year (optional)" value={startYear} onChange={setStartYear} error={errors.startYear ?? null} placeholder="e.g. 2022" />
            <FormField label="End year (optional)" value={endYear} onChange={setEndYear} error={errors.endYear ?? null} placeholder="e.g. 2026" />
            <div className="md:col-span-2">
            <button type="submit" disabled={busy} className="btn btn-secondary btn-sm">
                {busy ? 'Adding...' : 'Add education'}
            </button>
            </div>
        </form>
        </div>
    );
}