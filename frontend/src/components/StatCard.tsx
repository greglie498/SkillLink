export default function StatCard({
    label,
    value,
    hint,
    warn,
}: {
    label: string;
    value: number | string;
    hint?: string;
    warn?: boolean;
}) {
    return (
        <div className={`bg-white border rounded-card p-5 shadow-sm ${warn ? 'border-warning/50' : 'border-border'}`}>
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={`text-3xl font-bold ${warn ? 'text-warning' : 'text-ink'}`}>{value}</p>
            {hint && <p className="text-=xs text-muted mt-1">{hint}</p>}
        </div>
    );
}