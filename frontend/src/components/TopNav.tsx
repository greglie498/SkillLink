import { Link } from 'react-router-dom';
import { getToken, getUser, homePathFor } from '../lib/auth';
import { SkillLinkLogo } from './SkillLinkLogo';

export default function TopNav() {
    const user = getToken() ? getUser() : null;

    return (
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-[#EEEEF1]">
            <div className="max-w-[1240px] mx-auto px-8 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <SkillLinkLogo className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-slate-dark">
                    SkillLink <span className="text-primary">Kenya</span>
                </span>
                </Link>
                <nav className="flex items-center gap-6">
                <a href="/#how-it-works" className="text-sm font-medium text-ink hover:text-primary hidden sm:inline">
                    How it works
                </a>
                {user ? (
                    <Link to={homePathFor(user.role)} className="btn btn-primary btn-sm">
                    Go to dashboard
                    </Link>
                ) : (
                    <>
                    <Link to="/login" className="text-sm font-medium text-ink hover:text-primary">
                        Login
                    </Link>
                    <Link to="/register" className="btn btn-primary btn-sm">
                        Get started
                    </Link>
                    </>
                )}
                </nav>
            </div>
        </header>
    );
}