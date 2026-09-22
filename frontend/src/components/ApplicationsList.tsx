import { applications } from '../data/mockData';

const statusStyles: Record<string, string> = {
    Pending: 'bg-warning/10 text-warning',
    Shortlisted: 'bg-info/10 text-info',
    Accepted: 'bg-success/10 text-success',
    Rejected: 'bg-error/10 text-error',
}

export default function ApplicationsList() {
    return (
        <div className="bg-white border border-border rounded-card p-6 shadow-sm">
            <h3 className='text-sm font-semibol text-ink mb-4'>Recent Applications</h3>
            <ul className="flex flex-col gap-3">
                {applications.map((app) => (
                    <li key={app.id} className="flex justify-between items-center text-sm">
                        <span className="text-ink">{app.opportunity}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[app.status]}`}>
                            {app.status}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    )
}