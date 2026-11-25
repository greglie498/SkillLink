import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Icon, { type IconName } from '../components/Icon';
import MatchBadge from '../components/MatchBadge';

const highlights = [
    { title: 'Skills-based', caption: 'Matching you can explain' },
    { title: 'Verified', caption: 'Businesses before they post' },
    { title: 'Transparent', caption: 'Hiring decisions stay human' },
    { title: 'Local', caption: "Built for Kenya's SMEs and talent" },
];

const steps: { n: string; title: string; desc: string; icon: IconName }[] = [
    {
        n: '01',
        title: 'Build your skills profile',
        desc: 'Showcase your education, experience, portfolio and availability in one trusted profile.',
        icon: 'user',
    },
    {
        n: '02',
        title: 'See where you match',
        desc: 'Explore transparent match scores based on the skills each opportunity requires.',
        icon: 'spark',
    },
    {
        n: '03',
        title: 'Start doing real work',
        desc: 'Apply directly to verified SMEs and grow through paid, practical experience.',
        icon: 'briefcase',
    },
];

const audiences: {
    eyebrow: string;
    title: string;
    desc: string;
    benefits: string[];
    to: string;
}[] = [
    {
        eyebrow: 'For talent',
        title: 'Turn your skills into experience',
        desc: 'Find paid opportunities that fit your goals, schedule and level, then build proof of what you can do.',
        benefits: ['Transparent match scores', 'Verified Kenyan businesses', 'Portfolio-building work'],
        to: '/register?role=talent',
    },
    {
        eyebrow: 'For Kenyan SMEs',
        title: 'The right skills, right when you need them',
        desc: 'Access motivated emerging professionals without adding complexity to your hiring process.',
        benefits: ['Ranked skills-based candidates', 'Flexible project and role types', 'Simple verification and review'],
        to: '/register?role=business',
    },
];

const chip = 'text-xs bg-surface border border-border rounded-full px-2.5 py-0.5 text-ink';

