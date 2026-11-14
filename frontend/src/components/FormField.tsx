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
            <label className="field-label">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`field ${error ? 'field-error' : ''}`}            
            />
            {error && <p className="text-xs text-error mt-1.5">{error}</p>}
        </div>
    );
}