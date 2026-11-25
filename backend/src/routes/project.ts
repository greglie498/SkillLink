import { Router } from 'express';
import { z } from 'zod';
import { Prisma, type ProjectStatus } from '@prisma/client';
import { isVisible, isWindowOpen, windowEnd } from '../lib/feedback';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors } from '../lib/validate';
import { audit } from '../lib/audit';
import { requiredAuth, type AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requiredAuth);

type Side = 'TALENT' | 'BUSINESS';

const transitions: Record<Side, Record<ProjectStatus, ProjectStatus[]>> = {
    TALENT: {
        SELECTED: ['IN_PROGRESS', 'CANCELLED'],
        IN_PROGRESS: ['SUBMITTED', 'CANCELLED'],
        SUBMITTED: [],
        COMPLETED: [],
        CANCELLED: [],
    },
    BUSINESS: {
        SELECTED: ['CANCELLED'],
        IN_PROGRESS: ['CANCELLED'],
        SUBMITTED: ['COMPLETED', 'IN_PROGRESS', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
    },
};

class StateConflict extends Error {}

const statusSchema = z.object({ status: z.enum(['IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED']) });

const participantSelect = {
    id: true,
    status: true,
    startedAt: true,
    completedAt: true,
    application: {
        select: {
        talentProfile: { select: { userId: true, fullName: true, headline: true } },
        opportunity: {
            select: {
            id: true,
            title: true,
            description: true,
            compensationAmount: true,
            durationWeeks: true,
            deadline: true,
            business: { select: { userId: true, organisationName: true } },
            },
        },
        },
    },
} satisfies Prisma.ProjectSelect;

function sideOf(
    userId: string,
    p: { application: { talentProfile: { userId: string }; opportunity: { business: { userId: string } } } }
): Side | null {
    if (p.application.talentProfile.userId === userId) return 'TALENT';
    if (p.application.opportunity.business.userId === userId) return 'BUSINESS';
    return null;
}

function projectMessage(next: ProjectStatus, side: Side, title: string, actor: string): string {
    switch (next) {
        case 'IN_PROGRESS':
        return side === 'TALENT' ? `${actor} started work on "${title}".` : `${actor} asked for changes on "${title}".`;
        case 'SUBMITTED':
        return `${actor} submitted work for "${title}". Please review it.`;
        case 'COMPLETED':
        return `"${title}" was marked completed by ${actor}.`;
        case 'CANCELLED':
        return `"${title}" was cancelled by ${actor}.`;
        default:
        return `The status of "${title}" changed.`;
    }
}

// GET /api/projects   (the signed-in user's own projects)
router.get(
    '/',
    asyncHandler(async (req: AuthedRequest, res) => {
        const me = req.user!;
        const where =
            me.role === 'TALENT'
                ? { application: { talentProfile: { userId: me.id } } }
                : me.role === 'BUSINESS'
                ? { application: { opportunity: { business: { userId: me.id } } } }
                : null;
        if (!where) return res.json([]);

        const rows = await prisma.project.findMany({
            where,
            orderBy: { application: { createdAt: 'desc' } },
            select: participantSelect,
            take: 100,
        });

        res.json(
            rows.map((p) => ({
                id: p.id,
                status: p.status,
                startedAt: p.startedAt,
                completedAt: p.completedAt,
                title: p.application.opportunity.title,
                counterpart:
                me.role === 'TALENT' ? p.application.opportunity.business.organisationName : p.application.talentProfile.fullName,
                deadline: p.application.opportunity.deadline.toISOString().slice(0, 10),
            }))
        );
    })
);

// GET /api/projects/:id   (participants only; anyone else gets 404)
router.get(
    '/:id',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid project id.' });

        const project = await prisma.project.findUnique({ where: { id: id.data }, select: participantSelect });
        const side = project ? sideOf(req.user!.id, project) : null;
        if (!project || !side) return res.status(404).json({ message: 'Project not found.' });

        const o = project.application.opportunity;
        res.json({
            id: project.id,
            status: project.status,
            startedAt: project.startedAt,
            completedAt: project.completedAt,
            viewerSide: side,
            opportunity: {
                id: o.id,
                title: o.title,
                description: o.description,
                compensationAmount: o.compensationAmount?.toString() ?? null,
                durationWeeks: o.durationWeeks,
                deadline: o.deadline.toISOString().slice(0, 10),
            },
            business: o.business.organisationName,
            talent: { name: project.application.talentProfile.fullName, headline: project.application.talentProfile.headline },
            actions: transitions[side][project.status],
        });
    })
);

