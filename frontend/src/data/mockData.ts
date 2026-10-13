export interface Opportunity {
    id: string;
    title: string;
    business: string;
    matchScore: number;
    skills: string[];
    budget: string;
    duration: string;
    deadline: string;
}

export interface TalentProfile {
    headline: string;
    bio: string;
    location: string;
    availability: string;
    skills: string[];
}

export const recommendedOpportunities: Opportunity[] = [
    {
        id: '1',
        title: 'Frontend Developer for E-commerce site',
        business: 'Nairobi Crafts Co.',
        matchScore: 87,
        skills: ['react', 'Tailwind CSS'],
        budget: 'KES 25,000',
        duration: '3 weeks',
        deadline: '2026-10-05'
    },
    {
        id: '2',
        title: 'API Integration for Booking System',
        business: 'QuickBook Kenya',
        matchScore: 74,
        skills: ['Node.js', 'REST APIs'],
        budget: 'KES 18,000',
        duration: '2 weeks',
        deadline: '2026-10-10'
    },
    {
        id: '3',
        title: 'Database Design for Inventory App',
        business: 'Mama Mboga Supplies',
        matchScore: 65,
        skills: ['PostgreSQL', 'Prisma'],
        budget: 'KES 15,000',
        duration: '1 weeks',
        deadline: '2026-09-30'
    },
];

export const allOpportunities: Opportunity[] = [
    ...recommendedOpportunities,
     {
        id: '4',
        title: 'Social Media Content Calendar',
        business: 'Urnban Roots Cafe',
        matchScore: 58,
        skills: ['Content Writing', 'Canva'],
        budget: 'KES 8,000',
        duration: '1 week',
        deadline: '2026-10-01'
    },
     {
        id: '5',
        title: 'Mobile App Bug Fixes',
        business: 'Jenga Logistics',
        matchScore: 81,
        skills: ['React Native', 'TypeScript'],
        budget: 'KES 20,000',
        duration: '2 weeks',
        deadline: '2026-10-08'
    },
]

export const applications = [
    {id: 'a1', opportunity: 'UI Design for NGO Portal', status: 'Pending'},
    {id: 'a2', opportunity: 'Backend for Delivery App', status: 'Shortlisted'},
    {id: 'a3', opportunity: 'Landing Page Build', status: 'Rejected'},
];

export const mockProfile: TalentProfile = {
    headline: 'Frontend Developer | React & Typescript',
    bio: 'Software Engineering student student passionate about building clean, usable web apps.',
    location: 'Nairobi, Kenya',
    availability: '10-15 hrs/week',
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
}

export const profileCompletion = 70;