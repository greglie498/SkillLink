import { Router } from 'express';
import { z } from 'zod';
import type { OpportunityStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors } from '../lib/validate';
import { requiredAuth, requiredRole, type AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requiredAuth, requiredRole('BUSINESS'));

const uuid = z.string().uuid();

// verification is deliberately absent: Zod drops unknown keys, so a client cannot set it
const profileSchema = z.object({
    organisationName: z
        .string()
        .trim()
        .min(1, 'Business name is required.')
        .max(120, 'Business name must be no more than 120 characters.'),
    industry: z.string().trim().max(80, 'Industry must be no more than 80 characters.').optional(),
    description: z.string().trim().max(1000, 'Description must be no more than 1000 characters.').optional(),
    contactPerson: z.string().trim().max(120, 'Contact person must be no more than 120 characters.').optional(),
    location: z.string().trim().max(120, 'Location must be no more than 120 characters.').optional(),
});

const futureDate = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD.')
    .refine((v) => {
        const d = new Date(`${v}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }, 'Enter a valid date.')
    .refine((v) => new Date(`${v}T00:00:00Z`) > new Date(), 'Deadline must be a future date.');

const opportunitySchema = z.object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters.').max(120, 'Title must be no more than 120 characters.'),
    description: z
        .string()
        .trim()
        .min(20, 'Description must be at least 20 characters.')
        .max(3000, 'Description must be no more than 3000 characters.'),
    categoryId: uuid,
    typeId: uuid,
    durationWeeks: z.number().int().min(1, 'Duration must be at least 1 week.').max(104, 'Duration is too long.').optional(),
    compensationAmount: z.number().min(0, 'Compensation cannot be negative.').max(10_000_000, 'Compensation is too large.').optional(),
    isRemote: z.boolean().default(false),
    location: z.string().trim().max(120, 'Location must be no more than 120 characters.').optional(),
    deadline: futureDate,
    skillIds: z.array(uuid).min(1, 'Select at least one skill.').max(15, 'Select at most 15 skills.'),
});

const statusSchema = z.object({ status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']) });

const allowedTransitions: Record<OpportunityStatus, OpportunityStatus[]> = {
    DRAFT: ['PUBLISHED', 'ARCHIVED'],
    PUBLISHED: ['CLOSED'],
    CLOSED: ['ARCHIVED'],
    ARCHIVED: [],
};

async function getBusiness(userId: string) {
    return prisma.businessProfile.findUnique({
        where: { userId },
        select: { id: true, verification: true },
    });
}

// Returns the de-duplicated ids if every skill exists and is active, otherwise null
async function validSkillIds(ids: string[]) {
    const unique = [...new Set(ids)];
    const count = await prisma.skill.count({ where: { id: { in: unique }, isActive: true } });
    return count === unique.length ? unique : null;
}

// GET /api/business/profile
router.get(
    '/profile',
    asyncHandler(async (req: AuthedRequest, res) => {
        const profile = await prisma.businessProfile.findUnique({ where: { userId: req.user!.id } });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });
        res.json({
            id: profile.id,
            organisationName: profile.organisationName,
            industry: profile.industry,
            description: profile.description,
            contactPerson: profile.contactPerson,
            location: profile.location,
            verification: profile.verification,
        });
    })
);

// PUT /api/business/profile
router.put(
    '/profile',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = profileSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const updated = await prisma.businessProfile.update({
        where: { userId: req.user!.id },
        data: parsed.data,
        select: {
            id: true,
            organisationName: true,
            industry: true,
            description: true,
            contactPerson: true,
            location: true,
            verification: true,
        },
        });
        res.json(updated);
    })
);

// GET /api/business/opportunities   (own opportunities, every status)
router.get(
    '/opportunities',
    asyncHandler(async (req: AuthedRequest, res) => {
        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        const list = await prisma.opportunity.findMany({
        where: { businessProfileId: business.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            createdAt: true,
            _count: { select: { applications: true } },
        },
        });

        res.json(
        list.map((o) => ({
            id: o.id,
            title: o.title,
            status: o.status,
            deadline: o.deadline.toISOString().slice(0, 10),
            createdAt: o.createdAt,
            applicants: o._count.applications,
        }))
        );
    })
);

// POST /api/business/opportunities   (always created as DRAFT)
router.post(
    '/opportunities',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = opportunitySchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });
        const d = parsed.data;

        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        const skillIds = await validSkillIds(d.skillIds);
        if (!skillIds) return res.status(400).json({ errors: { skillIds: 'One or more skills are invalid.' } });

        // Nested create: the opportunity and its skills are written atomically
        const created = await prisma.opportunity.create({
        data: {
            businessProfileId: business.id,
            categoryId: d.categoryId,
            typeId: d.typeId,
            title: d.title,
            description: d.description,
            durationWeeks: d.durationWeeks,
            compensationAmount: d.compensationAmount,
            isRemote: d.isRemote,
            location: d.location,
            deadline: new Date(`${d.deadline}T00:00:00Z`),
            skills: { create: skillIds.map((skillId) => ({ skillId })) },
        },
        select: { id: true, title: true, status: true },
        });

        res.status(201).json(created);
    })
);

// PUT /api/business/opportunities/:id   (own DRAFT only)
router.put(
    '/opportunities/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = uuid.safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid opportunity id.' });

        const parsed = opportunitySchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });
        const d = parsed.data;

        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        // Ownership check: the opportunity must belong to THIS business
        const existing = await prisma.opportunity.findFirst({
        where: { id: id.data, businessProfileId: business.id },
        select: { id: true, status: true },
        });
        if (!existing) return res.status(404).json({ message: 'Opportunity not found.' });
        if (existing.status !== 'DRAFT') {
        return res.status(409).json({ message: 'Only draft opportunities can be edited.' });
        }

        const skillIds = await validSkillIds(d.skillIds);
        if (!skillIds) return res.status(400).json({ errors: { skillIds: 'One or more skills are invalid.' } });

        const [, updated] = await prisma.$transaction([
        prisma.opportunitySkill.deleteMany({ where: { opportunityId: existing.id } }),
        prisma.opportunity.update({
            where: { id: existing.id },
            data: {
            categoryId: d.categoryId,
            typeId: d.typeId,
            title: d.title,
            description: d.description,
            durationWeeks: d.durationWeeks ?? null,
            compensationAmount: d.compensationAmount ?? null,
            isRemote: d.isRemote,
            location: d.location ?? null,
            deadline: new Date(`${d.deadline}T00:00:00Z`),
            skills: { create: skillIds.map((skillId) => ({ skillId })) },
            },
            select: { id: true, title: true, status: true },
        }),
        ]);

        res.json(updated);
    })
);

// PATCH /api/business/opportunities/:id/status   body: { status }
router.patch(
    '/opportunities/:id/status',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = uuid.safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid opportunity id.' });

        const body = statusSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });
        const next = body.data.status;

        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        const existing = await prisma.opportunity.findFirst({
            where: { id: id.data, businessProfileId: business.id },
            select: { id: true, status: true, deadline: true },
        });
        if (!existing) return res.status(404).json({ message: 'Opportunity not found.' });

        if (!allowedTransitions[existing.status].includes(next)) {
            return res.status(409).json({ message: `Cannot change status from ${existing.status} to ${next}.` });
        }

        if (next === 'PUBLISHED') {
        if (business.verification !== 'VERIFIED') {
            return res.status(403).json({ message: 'Your business must be verified before you can publish opportunities.' });
        }
        if (existing.deadline <= new Date()) {
            return res.status(400).json({ errors: { deadline: 'The deadline has passed. Edit the opportunity first.' } });
        }
        }

        const updated = await prisma.opportunity.update({
            where: { id: existing.id },
            data: { status: next },
            select: { id: true, title: true, status: true },
        });
        res.json(updated);
    })
);

export default router;