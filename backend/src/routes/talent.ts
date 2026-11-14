import { Router } from 'express';
import { date, z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors, httpUrl } from '../lib/validate';
import { requiredAuth, requiredRole, type AuthedRequest } from '../middleware/auth';
import { matchSkills } from '../lib/matching';

const router = Router();
router.use(requiredAuth, requiredRole('TALENT'));

const profileSchema = z.object({
    headline: z
        .string()
        .trim()
        .min(1, 'Headline is required.')
        .max(80, 'Headline must be no more than 80 characters.'),
    bio: z.string().max(300, 'Bio must be no more than 300 characters.').optional(),
    location: z.string().trim().min(1, 'Location is required.'),
    availability: z.string().trim().max(60, 'Availability must be no more than 60 characters.').optional(),
});

const addSkillSchema = z.object({
    name: z.string().trim().min(1, 'Enter a skill before adding.'),
    proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
});

async function getProfileId(userId: string) {
    const profile = await prisma.talentProfile.findUnique({
        where: { userId },
        select: { id: true },
    });
    return profile?.id ?? null;
}

// GET /api/talent/profile
router.get(
    '/profile',
    asyncHandler(async (req: AuthedRequest, res) => {
        const profile = await prisma.talentProfile.findUnique({
        where: { userId: req.user!.id },
        include: {
            skills: { include: { skill: true } },
            education: true,
            portfolioLinks: true,
        },
        });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        res.json({
            id: profile.id,
            fullName: profile.fullName,
            headline: profile.headline,
            bio: profile.bio,
            location: profile.location,
            availability: profile.availability,
            skills: profile.skills.map((s) => ({
                skillId: s.skillId,
                name: s.skill.name,
                proficiency: s.proficiency,
            })),
            education: profile.education,
            portfolioLinks: profile.portfolioLinks,
        });
    })
);

// PUT /api/talent/profile
router.put(
    '/profile',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = profileSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const updated = await prisma.talentProfile.update({
            where: { userId: req.user!.id },
            data: parsed.data,
        });

        res.json({
            headline: updated.headline,
            bio: updated.bio,
            location: updated.location,
            availability: updated.availability,
        });
    })
);

// POST /api/talent/skills   body: { name, proficiency? }
router.post(
    '/skills',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = addSkillSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        const skill = await prisma.skill.findFirst({
            where: { name: { equals: parsed.data.name, mode: 'insensitive' }, isActive: true },
        });
        if (!skill) {
            return res.status(404).json({ errors: { name: 'That skill is not in the catalogue.' } });
        }

        const already = await prisma.talentSkill.findUnique({
            where: { talentProfileId_skillId: { talentProfileId: profileId, skillId: skill.id } },
        });
        if (already) return res.status(409).json({ errors: { name: 'That skill is already added.' } });

        const created = await prisma.talentSkill.create({
            data: { talentProfileId: profileId, skillId: skill.id, proficiency: parsed.data.proficiency },
        });

        res.status(201).json({ skillId: skill.id, name: skill.name, proficiency: created.proficiency });
    })
);

// DELETE /api/talent/skills/:skillId
router.delete(
    '/skills/:skillId',
    asyncHandler(async (req: AuthedRequest, res) => {
        const skillId = z.string().uuid().safeParse(req.params.skillId);
        if (!skillId.success) return res.status(400).json({ message: 'Invalid skill id.' });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        await prisma.talentSkill.deleteMany({
            where: { talentProfileId: profileId, skillId: skillId.data },
        });

        res.status(204).send();
    })
);

// GET /api/talent/recommendations (open opportunities ranked by skill overlap)
router.get(
    '/recommendations',
    asyncHandler(async (req: AuthedRequest, res) => {
        const profile = await prisma.talentProfile.findUnique({
            where: { userId: req.user!.id },
            select: { id: true, skills: { select: { skill: { select: { name: true} } } } },
        });
        if(!profile) return res.status(404).json({ message: 'Profile not found.'});

        const mySkills = profile.skills.map((s) => s.skill.name);
        const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);

        const opportunities = await prisma.opportunity.findMany({
            where: {
                status: 'PUBLISHED',
                deadline: { gte: today},
                applications: { none: { talentProfileId: profile.id } },
            },
            include: {
                business: { select: { organisationName: true } },
                category: true,
                type: true,
                skills: { include: { skill: true} },
            },
            orderBy: { createdAt: 'desc'},
            take: 100,
        });

        const ranked = opportunities
            .map((o) => {
                const required = o.skills.map((s) => s.skill.name);
                const m = matchSkills(mySkills, required);
                return {
                    id: o.id,
                    title: o.title,
                    description: o.description,
                    business: o.business.organisationName,
                    category: o.category.name,
                    type: o.type.name,
                    skills: required,
                    compensationAmount: o.compensationAmount?.toString() ?? null,
                    durationWeeks: o.durationWeeks,
                    isRemote: o.isRemote,
                    location: o.location,
                    deadline: o.deadline.toISOString().slice(0, 10),
                    matchScore: m.score,
                    matchedSkills: m.matchedSkills,
                };
            })
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 12);

        res.json(ranked);
    })
);

