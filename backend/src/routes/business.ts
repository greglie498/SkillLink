import { Router } from 'express';
import { z } from 'zod';
import type { ApplicationStatus, OpportunityStatus } from '@prisma/client';
import { matchSkills } from '../lib/matching';
import { talentRatings } from '../lib/feedback';
import { audit } from '../lib/audit';
import { businessRatings, businessReviews,  } from '../lib/feedback';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors, httpUrl } from '../lib/validate';
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

class StateConflict extends Error {}

const applicationStatusSchema = z.object({ status: z.enum([ 'SHORTLISTED', 'REJECTED', 'SELECTED' ]) });

const applicationTransitions: Record<ApplicationStatus,  ApplicationStatus[]> = {
    SUBMITTED: ['SHORTLISTED', 'REJECTED'],
    SHORTLISTED: ['SELECTED', 'REJECTED'],
    REJECTED: [],
    SELECTED: [],
}
function statusMessage(status: 'SHORTLISTED' | 'REJECTED' | 'SELECTED', title: string) {
    switch (status) {
        case 'SHORTLISTED':
            return `You have been shorlisted for "${title}".`;
        case 'REJECTED':
            return `Your application for "${title}" was not sucessful.`;
        case 'SELECTED':
            return `Congratulations! You were slected for "${title}".`;
    }
}


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
        const profile = await prisma.businessProfile.findUnique({ 
            where: { userId: req.user!.id },
            include: {
                verificationSubmissions: {
                    orderBy: { createdAt: 'desc'},
                    take: 1,
                    select: { documentUrl: true, status: true, createdAt: true},
                },
            },
        });
        if (!profile) return res.status(404).json({ message: 'Profile not found.' });

        const [ratings, reviews] = await Promise.all([businessRatings([profile.id]), businessReviews([profile.id])]);
        res.json({
            id: profile.id,
            organisationName: profile.organisationName,
            industry: profile.industry,
            description: profile.description,
            contactPerson: profile.contactPerson,
            location: profile.location,
            verification: profile.verification,
            submission: profile.verificationSubmissions[0] ?? null,
            rating: ratings.get(profile.id) ?? null,
            reviews,
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

// GET /api/business/opportunities/:id/applications (own opportunity only)
router.get(
    '/opportunities/:id/applications',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = uuid.safeParse(req.params.id);
        if(!id.success) return res.status(400).json({ message: 'Invalid opportunity id.'});

        const business = await getBusiness(req.user!.id);
        if (!business)  return res.status(404).json({ message: 'Profile not found.' });

        const opportunity = await prisma.opportunity.findFirst({
            where: { id: id.data, businessProfileId: business.id},
            select: {
                id: true,
                title: true,
                status: true,
                skills: { select: {skill: {select: { name: true} } } },
            },
        });
        if(!opportunity) return res.status(404).json({ message: 'Opportunity not found.'});

        const required = opportunity.skills.map((s) => s.skill.name);

        const applications = await prisma.application.findMany({
            where: { opportunityId: opportunity.id },
            orderBy: { createdAt: "asc"},
            select: {
                id: true,
                status: true,
                proposal: true,
                createdAt: true,
                portfolioLinks: { select: { portfolioLink: { select: { title: true, url: true} } } },
                talentProfile: {
                    select: {
                        id: true,
                        fullName: true,
                        headline: true,
                        location: true,
                        availability: true,
                        bio: true,
                        education: true,
                        skills: { select: { proficiency: true, skill: { select: { name: true, id: true}}}},
                    },
                },
                project: { select: { id: true } },
            },
        });

        const ratings = await talentRatings(applications.map((a) => a.talentProfile.id));

        const rows = applications
            .map((a) => {
                const m = matchSkills(a.talentProfile.skills.map((s) => s.skill.name), required);
                return {
                    id: a.id,
                    status: a.status,
                    proposal: a.proposal,
                    appliedAt: a.createdAt,
                    talent: {
                        name: a.talentProfile.fullName,
                        headline: a.talentProfile.headline,
                        location: a.talentProfile.location,
                        availability: a.talentProfile.availability,
                        skills: a.talentProfile.skills.map((s) => ({ name: s.skill.name, proficiency: s.proficiency })),
                        bio: a.talentProfile.bio,
                        education: a.talentProfile.education,
                    },
                    projectId: a.project?.id ?? null,
                    portfolioLinks: a.portfolioLinks.map((p) => p.portfolioLink),
                    matchScore: m.score,
                    rating: ratings.get(a.talentProfile.id) ?? null,
                    matchedSkills: m.matchedSkills,
                    missingSkills: m.missingSkills,
                };
            })
            .sort((x, y) => y.matchScore - x.matchScore );
            
            res.json({
                opportunity: { id: opportunity.id, title: opportunity.title, status: opportunity.status, requiredSkills: required },
                applications: rows,
            });
    })
);

