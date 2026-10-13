interface TextAreaFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
    maxLength?: number;
}

export default function TextAreaField({ label, value, onChange, error, maxLength }: TextAreaFieldProps) {
    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-ink">{label}</label>
                {maxLength && (
                    <span className="text-xs text-muted">{value.length}/{maxLength}</span>
                )}
            </div>
            <textarea 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className={`w-full border rounded-md px-4 py-2 text-sm text-ink resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary/40
                    ${error ? 'border-border' : 'border-border focus:border-primary'}`}
            />
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    )
}