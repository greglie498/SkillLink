export default function MacthBadge({ score }: { score: number }) {
    return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {score}% Match
        </span>
    ); 
} 