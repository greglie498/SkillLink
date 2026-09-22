export default function ProfileCompletionCard({ percent }: { percent: number }) {
    return (
        <div className="bg-white border border-border rounded-card p-6 shadow-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-primary">Profile Completion</h3>\
                <span className="text-sm font-semibol text-ink">{percent}%</span>
            </div>
            <div className="w-full bg-surface rounded-full h-2">
                <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <p className="text-xs text-muted mt-2">
                Complete your profile to appear in more recommendations.
            </p>
        </div>
    )
}