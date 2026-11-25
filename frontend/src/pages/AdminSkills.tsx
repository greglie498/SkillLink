import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Sidebar from '../components/Sidebar';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { api, ApiError } from '../lib/api';

interface SkillRow {
  id: string;
  name: string;
  isActive: boolean;
  talents: number;
  opportunities: number;
}

export default function AdminSkills() {
    const [skills, setSkills] = useState<SkillRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setSkills(await api<SkillRow[]>('/admin/skills', { auth: true }));
            setError(null);
        } catch {
            setError('Could not load the skills catalogue.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function add(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setNotice(null);
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 40) {
            setNameError('Skill name must be between 2 and 40 characters.');
            return;
        }
        setNameError(null);

        setBusy(true);
        try {
            await api('/admin/skills', { method: 'POST', auth: true, body: { name: trimmed } });
            setName('');
            await load();
        } catch (err) {
            if (err instanceof ApiError && err.fieldErrors?.name) setNameError(err.fieldErrors.name);
            else setNotice(err instanceof ApiError ? err.message : 'Could not reach the server.');
        } finally {
            setBusy(false);
        }
    }

    async function update(s: SkillRow, body: { name?: string; isActive?: boolean }) {
        setNotice(null);
        try {
            await api(`/admin/skills/${s.id}`, { method: 'PATCH', auth: true, body });
            await load();
        } catch (err) {
            setNotice(err instanceof ApiError ? (err.fieldErrors?.name ?? err.message) : 'Could not reach the server.');
        }
    }

    function rename(s: SkillRow) {
        const next = window.prompt('New name for this skill:', s.name);
        if (next === null || next.trim() === s.name) return;
        update(s, { name: next.trim() });
    }

    function toggle(s: SkillRow) {
        if (s.isActive && !window.confirm(`Deactivate "${s.name}"? It will no longer be offered for new profiles and opportunities. Existing ones keep it.`)) return;
        update(s, { isActive: !s.isActive });
    }

    const active = skills.filter((s) => s.isActive).length;

    return (
        <div className="flex min-h-screen bg-surface">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 max-w-none">
                <PageHeader title="Skills Catalogue" sub="The skills talent can add to profiles and businesses can require. Skills are deactivated, never deleted." />

                <div className="grid grid-cols-3 gap-4 mb-6">
                <StatCard icon="spark" label="Skills" value={skills.length} />
                <StatCard icon="check" label="Active" value={active} />
                <StatCard icon="file" label="Deactivated" value={skills.length - active} />
                </div>

                <form onSubmit={add} noValidate className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-5 mb-6 flex flex-wrap gap-3 items-start">
                <div className="flex-1 min-w-[220px]">
                    <label className="field-label">Add a skill</label>
                    <input className={`field ${nameError ? 'field-error' : ''}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Docker" />
                    {nameError && <p className="text-xs text-error mt-1.5">{nameError}</p>}
                </div>
                <button type="submit" disabled={busy} className="btn btn-primary mt-6">
                    {busy ? 'Adding...' : 'Add skill'}
                </button>
                </form>

                {notice && <p className="text-sm text-error mb-4">{notice}</p>}
                {loading && <p className="text-sm text-muted">Loading...</p>}
                {error && <p className="text-sm text-error">{error}</p>}

                {skills.length > 0 && (
                <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface text-left text-[#6E6E78] border-b border-border">
                            <th className="px-5 py-3.5 font-semibold">Skill</th>
                            <th className="px-5 py-3.5 font-semibold">On profiles</th>
                            <th className="px-5 py-3.5 font-semibold">Required by</th>
                            <th className="px-5 py-3.5 font-semibold">Status</th>
                            <th className="px-5 py-3.5 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {skills.map((s) => (
                            <tr key={s.id} className="border-b border-[#EEEEF1] last:border-0 hover:bg-[#FFFAF8] transition-colors">
                                <td className="px-5 py-3.5 font-semibold text-ink">{s.name}</td>
                                <td className="px-5 py-3.5 text-[#454550]">{s.talents}</td>
                                <td className="px-5 py-3.5 text-[#454550]">{s.opportunities}</td>
                                <td className="px-5 py-3.5">
                                <span
                                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                    s.isActive
                                        ? 'bg-[#EAF7F0] text-[#237D50] border border-[#C7EAD7]'
                                        : 'bg-[#F2F2F5] text-[#60606B] border border-transparent'
                                    }`}
                                >
                                    {s.isActive ? 'Active' : 'Deactivated'}
                                </span>
                                </td>
                                <td className="px-5 py-3.5">
                                <div className="flex gap-4">
                                    <button onClick={() => rename(s)} className="text-xs font-semibold text-primary-dark">
                                    Rename
                                    </button>
                                    <button onClick={() => toggle(s)} className={`text-xs font-semibold ${s.isActive ? 'text-error' : 'text-success'}`}>
                                    {s.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                )}
            </main>
        </div>
    );
}