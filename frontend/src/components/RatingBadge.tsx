export interface RatingDto {
    average: number;
    count: number;
}

export default function RatingBadge({ rating, empty = 'No reviews yet'}: {rating?: RatingDto | null; empty?: string | null}) {
    if (!rating) return empty ? <span className="text-xs text-muted">{empty}</span> : null;
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {rating.average.toFixed(1)}
            <span className="font-normal text-muted">
                {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
            </span>
        </span>
    );
}