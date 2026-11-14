import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { type IconName } from './Icon';
import { clearSession, getUser, type SessionUser } from '../lib/auth';
import { SkillLinkLogo } from './SkillLinkLogo';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  soon?: boolean;
}

const navByRole: Record<SessionUser['role'], NavItem[]> = {
  TALENT: [
    { label: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Find Opportunities', path: '/opportunities', icon: 'search' },
    { label: 'Applications', path: '/applications', icon: 'file' },
    { label: 'Projects', path: '/projects', icon: 'briefcase', soon: true },
    { label: 'Notifications', path: '/notifications', icon: 'bell', soon: true },
    { label: 'Profile', path: '/profile', icon: 'user' },
  ],
  BUSINESS: [
    { label: 'Opportunities', path: '/business', icon: 'briefcase' },
    { label: 'New Opportunity', path: '/business/opportunities/new', icon: 'plus' },
    { label: 'Reports', path: '/business/reports', icon: 'chart' },
  ],
  ADMIN: [
    { label: 'Dashboard', path: '/admin', icon: 'home' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Audit Log', path: '/admin/audit', icon: 'shield' },
  ],
};

export default function Sidebar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const user = getUser();
    const items = navByRole[user?.role ?? 'TALENT'];

    // The most specific matching item is the active one
    const current = items
        .filter((i) => !i.soon && (pathname === i.path || pathname.startsWith(i.path + '/')))
        .sort((a, b) => b.path.length - a.path.length)[0];

    return (
        <aside className="hidden md:flex w-64 shrink-0 sticky top-0 self-start h-screen flex-col bg-gradient-to-b from-slate-dark to-slate-deep text-white py-6 px-4">
        <div className="flex items-center gap-2.5 px-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <SkillLinkLogo className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">SkillLink</span>
        </div>

        <nav className="flex flex-col gap-1">
            {items.map((item) => {
            const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors';
            if (item.soon) {
                return (
                <div key={item.label} className={`${base} text-gray-500 cursor-not-allowed`}>
                    <Icon name={item.icon} className="w-[18px] h-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-500">Soon</span>
                </div>
                );
            }
            const active = item === current;
            return (
                <Link
                key={item.label}
                to={item.path}
                className={`${base} ${
                    active
                    ? 'bg-primary text-white shadow-[0_6px_18px_rgba(255,107,74,.25)]'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                >
                <Icon name={item.icon} className="w-[18px] h-[18px]" />
                {item.label}
                </Link>
            );
            })}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary-tint text-primary-dark flex items-center justify-center text-sm font-bold uppercase shrink-0">
                {user?.email?.[0] ?? 'U'}
            </div>
            <div className="min-w-0">
                <p className="text-xs text-white truncate">{user?.email}</p>
                <p className="text-[11px] text-gray-400 capitalize">{user?.role.toLowerCase()}</p>
            </div>
            </div>
            <button
            onClick={() => {
                clearSession();
                navigate('/');
            }}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            >
            Logout
            </button>
        </div>
        </aside>
    );
}