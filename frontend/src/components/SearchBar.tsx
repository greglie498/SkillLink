interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export default function SearchBar ( { value, onChange}: SearchBarProps) {
    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Search opportunities by title or skill..."
            className="w-full border border-border rounded-md px-4 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
        />
    );
}