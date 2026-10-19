import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearSession } from "../lib/auth";

const navItems = [
    {label: 'Dashboard', path: '/dashboard'},
    {label: 'Find Opportunities', path: '/Opportunities'},
    {label: 'Applications', path: '/applications'},
    {label: 'Projects', path: '/projects'},
    {label: 'Notifications', path: '/notifications'},
    {label: 'Profile', path: '/profile'},
];

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <aside className="hidden md:flex w-60 bg-slate-dark text-white flex-col py-6 px-4 min-h-screen">
            <div className="text-xl font-bold text-primary mb-8 px-2">SkillLink</div>
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.label}
                            to={item.path}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                                ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <button
                onClick={() => {
                    clearSession();
                    navigate('/');
                }}
                className="mt-auto px-3 py-2 rounded-md text-sm font-medium text-left text-gray-300 hover:text-white transition-colors"
            >
                Logout
            </button>
        </aside>
    );
}