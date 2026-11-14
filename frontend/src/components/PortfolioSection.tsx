import { useState, type FormEvent } from 'react';
import FormField from './FormField';
import { api, ApiError } from '../lib/api';

export interface PortfolioItem {
  id: string;
  title: string;
  url: string;
}

const isSafeLink = (url: string) => /^https?:\/\//i.test(url);

export default function PortfolioSection({
  items,
  onChange,
}: {
  items: PortfolioItem[];
  onChange: (items: PortfolioItem[]) => void;
}) {
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [errors, setErrors] = useState<{ title?: string | null; url?: string | null }>({});
    const [message, setMessage] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function add(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setMessage(null);

        const found: { title?: string; url?: string } = {};
        if (!title.trim()) found.title = 'Title is required.';
        else if (title.trim().length > 80) found.title = 'Title must be no more than 80 characters.';
        if (!/^https?:\/\//i.test(url.trim())) found.url = 'Enter a link starting with http:// or https://';
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setBusy(true);
        try {
        const created = await api<PortfolioItem>('/talent/portfolio', {
            method: 'POST',
            auth: true,
            body: { title: title.trim(), url: url.trim() },
        });
        onChange([...items, created]);
        setTitle('');
        setUrl('');
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setErrors({ title: err.fieldErrors.title ?? null, url: err.fieldErrors.url ?? null });
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
        await api(`/talent/portfolio/${id}`, { method: 'DELETE', auth: true });
        onChange(items.filter((i) => i.id !== id));
        } catch (err) {
        setMessage(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
    }

    return (
        <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6">
        <h2 className="text-[15px] font-bold text-slate-dark mb-1">Portfolio</h2>
        <p className="text-xs text-muted mb-4">Links to work you want businesses to see. You can attach them to applications.</p>

        {message && <p className="text-sm text-error mb-3">{message}</p>}

        {items.length === 0 ? (
            <p className="text-sm text-muted mb-4">No portfolio links yet.</p>
        ) : (
            <ul className="mb-5 divide-y divide-[#EEEEF1]">
            {items.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                    {isSafeLink(l.url) ? (
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary-dark">
                        {l.title}
                    </a>
                    ) : (
                    <span className="text-sm font-semibold text-ink">{l.title}</span>
                    )}
                    <p className="text-xs text-muted truncate">{l.url}</p>
                </div>
                <button onClick={() => remove(l.id)} className="text-xs font-semibold text-error shrink-0">
                    Remove
                </button>
                </li>
            ))}
            </ul>
        )}

        <form onSubmit={add} noValidate className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <FormField label="Title" value={title} onChange={setTitle} error={errors.title ?? null} placeholder="e.g. E-commerce website" />
            <FormField label="Link" value={url} onChange={setUrl} error={errors.url ?? null} placeholder="https://..." />
            <div className="md:col-span-2">
            <button type="submit" disabled={busy} className="btn btn-secondary btn-sm">
                {busy ? 'Adding...' : 'Add link'}
            </button>
            </div>
        </form>
        </div>
    );
}