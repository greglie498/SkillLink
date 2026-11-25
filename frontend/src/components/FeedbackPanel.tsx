import { useCallback, useEffect, useState, type FormEvent } from 'react';
import TextAreaField from './TextAreaField';
import { api, ApiError } from '../lib/api';
import { validateLength, validateRequired } from '../utils/validation';

interface FeedbackItem {
  rating: number;
  comment: string | null;
  createdAt: string;
}

interface FeedbackState {
  completed: boolean;
  counterpart: string;
  windowEndsAt: string | null;
  canSubmit: boolean;
  visible: boolean;
  mine: FeedbackItem | null;
  otherSubmitted: boolean;
  other: FeedbackItem | null;
}

const card = 'bg-white border border-[#E8E8ED] rounded-card shadow-sm p-6';

function RatingDots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-2.5 h-2.5 rounded-full ${n <= value ? 'bg-primary' : 'bg-[#EEEEF1]'}`} />
      ))}
      <span className="ml-2 text-xs font-semibold text-ink">{value} / 5</span>
    </span>
  );
}

function Entry({ title, item }: { title: string; item: FeedbackItem }) {
  return (
    <div className="py-4 border-b border-[#EEEEF1] last:border-0">
      <p className="text-[11px] font-semibold text-[#60606B] mb-2">{title}</p>
        <RatingDots value={item.rating} />
      <p className="text-sm text-[#454550] mt-2 whitespace-pre-line">{item.comment}</p>
    </div>
  );
}

export default function FeedbackPanel({ projectId }: { projectId: string }) {
    const [state, setState] = useState<FeedbackState | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingError, setRatingError] = useState<string | null>(null);
    const [commentError, setCommentError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            setState(await api<FeedbackState>(`/projects/${projectId}/feedback`, { auth: true }));
            setError(null);
        } catch {
            setError('Could not load feedback.');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        const rErr = rating >= 1 && rating <= 5 ? null : 'Choose a rating from 1 to 5.';
        const cErr = validateRequired(comment, 'Comment') ?? validateLength(comment.trim(), 'Comment', 10, 500);
        setRatingError(rErr);
        setCommentError(cErr);
        if (rErr || cErr) return;

        setBusy(true);
        try {
        await api(`/projects/${projectId}/feedback`, {
            method: 'POST',
            auth: true,
            body: { rating, comment: comment.trim() },
        });
        setRating(0);
        setComment('');
        await load();
        } catch (err) {
        if (err instanceof ApiError && err.fieldErrors) {
            setRatingError(err.fieldErrors.rating ?? null);
            setCommentError(err.fieldErrors.comment ?? null);
        } else {
            setFormError(err instanceof ApiError ? err.message : 'Could not reach the server.');
        }
        } finally {
            setBusy(false);
        }
    }

    if (loading) return null;
    if (error) return <p className="text-sm text-error">{error}</p>;
    if (!state || !state.completed) return null;

    const endDate = state.windowEndsAt ? new Date(state.windowEndsAt).toLocaleDateString('en-KE') : '';

    return (
        <div className={card}>
            <h2 className="text-[15px] font-bold text-slate-dark mb-1">Feedback</h2>
            <p className="text-xs text-muted mb-4">
                Each side leaves one rating and comment. They stay hidden until both are submitted or the window ends on {endDate}.
            </p>

            {state.mine && <Entry title="Your feedback" item={state.mine} />}
            {state.other && <Entry title={`Feedback from ${state.counterpart}`} item={state.other} />}

            {state.mine && !state.visible && (
                <p className="text-sm text-[#454550] pt-3">
                    Thank you. {state.counterpart} has not submitted theirs yet. Both will be visible once they do, or on {endDate}.
                </p>
            )}

            {!state.mine && !state.canSubmit && (
                <p className="text-sm text-muted">The feedback window closed on {endDate}.</p>
            )}

            {state.canSubmit && (
                <form onSubmit={submit} noValidate className={state.mine ? 'hidden' : ''}>
                    {state.otherSubmitted && (
                        <p className="text-sm text-[#454550] mb-4">
                        {state.counterpart} has already left feedback. Submit yours to see it.
                        </p>
                    )}
                    {formError && <p className="text-sm text-error mb-3">{formError}</p>}

                    <p className="field-label">Your rating</p>
                    <div className="flex gap-2 mb-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            aria-pressed={rating === n}
                            className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                            rating === n
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-ink border-border hover:border-primary/50'
                            }`}
                        >
                            {n}
                        </button>
                        ))}
                    </div>
                    {ratingError && <p className="text-xs text-error mb-3">{ratingError}</p>}

                    <div className="mt-4">
                        <TextAreaField label={`Comment about ${state.counterpart}`} value={comment} onChange={setComment} error={commentError} maxLength={500} />
                    </div>

                    <button type="submit" disabled={busy} className="btn btn-primary">
                        {busy ? 'Submitting...' : 'Submit feedback'}
                    </button>
                </form>
            )}
        </div>
    );
}