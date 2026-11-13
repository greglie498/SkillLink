export interface Bar {
    label: string;
    value: number;
    color: string;
}

export default function StatBars({ title, bars }: { title: string; bars: Bar[] }) {
    const max = Math.max(1, ...bars.map((b) => b.value));
    return (
        <div className="bg-white border border-border rounded-card p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-4">{title}</h3>
            <ul className="space-y-3">
                {bars.map((b) => (
                    <li key={b.label}>
                       <div className="fles justify-between text-xs mb-1">
                            <span className="text-ink">{b.label}</span>
                            <span className="text-muted">{b.value}</span>
                        </div> 
                        <div className="w-full bg-surface rounded-full h-2">
                            <div className={`${b.color} h-2 rounded-full`} style={{ width: `${((b.value) / max) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}