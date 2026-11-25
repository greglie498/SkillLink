import RatingBadge, {type RatingDto} from "./RatingBadge";

export interface ReviewDto {
    rating: number;
    comment: string | null;
    createdAt: string;
    from: string;
    title: string;
}

export default function ReviewsCard({ rating, reviews } : { rating: RatingDto | null; reviews: ReviewDto[]}) {
    return (
        <div className="bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6">
            <div className="flex items-center justify between gap-3 mb-1">
                <h2 className="text-[15px] font-bold text-slate-dark">Reviews</h2>
                <RatingBadge rating={rating} />
            </div>
            <p className="text-xs text-muted mb-4">Everyone sees your average ratings. You see each comment here.</p>
            {reviews.length === 0 ? (
                <p className="test-sm text-muted">No reviews yet. They appear after a project is completed and its feedback becomes visible</p>
            ) : (
                <ul className="divide-y divide-[#EEEEF1]">
                    {reviews.map((r, i) => (
                        <li key={i} className="py-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-ink">{r.from}</p>
                                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString('en-KE')}</span>
                            </div>
                            <p className="text-xs text-muted">{r.title}</p>
                            <p className="text-xs font-semibold text-ink  mt-1">{r.rating} / 5</p>
                            <p className="text-sm text-[#454550] mt-1 whitespace-pre-line">{r.comment}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}