export default function LandingPage() {
    return (
        <div className="bg-white text-ink">
            <TopNav />

            <section className="px-8 pt-16 pb-20 overflow-hidden">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 lg:grid-cols-[1.02fr_.98fr] gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-tint border border-primary-light px-3 py-1.5 text-[11px] font-bold text-primary-dark mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Built for Kenya's next generation of talent
                        </div>
                        <h1 className="text-4xl md:text-[58px] leading-[1.05] tracking-tight font-bold text-slate-deep max-w-xl">
                            Skills open doors. <span className="text-primary">We make the connection.</span>
                        </h1>
                        <p className="mt-6 text-[17px] leading-7 text-[#6E6E78] max-w-xl">
                            Discover paid projects, internships and entry-level roles with verified Kenyan SMEs, or find skilled
                            emerging talent ready to make an impact.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-8">
                            <Link to="/register?role=talent" className="btn btn-primary btn-lg gap-2">
                                Find opportunities <Icon name="arrow" className="w-4 h-4" />
                            </Link>
                            <Link to="/register?role=business" className="btn btn-secondary btn-lg">
                                Hire talent
                            </Link>
                        </div>
                        <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-9 pt-7 border-t border-[#EEEEF1] max-w-lg text-sm text-slate-dark">
                            {['Free to join', 'Skills-based matching', 'Businesses verified before they post'].map((t) => (
                                <li key={t} className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-[#EAF7F0] text-success flex items-center justify-center">
                                    <Icon name="check" className="w-3 h-3" />
                                </span>
                                {t}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative h-[420px] lg:h-[560px]">
                        <div className="absolute inset-0 rounded-[28px] overflow-hidden bg-slate-dark shadow-[0_30px_70px_rgba(30,33,48,.18)]">
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/hero.svg')" }} />
                            <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-deep/90 to-transparent" />
                            <div className="absolute left-8 right-8 bottom-8 text-white">
                                <p className="text-xs uppercase tracking-[.16em] text-white/65 mb-2">Real work, real experience</p>
                                <p className="text-xl font-semibold max-w-sm">
                                    Show what you can do. Hire people for what they can do.
                                </p>
                        </div>
                        </div>

                        <div className="absolute -left-4 lg:-left-10 top-10 w-64 bg-white border border-[#E8E8ED] rounded-2xl p-4 shadow-[0_18px_50px_rgba(30,33,48,.14)]">
                            <span className="absolute -top-2.5 left-4 bg-slate-dark text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                Example
                            </span>
                            <div className="flex justify-between items-start">
                                <div className="w-10 h-10 rounded-xl bg-primary-tint text-primary font-bold flex items-center justify-center">
                                    FD
                                </div>
                                <MatchBadge score={92} />
                            </div>
                            <p className="text-sm font-bold text-slate-dark mt-3">Frontend Developer</p>
                            <p className="text-xs text-muted mt-1">Small business, Nairobi</p>
                            <div className="flex gap-1.5 mt-3">
                                <span className={chip}>React</span>
                                <span className={chip}>Tailwind CSS</span>
                            </div>
                        </div>

                        <div className="absolute -right-2 lg:-right-6 top-20 bg-white rounded-xl px-4 py-3 shadow-[0_14px_40px_rgba(30,33,48,.16)] flex items-center gap-3">
                            <div className="w-9 h-9 bg-[#EAF7F0] text-success rounded-full flex items-center justify-center">
                                <Icon name="check" className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-dark">Verified business</p>
                                <p className="text-[10px] text-muted">Approved before posting</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-y border-[#EEEEF1] bg-[#FAFAFB] px-8 py-7">
                <div className="max-w-[1240px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x divide-border">
                    {highlights.map((h) => (
                        <div key={h.title} className="text-center px-4">
                        <p className="text-2xl font-bold text-slate-dark tracking-tight">{h.title}</p>
                        <p className="text-xs text-muted mt-1">{h.caption}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section id="how-it-works" className="px-8 py-24">
                <div className="max-w-[1240px] mx-auto">
                    <div className="text-center max-w-xl mx-auto">
                        <p className="text-xs font-bold uppercase tracking-[.16em] text-primary">Simple by design</p>
                        <h2 className="text-4xl tracking-tight font-bold text-slate-deep mt-3">From potential to progress</h2>
                        <p className="text-sm leading-6 text-[#777782] mt-3">
                            A transparent, skills-first path to meaningful work, with no endless forms or opaque algorithms.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
                        {steps.map((s) => (
                            <div
                                key={s.n}
                                className="bg-white border border-[#E8E8ED] rounded-card p-7 shadow-sm hover:-translate-y-1 hover:shadow-lift transition-all"
                            >
                                <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-primary-tint text-primary flex items-center justify-center">
                                    <Icon name={s.icon} className="w-6 h-6" />
                                </div>
                                <span className="text-[11px] font-bold text-[#C1C1C8]">{s.n}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-dark mt-6">{s.title}</h3>
                                <p className="text-sm leading-6 text-[#777782] mt-2">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="px-8 py-20 bg-surface">
                <div className="max-w-[1240px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {audiences.map((a) => (
                        <div key={a.eyebrow} className="bg-white rounded-2xl border border-border p-9">
                            <p className="text-xs uppercase tracking-[.15em] font-bold text-primary">{a.eyebrow}</p>
                            <h3 className="text-2xl font-bold tracking-tight text-slate-dark mt-3">{a.title}</h3>
                            <p className="text-sm leading-6 text-[#777782] mt-3 max-w-lg">{a.desc}</p>
                            <ul className="space-y-3 mt-6">
                                {a.benefits.map((b) => (
                                <li key={b} className="flex gap-3 text-sm text-[#454550]">
                                    <span className="w-5 h-5 rounded-full bg-[#EAF7F0] text-success flex items-center justify-center shrink-0">
                                    <Icon name="check" className="w-3 h-3" />
                                    </span>
                                    {b}
                                </li>
                                ))}
                            </ul>
                            <Link to={a.to} className="inline-flex items-center gap-2 mt-8 text-sm font-bold text-primary-dark">
                                Get started <Icon name="arrow" className="w-4 h-4" />
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            <section className="px-8 py-20">
                <div className="max-w-[1240px] mx-auto bg-slate-dark rounded-[24px] px-8 md:px-14 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute w-72 h-72 rounded-full bg-primary opacity-10 -right-20 -top-32" />
                    <div className="relative">
                        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#FF9A83]">Your next step starts here</p>
                        <h2 className="text-3xl font-bold text-white tracking-tight mt-3">Ready to turn skills into momentum?</h2>
                        <p className="text-sm text-white/55 mt-2">
                            Join a marketplace built for emerging talent and growing Kenyan businesses.
                        </p>
                    </div>
                    <Link to="/register" className="relative btn btn-primary btn-lg">
                        Create your account
                    </Link>
                </div>
            </section>

            <footer className="border-t border-border px-8 py-8">
                <div className="max-w-[1240px] mx-auto flex flex-wrap items-center justify-between gap-2">
                    <p className="font-bold text-slate-dark">
                        SkillLink <span className="text-primary">Kenya</span>
                    </p>
                    <p className="text-xs text-[#A0A0A8]">A university capstone prototype, 2026</p>
                </div>
            </footer>
        </div>
    );
}