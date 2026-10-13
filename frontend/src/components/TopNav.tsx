import { Link } from 'react-router-dom';

export default function TopNav() {
    return (
        <header className="border-b border-border bg-white">
            <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                <div className="text-xl font-bold text-primary">SkillLink</div>
                <nav className="flex items-center gap-6">
                    <a href="#how-it-works" className="text-sm text-ink hover:text-primary">How It Works</a>
                    <Link to="/login" className="text-sm text-ink hover:text-primary">Login</Link>
                    <Link
                        to="/register"
                        className="text-sm font-medium bg-primary hover:bg-primary-dark text-white px_4 py-2 rounded-md transition-colors"
                    >

                    </Link>
                </nav>
            </div>
        </header>
    );
}