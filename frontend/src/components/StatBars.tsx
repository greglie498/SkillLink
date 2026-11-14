export interface Bar {
    label: string;
    value: number;
    color: string;
}

export default function StatBars({ title, bars }: { title: string; bars: Bar[] }) {
    const max = Math.max(1, ...bars.map((b) => b.value));
    return (
        <div className="bg-white border border-[#E8E8ED] rounded-card p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-slate-dark mb-4">{title}</h3>
            <ul className="space-y-3.5">
                {bars.map((b) => (
                    <li key={b.label}>
                       <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-ink font-medium">{b.label}</span>
                            <span className="text-muted">{b.value}</span>
                        </div> 
                        <div className="w-full bg-[#EEEEF1] rounded-full h-2 overflow-hidden">
                            <div className={`${b.color} h-2 rounded-full`} style={{ width: `${((b.value) / max) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}