// PATCH /api/business/applications/:id/status body: {status}
router.patch(
    '/applications/:id/status',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id =  uuid.safeParse(req.params.id)
        if (!id.success) return res.status(400).json({ message: 'Invalid application id.'});

        const body = applicationStatusSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });
        const  next = body.data.status;

        const business = await getBusiness(req.user!.id);
        if(!business) return res.status(404).json({ message: 'Profile not found. ' });

        // Ownership check: the application must belongto one of THIS business's  opportunities
        const application = await prisma.application.findFirst({
            where: { id: id.data, opportunity: { businessProfileId: business.id} },
            select: {
                id: true,
                status: true,
                opportunity: { select: { title: true} },
                talentProfile: { select: { 
                    userId: true,
                    bio: true,
                    education: { select: { institution: true, qualification: true, startYear: true, endYear: true } },
                } },
            },
        });
        if (!application) return res.status(404).json({ message: 'Application not found.'});

        if (!applicationTransitions[application.status].includes(next)) {
            return res.status(409).json({ message: `Cannot change status from ${application.status} to ${next}.`});
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                // Only updates if the status is still what we read: stops two simultaneous decisions
                const changed = await tx.application.updateMany({
                    where: { id: application.id, status: application.status },
                    data: { status: next },
                });
                if (changed.count !== 1) throw new StateConflict();

                let projectId: string | null = null;
                if (next  === 'SELECTED') {
                    const project = await tx.project.create({
                        data: {applicationId: application.id },
                        select: { id: true },
                    });
                    projectId = project.id;
                    await audit(tx, {
                        actorUserId: req.user!.id,
                        action: 'PROJECT_CREATED',
                        targetType: 'project',
                        targetId: project.id,
                        metadata: { applicationId: application.id},
                    });
                }

                await tx.notification.create({
                    data: {
                        userId: application.talentProfile.userId,
                        type: 'APPLICATION_STATUS',
                        message: statusMessage(next, application.opportunity.title),
                        link: projectId ? `/projects/${projectId}` : '/applications',
                    },
                });

                await audit(tx, {
                    actorUserId: req.user!.id,
                    action: 'APPLICATION_STATUS_CHANGED',
                    targetType: 'application',
                    targetId: application.id,
                    metadata: { from: application.status, to: next},
                });

                return { id: application.id, status: next, projectId };    
            });

            res.json(result);
        } catch (err) {
            if (err instanceof StateConflict) {
                return res.status(409).json({ message: 'This application was already updated. Refresh and try again.' });
            }
            throw err;
        }
    })
);

// GET /api/business/report
router.get(
    '/report',
    asyncHandler(async (req: AuthedRequest, res) => {
        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
        const soon = new Date(today.getTime() + 3 * 86_400_000);

        const opportunities = await prisma.opportunity.findMany({
        where: { businessProfileId: business.id },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            title: true,
            status: true,
            deadline: true,
            applications: { select: { status: true } },
        },
        });

        const oppByStatus: Record<string, number> = {};
        const appByStatus: Record<string, number> = {};
        const perOpportunity = [];
        const needsAttention = [];

        for (const o of opportunities) {
        oppByStatus[o.status] = (oppByStatus[o.status] ?? 0) + 1;
        const counts = { SUBMITTED: 0, SHORTLISTED: 0, REJECTED: 0, SELECTED: 0 };
        for (const a of o.applications) {
            counts[a.status] += 1;
            appByStatus[a.status] = (appByStatus[a.status] ?? 0) + 1;
        }
        const applicants = o.applications.length;

        perOpportunity.push({
            id: o.id,
            title: o.title,
            status: o.status,
            deadline: o.deadline.toISOString().slice(0, 10),
            applicants,
            submitted: counts.SUBMITTED,
            shortlisted: counts.SHORTLISTED,
            selected: counts.SELECTED,
            rejected: counts.REJECTED,
        });

        const reasons: string[] = [];
        if (o.status === 'DRAFT') reasons.push('Draft that has not been published');
        if (o.status === 'PUBLISHED') {
            if (applicants === 0) reasons.push('No applicants yet');
            if (counts.SUBMITTED > 0) reasons.push(`${counts.SUBMITTED} application(s) awaiting your decision`);
            if (o.deadline >= today && o.deadline <= soon) reasons.push('Deadline within 3 days');
        }
        if (reasons.length > 0) needsAttention.push({ id: o.id, title: o.title, reasons });
        }

        const appTotal = Object.values(appByStatus).reduce((a, b) => a + b, 0);

        res.json({
        verification: business.verification,
        opportunities: { total: opportunities.length, byStatus: oppByStatus },
        applications: { total: appTotal, byStatus: appByStatus },
            perOpportunity,
            needsAttention,
        });
    })
);

const documentSchema = z.object({ documentUrl: httpUrl });

// POST /api/business/verification   body: { documentUrl }
router.post(
    '/verification',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = documentSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const business = await getBusiness(req.user!.id);
        if (!business) return res.status(404).json({ message: 'Profile not found.' });

        if (business.verification === 'VERIFIED') {
        return res.status(409).json({ message: 'Your business is already verified.' });
        }
        const pending = await prisma.verificationSubmission.count({
        where: { businessProfileId: business.id, status: 'PENDING' },
        });
        if (pending > 0) {
        return res.status(409).json({ message: 'You already have a document awaiting review.' });
        }

        const created = await prisma.$transaction(async (tx) => {
        const submission = await tx.verificationSubmission.create({
            data: { businessProfileId: business.id, documentUrl: parsed.data.documentUrl },
            select: { documentUrl: true, status: true, createdAt: true },
        });
        // A rejected business goes back into the review queue
        if (business.verification === 'REJECTED') {
            await tx.businessProfile.update({ where: { id: business.id }, data: { verification: 'PENDING' } });
        }
        await audit(tx, {
            actorUserId: req.user!.id,
            action: 'VERIFICATION_SUBMITTED',
            targetType: 'business_profile',
            targetId: business.id,
        });
        return submission;
        });

        res.status(201).json(created);
    })
);

export default router;