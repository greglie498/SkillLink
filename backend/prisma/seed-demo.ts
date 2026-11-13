import { PrismaClient, type ApplicationStatus, type OpportunityStatus, type VerificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const DAY = 86_400_000;
const today = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
const dateIn = (days: number) => new Date(today + days * DAY);
const ago = (days: number) => new Date(Date.now() - days * DAY);

type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const talents: {
    email: string; name: string; headline: string; location: string; availability: string; skills: [string, Level][];
}[] = [
    { email: 'amina@example.com', name: 'Amina Odhiambo', headline: 'Full-stack developer', location: 'Nairobi, Kenya', availability: '15 hrs/week',
        skills: [['React', 'ADVANCED'], ['Node.js', 'ADVANCED'], ['PostgreSQL', 'INTERMEDIATE']] },
    { email: 'brian@example.com', name: 'Brian Kamau', headline: 'UI and frontend developer', location: 'Nairobi, Kenya', availability: '20 hrs/week',
        skills: [['React', 'INTERMEDIATE'], ['Tailwind CSS', 'ADVANCED'], ['Canva', 'INTERMEDIATE']] },
    { email: 'carol@example.com', name: 'Carol Mwangi', headline: 'Content creator', location: 'Mombasa, Kenya', availability: '10 hrs/week',
        skills: [['Content Writing', 'ADVANCED'], ['Canva', 'INTERMEDIATE']] },
    { email: 'david@example.com', name: 'David Otieno', headline: 'Mobile developer', location: 'Kisumu, Kenya', availability: '12 hrs/week',
        skills: [['React Native', 'ADVANCED'], ['TypeScript', 'INTERMEDIATE'], ['React', 'INTERMEDIATE']] },
];

const businesses: {
    email: string; slug: string; name: string; industry: string; contact: string; verification: VerificationStatus;
}[] = [
    { email: 'quickbook@example.test', slug: 'quickbook', name: 'QuickBook Kenya', industry: 'Software', contact: 'Peter Njoroge', verification: 'VERIFIED' },
    { email: 'mamamboga@example.test', slug: 'mama-mboga', name: 'Mama Mboga Supplies', industry: 'Retail', contact: 'Grace Wanjiku', verification: 'PENDING' },
    { email: 'urbanroots@example.test', slug: 'urban-roots', name: 'Urban Roots Cafe', industry: 'Food and beverage', contact: 'Sam Ochieng', verification: 'PENDING' },
];

interface OppDef {
    owner: string; title: string; category: string; type: string; skills: string[];
    weeks: number; amount: number; remote: boolean; location?: string; days: number; status: OpportunityStatus;
}

const NC = 'owner@nairobicrafts.test';
const QB = 'quickbook@example.test';
const opps: OppDef[] = [
    { owner: NC, title: 'Product Photography Editing', category: 'Design', type: 'Project', skills: ['Canva'], weeks: 2, amount: 12000, remote: true, days: 14, status: 'PUBLISHED' },
    { owner: NC, title: 'Website Copywriting', category: 'Content & Marketing', type: 'Project', skills: ['Content Writing'], weeks: 1, amount: 6000, remote: true, days: 3, status: 'PUBLISHED' },
    { owner: NC, title: 'Logo Refresh', category: 'Design', type: 'Project', skills: ['Canva'], weeks: 1, amount: 5000, remote: true, days: 30, status: 'DRAFT' },
    { owner: QB, title: 'Mobile App Bug Fixes', category: 'Mobile Development', type: 'Project', skills: ['React Native', 'TypeScript'], weeks: 2, amount: 20000, remote: true, days: 10, status: 'PUBLISHED' },
    { owner: QB, title: 'API Integration for Booking System', category: 'Web Development', type: 'Project', skills: ['Node.js', 'PostgreSQL'], weeks: 2, amount: 18000, remote: true, days: 12, status: 'PUBLISHED' },
    { owner: QB, title: 'Customer Dashboard Prototype', category: 'Web Development', type: 'Project', skills: ['React', 'Tailwind CSS', 'TypeScript'], weeks: 3, amount: 22000, remote: true, days: 20, status: 'PUBLISHED' },
    { owner: QB, title: 'Newsletter Setup', category: 'Content & Marketing', type: 'Internship', skills: ['Content Writing', 'Canva'], weeks: 4, amount: 8000, remote: false, location: 'Nairobi', days: 5, status: 'CLOSED' },
];

const apps: { talent: string; title: string; status: ApplicationStatus; daysAgo: number }[] = [
    { talent: 'amina@example.com', title: 'Frontend Developer for E-commerce Site', status: 'SHORTLISTED', daysAgo: 4 },
    { talent: 'brian@example.com', title: 'Frontend Developer for E-commerce Site', status: 'SUBMITTED', daysAgo: 9 },
    { talent: 'david@example.com', title: 'Frontend Developer for E-commerce Site', status: 'REJECTED', daysAgo: 6 },
    { talent: 'amina@example.com', title: 'API Integration for Booking System', status: 'SELECTED', daysAgo: 8 },
    { talent: 'david@example.com', title: 'Mobile App Bug Fixes', status: 'SUBMITTED', daysAgo: 2 },
    { talent: 'brian@example.com', title: 'Customer Dashboard Prototype', status: 'SUBMITTED', daysAgo: 1 },
    { talent: 'jane@example.com', title: 'Customer Dashboard Prototype', status: 'SHORTLISTED', daysAgo: 3 },
    { talent: 'carol@example.com', title: 'Website Copywriting', status: 'SUBMITTED', daysAgo: 10 },
];

async function main() {
    const [skillRows, categoryRows, typeRows] = await Promise.all([
            prisma.skill.findMany(),
            prisma.category.findMany(),
            prisma.opportunityType.findMany(),
    ]);
    const skillId = Object.fromEntries(skillRows.map((s) => [s.name, s.id]));
    const categoryId = Object.fromEntries(categoryRows.map((c) => [c.name, c.id]));
    const typeId = Object.fromEntries(typeRows.map((t) => [t.name, t.id]));
    if (!skillId['React']) throw new Error('Run the base seed first: npx prisma db seed');

    const passwordHash = await bcrypt.hash('Password123', 12);

    for (const t of talents) {
        await prisma.user.upsert({
        where: { email: t.email },
        update: {},
        create: {
            email: t.email, passwordHash, role: 'TALENT', emailVerified: true,
            talentProfile: {
            create: {
                fullName: t.name, headline: t.headline, bio: 'Demo account for SkillLink.',
                location: t.location, availability: t.availability,
                skills: { create: t.skills.map(([name, proficiency]) => ({ skillId: skillId[name], proficiency })) },
            },
            },
        },
        });
    }

    for (const b of businesses) {
        const user = await prisma.user.upsert({
            where: { email: b.email },
            update: {},
            create: {
                email: b.email, passwordHash, role: 'BUSINESS', emailVerified: true,
                businessProfile: {
                create: {
                    organisationName: b.name, industry: b.industry, description: 'Demo business for SkillLink.',
                    contactPerson: b.contact, location: 'Nairobi, Kenya', verification: b.verification,
                },
                },
            },
            include: { businessProfile: true },
        });
        if (b.verification === 'PENDING' && user.businessProfile) {
        const existing = await prisma.verificationSubmission.count({ where: { businessProfileId: user.businessProfile.id } });
        if (existing === 0) {
            await prisma.verificationSubmission.create({
                data: { businessProfileId: user.businessProfile.id, documentUrl: `https://example.com/demo-documents/${b.slug}.pdf` },
            });
        }
        }
    }

    const owners = await prisma.user.findMany({
        where: { role: 'BUSINESS' },
        select: { email: true, businessProfile: { select: { id: true } } },
    });
    const businessId = Object.fromEntries(owners.filter((o) => o.businessProfile).map((o) => [o.email, o.businessProfile!.id]));

    for (const o of opps) {
        const businessProfileId = businessId[o.owner];
        if (!businessProfileId) { console.warn(`Skipped "${o.title}": business ${o.owner} not found`); continue; }
        if (await prisma.opportunity.findFirst({ where: { title: o.title } })) continue;
        await prisma.opportunity.create({
            data: {
                businessProfileId, categoryId: categoryId[o.category], typeId: typeId[o.type], title: o.title,
                description: `${o.title}. Demo opportunity created for the SkillLink prototype.`,
                durationWeeks: o.weeks, compensationAmount: o.amount, isRemote: o.remote, location: o.location,
                deadline: dateIn(o.days), status: o.status,
                skills: { create: o.skills.map((s) => ({ skillId: skillId[s] })) },
            },
        });
    }

    const talentRows = await prisma.talentProfile.findMany({ select: { id: true, user: { select: { email: true } } } });
    const talentId = Object.fromEntries(talentRows.map((t) => [t.user.email, t.id]));
    const oppRows = await prisma.opportunity.findMany({ select: { id: true, title: true } });
    const oppId = Object.fromEntries(oppRows.map((o) => [o.title, o.id]));

    for (const a of apps) {
        const opportunityId = oppId[a.title];
        const talentProfileId = talentId[a.talent];
        if (!opportunityId || !talentProfileId) { console.warn(`Skipped application: ${a.talent} -> ${a.title}`); continue; }
        const application = await prisma.application.upsert({
            where: { opportunityId_talentProfileId: { opportunityId, talentProfileId } },
            update: {},
            create: {
                opportunityId, talentProfileId, status: a.status, createdAt: ago(a.daysAgo),
                proposal: 'I have the skills this project needs and can start right away. Demo application.',
            },
        });
        if (application.status === 'SELECTED') {
        await prisma.project.upsert({
            where: { applicationId: application.id },
            update: {},
            create: { applicationId: application.id, status: 'IN_PROGRESS', startedAt: ago(5) },
        });
        }
    }

    console.log('Demo data ready (safe to run again).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());