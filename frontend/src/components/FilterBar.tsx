const skillOptions = ['All Skills', 'React', 'Node.js', 'PostGreSQL', 'Content Writing', 'React Native'];

interface FilterBarProps {
    selected: string;
    onChange: (value: string) => void;
}

export default function FilterBar( { selected, onChange }: FilterBarProps) {
    return (
        <div className="flex gap-2 flex-wrap">
            {skillOptions.map((skill) => (
                <button
                    key={skill}
                    onClick={() => onChange(skill)}
                    className= { `text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                        ${selected == skill
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-ink border-border hover:border-primary/50'
                        }`}
                >
                    {skill}
                </button>
            ))}
        </div>
    );
}