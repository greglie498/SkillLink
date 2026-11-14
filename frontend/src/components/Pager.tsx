export default function Pager({
    page, 
    total,
    pageSize,
    noun,
    onChange,
}: {
    page: number;
    total: number;
    pageSize: number;
    noun: string;
    onChange: (page: number) => void;
}) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return (
        <div className="flex items-center gap-4 mt-4 text-sm text-muted">
            <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="disabled:opacity-40 text-primary-dark font-semibold">
                Previous
            </button>
            <span>
                Page {page} of {pages} ({total} {noun})
            </span>
            <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="disabled:opacity-40 text-primary-dark font-semibold">
                Next
            </button>
        </div>
    );
}