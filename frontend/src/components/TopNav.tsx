import { Link, useLocation } from 'react-router-dom';
import { getToken, getUser, homePathFor } from '../lib/auth';
import { SkillLinkLogo } from './SkillLinkLogo';

export default function TopNav() {
    const { pathname } = useLocation();
    const user = getToken() ? getUser() : null;
    const link = 'text-[13px] font-medium text-[#60606B] hover:text-slate-deep';

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-[#EEEEF1]">
            <div className="max-w-[1240px] mx-auto px-8 h-full flex items-center">
                <Link to="/" className="flex items-center gap-2.5 mr-12">
                    <span className="w-9 h-9 rounded-xl text-white flex items-center justify-center">
                        <SkillLinkLogo className="w-5 h-5" />
                    </span>
                    <span className="text-[18px] font-bold tracking-tight text-slate-deep">
                        SkillLink <span className="text-primary">Kenya</span>
                    </span>
                </Link>
                
                <nav className="hidden md:flex gap-8 flex-1">
                    <Link to='/' className={pathname === '/' ? 'text-[13px] font-medium text-primary-dark' : link}>
                        Home
                    </Link>
                    <Link to='/register?role=talent' className={link}>
                        For Talent
                    </Link>
                    <Link to='/register?role=business' className={link}>
                        For Business
                    </Link>
                    <a href="/#how-it-works" className="text-sm font-medium text-ink hover:text-primary hidden sm:inline">
                        How it works
                    </a>
                </nav>

                <div className='flex items-center gap-3 ml-auto'>
                    {user ? (
                        <Link to={homePathFor(user.role)} className="btn btn-primary btn-sm">
                            Go to dashboard
                        </Link>
                    ) : (
                        <>
                            <Link to="/login" className="px-3 py-2 text-[13px] font-semibold text-slate-dark hover:text-primary-dark">
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary btn-sm">
                                Get started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}