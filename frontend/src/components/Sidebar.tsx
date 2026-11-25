import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon, { type IconName } from './Icon';
import { clearSession, getToken, getUser, type SessionUser } from '../lib/auth';
import { SkillLinkLogo } from './SkillLinkLogo';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

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
        { label: 'Dashboard', path: '/business', icon: 'home' },
        { label: 'New Opportunity', path: '/business/opportunities/new', icon: 'plus' },
        { label: 'Projects', path: '/business/projects', icon: 'briefcase' },
        { label: 'Hiring Report', path: '/business/reports', icon: 'chart' },
        { label: 'Notifications', path: '/notifications', icon: 'bell' },
        { label: 'Business Profile', path: '/business/profile', icon: 'user' },
    ],
  ADMIN: [
        { label: 'Dashboard', path: '/admin', icon: 'home' },
        { label: 'User Management', path: '/admin/users', icon: 'users' },
        { label: 'Verification', path: '/admin/verification', icon: 'shield'},
        { label: 'Opportunities', path: '/admin/opportunities', icon: 'briefcase'},
        { label: 'Skills Catalogue', path: '/admin/skills', icon: 'spark' },
        { label: 'Analytics', path: '/admin/analytics', icon: 'chart'},
        { label: 'Audit Log', path: '/admin/audit', icon: 'file' },
  ],
};

const workspaceLabel: Record<SessionUser['role'], string> = {
    TALENT: 'Talent workspace',
    BUSINESS: 'Business workspace',
    ADMIN: 'Operations',
};

export default function Sidebar() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const user = getUser();
    const role = user?.role ?? 'TALENT';
    const items = navByRole[user?.role ?? 'TALENT'];
    const [unread, setUnread] = useState(0);

    // Refresh the unread count whenever the user moves to another page
    useEffect(() => {
        if (!getToken() || role === 'ADMIN') return;
        let cancelled = false;
        api<{ unread: number }>('/notifications/unread-count', { auth: true })
        .then((d) => {
            if (!cancelled) setUnread(d.unread);
        })
        .catch(() => {
            /* the badge is optional */
        });
        return () => {
        cancelled = true;
        };
    }, [pathname, role]);

  // The most specific matching item is the active one
    const current = items
        .filter((i) => !i.soon && (pathname === i.path || pathname.startsWith(i.path + '/')))
        .sort((a, b) => b.path.length - a.path.length)[0];

    return (
        <aside className="hidden md:flex w-64 shrink-0 sticky top-0 self-start h-screen flex-col bg-slate-dark text-white py-6 px-3">
            <Link to='/' className='flex items-center gap-3 px-4 border-b border-white/10'>
                <div className="flex items-center gap-3 px-4 pb-6 border-b border-white/10 mb-8">
                    <div className="w-9 h-9 rounded-xl flex border items-center justify-center shadow-[0_8px_20px_rgba(225,107,74,.25)]">
                        <SkillLinkLogo className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-[18px] font-bold tracking-tight leading-5">SkillLink</div>
                        <div className='text-[9px] uppercase tracking-[.22em] text-white/45'>Kenya</div>
                    </div>
                </div>
            </Link>

            <p className='px-4 pt-6 pb-3 text-[10px] font-semibold uppercase tracking-[.17em] text-white/35'>
                {workspaceLabel[role]}
            </p>

            <nav className="space-y-1">
                {items.map((item) => {
                    const active = item === current;
                    const showBadge = item.path === '/notifications' && unread > 0;
                    return (
                        <Link
                        key={item.label}
                        to={item.path}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all ${
                            active
                            ? 'bg-primary text-white shadow-[0_8px_24px_rgba(255,107,74,.2)]'
                            : 'text-white/65 hover:bg-white/10 hover:text-white'
                        }`}
                        >
                        <Icon name={item.icon} className="w-[18px] h-[18px]" />
                            <span className='flex-1'>{item.label}</span>
                            {showBadge && (
                                <span
                                    className={`text-[10px] font-bold rounded-full px-2 py-0.5 ${
                                        active ? 'bg-white text-primary-dark' : 'bg-primary text-white'
                                    }`}
                                >
                                    {unread}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary-tint ring-2 ring-white/10 text-primary-dark flex items-center justify-center text-sm font-bold uppercase shrink-0">
                        {user?.email?.[0] ?? 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{user?.email}</p>
                        <p className="text-[10px] text-white/40 capitalize">{user?.role.toLowerCase()}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        clearSession();
                        navigate('/');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium text-left text-white/65 hover:bg-white/10 hover:text-white transition-colors"
                >
                    Logout
                </button>
            </div>
        </aside>
    );
}