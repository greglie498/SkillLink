import { Link } from 'react-router-dom';
import Icon, { type IconName } from './Icon';

export default function StatCard({
    label,
    value,
    hint,
    warn,
    icon = 'chart',
    to,
}: {
    label: string;
    value: number | string;
    hint?: string;
    warn?: boolean;
    icon?: IconName;
    to?: string;
}) {
    const card = (
      <div
        className={`bg-white border rounded-card p-5 shadow-sm transition ${
          warn ? 'border-warning/50' : 'border-[#E8E6E0]'
        } ${to ? 'hover:border-primary/50 hover:shadow-md cursor-pointer' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-muted">{label}</p>
            <p
              className={`text-[28px] leading-none mt-3 font-bold tracking-tight ${
                warn ? 'text-warning' : 'text-slate-deep'
              }`}
            >
              {value}
            </p>
          </div>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              warn ? 'bg-warning/10 text-warning' : 'bg-primary-tint text-primary'
            }`}
          >
            <Icon name={icon} className="w-5 h-5" />
          </div>
        </div>
        {hint && <p className="text-xs text-muted mt-3">{hint}</p>}
      </div>
    );

    if (to) {
      return (
        <Link
          to={to}
          className="block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {card}
        </Link>
      );
    }

    return card;
}