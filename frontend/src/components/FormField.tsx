interface FormFieldProps {
    label: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string | null;
    placeholder?: string;
}

export default function FormField({ label, type = 'text', value, onChange, error, placeholder }: FormFieldProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-ink mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full border rounded-md px-4 py-2 text-sm text-ink
                    focus:outline-none focus:ring-2 focus:ring-primary/40
                    ${error ? 'border-error' : 'border-border focus:border-primary'}`}            
            />
            {error && <p className="text-xs text-error mt-1">{error}</p>}
        </div>
    );
}