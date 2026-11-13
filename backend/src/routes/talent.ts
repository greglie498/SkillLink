import { Router } from 'express';
import { date, z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors } from '../lib/validate';
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

export default router;