// PATCH /api/projects/:id/status   body: { status }
router.patch(
    '/:id/status',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid project id.' });

        const body = statusSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });
        const next = body.data.status;

        const project = await prisma.project.findUnique({ where: { id: id.data }, select: participantSelect });
        const side = project ? sideOf(req.user!.id, project) : null;
        if (!project || !side) return res.status(404).json({ message: 'Project not found.' });

        if (!transitions[side][project.status].includes(next)) {
        return res.status(409).json({ message: `You cannot change this project from ${project.status} to ${next}.` });
        }

        const o = project.application.opportunity;
        const actorName = side === 'TALENT' ? project.application.talentProfile.fullName : o.business.organisationName;
        const recipientId = side === 'TALENT' ? o.business.userId : project.application.talentProfile.userId;
        const recipientBase = side === 'TALENT' ? '/business/projects' : '/projects';

        try {
        await prisma.$transaction(async (tx) => {
            // Only updates if the status is still what we read: stops two simultaneous changes
            const changed = await tx.project.updateMany({
                where: { id: project.id, status: project.status },
                data: {
                    status: next,
                    ...(next === 'IN_PROGRESS' && !project.startedAt ? { startedAt: new Date() } : {}),
                    ...(next === 'COMPLETED' ? { completedAt: new Date() } : {}),
                },
            });
            if (changed.count !== 1) throw new StateConflict();

            await tx.notification.create({
                data: {
                    userId: recipientId,
                    type: 'PROJECT_STATUS',
                    message: projectMessage(next, side, o.title, actorName),
                    link: `${recipientBase}/${project.id}`,
                },
            });
            
            if (next === 'COMPLETED') {
                const actorBase = side === 'TALENT' ? '/projects' : '/business/projects';
                await tx.notification.createMany({
                    data: [
                        {
                            userId: req.user!.id,
                            type: 'FEEDBACK_REQUEST',
                            message: `How did it go? Share your feedback on "${o.title}".`,
                            link: `${actorBase}/${project.id}`,
                        },
                        {
                            userId: recipientId,
                            type: 'FEEDBACK_REQUEST',
                            message: `How did it go? Share your feedback on "${o.title}".`,
                            link: `${recipientBase}/${project.id}`,
                        },
                    ],
                });
            }

            await audit(tx, {
                actorUserId: req.user!.id,
                action: 'PROJECT_STATUS_CHANGED',
                targetType: 'project',
                targetId: project.id,
                metadata: { from: project.status, to: next },
            });
        });
        } catch (err) {
        if (err instanceof StateConflict) {
            return res.status(409).json({ message: 'This project was already updated. Refresh and try again.' });
        }
            throw err;
        }

        res.json({ id: project.id, status: next });
    })
);

const feedbackSchema = z.object({
    rating: z
        .number()
        .int('Choose a rating from 1 to 5.')
        .min(1, 'Choose a rating from 1 to 5.')
        .max(5, 'Choose a rating from 1 to 5.'),
    comment: z
        .string()
        .trim()
        .min(10, 'Write at least 10 characters.')
        .max(500, 'Comment must be no more than 500 characters.'),
});

const feedbackProjectSelect = {
    ...participantSelect,
    feedback: { select: { authorUserId: true, rating: true, comment: true, createdAt: true } },
} satisfies Prisma.ProjectSelect;

