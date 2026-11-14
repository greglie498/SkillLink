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
            <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-semibold text-ink">{label}</label>
                {maxLength && (
                    <span className={`text-xs ${value.length > maxLength ? 'text-error' : 'text-muted'}`}>
                        {value.length}/{maxLength}
                    </span>
                )}
            </div>
            <textarea 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className={`field resize-none ${error ? 'field-error' : ''}`}
            />
            {error && <p className="text-xs text-error mt-1.5">{error}</p>}
        </div>
    )
}