// GET /api/talent/opportunities/:id/match
router.get(
    '/opportunities/:id/match',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid opportunity id.' });

        const profile = await prisma.talentProfile.findUnique({
        where: { userId: req.user!.id },
        select: { skills: { select: { skill: { select: { name: true } } } } },
        });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const opportunity = await prisma.opportunity.findFirst({
        where: { id: id.data, status: 'PUBLISHED' },
        select: { skills: { select: { skill: { select: { name: true } } } } },
        });
        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found.' });

        res.json(
        matchSkills(
            profile.skills.map((s) => s.skill.name),
            opportunity.skills.map((s) => s.skill.name)
        )
        );
    })
);

const portfolioSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.').max(80, 'Title must be no more than 80 characters.'),
  url: httpUrl,
});

const educationSchema = z
  .object({
    institution: z.string().trim().min(1, 'Institution is required.').max(120, 'Institution must be no more than 120 characters.'),
    qualification: z.string().trim().min(1, 'Qualification is required.').max(120, 'Qualification must be no more than 120 characters.'),
    startYear: z.number().int().min(1950, 'Enter a year from 1950.').max(2100, 'Enter a year up to 2100.').optional(),
    endYear: z.number().int().min(1950, 'Enter a year from 1950.').max(2100, 'Enter a year up to 2100.').optional(),
  })
  .refine((d) => d.startYear === undefined || d.endYear === undefined || d.endYear >= d.startYear, {
    message: 'End year cannot be before the start year.',
    path: ['endYear'],
  });

// POST /api/talent/portfolio
router.post(
    '/portfolio',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = portfolioSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        const count = await prisma.portfolioLink.count({ where: { talentProfileId: profileId } });
        if (count >= 10) return res.status(409).json({ message: 'You can add at most 10 portfolio links.' });

        const created = await prisma.portfolioLink.create({
        data: { talentProfileId: profileId, title: parsed.data.title, url: parsed.data.url },
        select: { id: true, title: true, url: true },
        });
        res.status(201).json(created);
    })
);

// DELETE /api/talent/portfolio/:id
router.delete(
    '/portfolio/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid portfolio link id.' });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        // Ownership check: the link must belong to THIS talent
        const link = await prisma.portfolioLink.findFirst({
        where: { id: id.data, talentProfileId: profileId },
        select: { id: true },
        });
        if (!link) return res.status(404).json({ message: 'Portfolio link not found.' });

        const used = await prisma.applicationPortfolioLink.count({ where: { portfolioLinkId: link.id } });
        if (used > 0) {
        return res.status(409).json({ message: 'This link is attached to an application and cannot be removed.' });
        }

        await prisma.portfolioLink.delete({ where: { id: link.id } });
        res.status(204).send();
    })
);

// POST /api/talent/education
router.post(
    '/education',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = educationSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        const count = await prisma.education.count({ where: { talentProfileId: profileId } });
        if (count >= 5) return res.status(409).json({ message: 'You can add at most 5 education entries.' });

        const created = await prisma.education.create({
        data: {
            talentProfileId: profileId,
            institution: parsed.data.institution,
            qualification: parsed.data.qualification,
            startYear: parsed.data.startYear,
            endYear: parsed.data.endYear,
        },
        select: { id: true, institution: true, qualification: true, startYear: true, endYear: true },
        });
        res.status(201).json(created);
    })
);

// DELETE /api/talent/education/:id
router.delete(
    '/education/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid education id.' });

        const profileId = await getProfileId(req.user!.id);
        if (!profileId) return res.status(404).json({ message: 'Profile not found.' });

        const entry = await prisma.education.findFirst({
        where: { id: id.data, talentProfileId: profileId },
        select: { id: true },
        });
        if (!entry) return res.status(404).json({ message: 'Education entry not found.' });

        await prisma.education.delete({ where: { id: entry.id } });
        res.status(204).send();
    })
);

export default router;