// GET /api/projects/:id/feedback   (participants only)
router.get(
    '/:id/feedback',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid project id.' });

        const project = await prisma.project.findUnique({ where: { id: id.data }, select: feedbackProjectSelect });
        const side = project ? sideOf(req.user!.id, project) : null;
        if (!project || !side) return res.status(404).json({ message: 'Project not found.' });

        const me = req.user!.id;
        const o = project.application.opportunity;
        const otherUserId = side === 'TALENT' ? o.business.userId : project.application.talentProfile.userId;
        const mine = project.feedback.find((f) => f.authorUserId === me) ?? null;
        const theirs = project.feedback.find((f) => f.authorUserId === otherUserId) ?? null;
        const completed = project.status === 'COMPLETED';
        const open = completed && isWindowOpen(project.completedAt);
        const visible = completed && isVisible(project.completedAt, Boolean(mine && theirs));

        res.json({
            completed,
            counterpart: side === 'TALENT' ? o.business.organisationName : project.application.talentProfile.fullName,
            windowEndsAt: completed && project.completedAt ? windowEnd(project.completedAt) : null,
            canSubmit: open && !mine,
            visible,
            mine: mine ? { rating: mine.rating, comment: mine.comment, createdAt: mine.createdAt } : null,
            otherSubmitted: Boolean(theirs),
            // The other party's text is only sent once it is visible
            other: visible && theirs ? { rating: theirs.rating, comment: theirs.comment, createdAt: theirs.createdAt } : null,
        });
    })
);

// POST /api/projects/:id/feedback   body: { rating, comment }
router.post(
    '/:id/feedback',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid project id.' });

        const body = feedbackSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });

        const project = await prisma.project.findUnique({ where: { id: id.data }, select: feedbackProjectSelect });
        const side = project ? sideOf(req.user!.id, project) : null;
        if (!project || !side) return res.status(404).json({ message: 'Project not found.' });

        if (project.status !== 'COMPLETED') {
            return res.status(409).json({ message: 'Feedback opens when the project is marked completed.' });
        }
        if (!isWindowOpen(project.completedAt)) {
            return res.status(409).json({ message: 'The feedback window for this project has closed.' });
        }

        const me = req.user!.id;
        if (project.feedback.some((f) => f.authorUserId === me)) {
            return res.status(409).json({ message: 'You have already submitted feedback for this project.' });
        }

        const o = project.application.opportunity;
        const otherUserId = side === 'TALENT' ? o.business.userId : project.application.talentProfile.userId;
        const actorName = side === 'TALENT' ? project.application.talentProfile.fullName : o.business.organisationName;
        const myBase = side === 'TALENT' ? '/projects' : '/business/projects';
        const otherBase = side === 'TALENT' ? '/business/projects' : '/projects';
        const otherAlready = project.feedback.some((f) => f.authorUserId === otherUserId);

        try {
        await prisma.$transaction(async (tx) => {
            const created = await tx.feedback.create({
                data: { projectId: project.id, authorUserId: me, rating: body.data.rating, comment: body.data.comment },
                select: { id: true },
            });

            if (otherAlready) {
            await tx.notification.createMany({
                data: [
                    { userId: me, type: 'FEEDBACK_VISIBLE', message: `Feedback for "${o.title}" is now visible.`, link: `${myBase}/${project.id}` },
                    { userId: otherUserId, type: 'FEEDBACK_VISIBLE', message: `Feedback for "${o.title}" is now visible.`, link: `${otherBase}/${project.id}` },
                ],
            });
            } else {
            await tx.notification.create({
                data: {
                    userId: otherUserId,
                    type: 'FEEDBACK_REQUEST',
                    message: `${actorName} left feedback on "${o.title}". Share yours to see it.`,
                    link: `${otherBase}/${project.id}`,
                },
            });
            }

            // The rating and comment are deliberately not copied into the audit log
            await audit(tx, {
                actorUserId: me,
                action: 'FEEDBACK_SUBMITTED',
                targetType: 'feedback',
                targetId: created.id,
                metadata: { projectId: project.id },
            });
        });
        } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            return res.status(409).json({ message: 'You have already submitted feedback for this project.' });
        }
        throw err;
        }

        res.status(201).json({ submitted: true, visible: otherAlready });
    })
);

export default router;