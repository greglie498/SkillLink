export default function MatchBadge({ score }: { score: number }) {
    const tone =
        score >= 70
        ? { pill: 'bg-[#EAF7F0] border-[#C7EAD7] text-[#237D50]', dot: 'bg-success' }
        : score >= 40
            ? { pill: 'bg-[#FFF6E5] border-[#F5DFB4] text-[#A66E12]', dot: 'bg-warning' }
            : { pill: 'bg-[#F2F2F5] border-transparent text-[#60606B]', dot: 'bg-muted'};

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold whitespace-nowrap ${tone.pill}`}>
            <span className={`w-2 h-2 rounded-full ${tone.dot}`} />
            {score}% Match
        </span>
    ); 
} 