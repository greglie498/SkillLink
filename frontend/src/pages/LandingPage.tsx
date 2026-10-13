import { Link } from "react-router-dom";
import TopNav from "../components/TopNav";
import BenefitCard from '../components/BenefitCard';

const talentBenefits = [
    { title: 'Build Real Experience', description: 'Work on paid projects with real SMEs while you study your career.'},
    { title: 'Skills-Based Matching', description: 'Get matched to opportunities based on the skills you already have.'},
    { title: 'Grow Your Portfolio', description: 'Every project becomes proof of your work for future employers.'},
];

const businessBenefits = [
    { title: 'Affordable Skilled Talent', description: 'Access skilled students and early-career professionals without full-time hiring costs'},
    { title: 'Short-term & Flexible', description: 'Post project-based work that fits your budget and timeline.'},
    { title: 'Verified Candidates', description: 'Review skills, portfolios, and match scores before you select talent.'},
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            <TopNav />

            {/* Hero */}
            <section className="max-w-4xl mx-auto text-center px-6 py-20">
                <h1 className="text-4xl font-bold text-ink mb-4">
                    Connecting Talent with Real Opportunities
                </h1>
                <p className="text-based text-muted mb-8 max-w-2xl mx-auto">
                    SkillLink help university students and early-career professionals gain practical
                    work experience, while giving SMEs affordable access to skilled talent for 
                    short-term projects.
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        to="/register?role=talent"
                        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-6 py-3 rounded-md transition-colors"
                    >
                        Find Opportunities
                    </Link>
                    <Link
                        to="/register?role=business"
                        className="bg-white border border-primary text-primary hover:bg-primary/5 text-sm font-medium px-6 py-3 rounded-md transition-colors"
                    >
                        Hire Talent
                    </Link>
                </div>
            </section>

            {/* Benefits for Talent */}
            <section className="max-w-5xl mx-auto px-6 py-16">
                <h2 className="text-2xl font-bold text-ink mb-8">For Talent</h2>
                <div className="grid grid-cols md:grid-cols-3 gap-6">
                    {talentBenefits.map((b) => (
                        <BenefitCard key={b.title} title={b.title} description={b.description} />
                    ))}
                </div>
            </section>

            {/* Benefits For Businesses */}
            <section className="bg-surface py-16">
                <div className="max-w-5xl mx-auto px-6">
                    <h2 className="text-2xl font-bold text-ink mb-8">For Businesses</h2>
                    <div className="grid grid-cols md:grid-cols-3 gap-6">
                        {businessBenefits.map((b) => (
                            <BenefitCard key={b.title} title={b.title} description={b.description} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="max-w-4xl mx-auto text-center px-6 py-16">
                <h2 className="text-2xl font-bold text-ink mb-4">Ready to get started?</h2>
                <div className="flex justify-center gap-4">
                    <Link
                        to="/register"
                        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-6 py-3 rounded-md transition-colors"
                    >
                        Create an Account
                    </Link>
                </div>
            </section>
        </div>
    )
}