import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { formatZodErrors } from '../lib/validate';
import { audit } from '../lib/audit';
import { requiredAuth, requiredRole, type AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requiredAuth, requiredRole('TALENT'));

const applySchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity.'),
  proposal: z
    .string()
    .trim()
    .min(20, 'Proposal must be at least 20 characters.')
    .max(1000, 'Proposal must be no more than 1000 characters.'),
  portfolioLinkIds: z.array(z.string().uuid()).max(5, 'Attach at most 5 portfolio links.').optional(),
});

// GET /api/applications   (the signed-in talent's own applications)
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const profile = await prisma.talentProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const applications = await prisma.application.findMany({
      where: { talentProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        opportunity: {
          select: { id: true, title: true, business: { select: { organisationName: true } } },
        },
      },
    });

    res.json(
      applications.map((a) => ({
        id: a.id,
        status: a.status,
        appliedAt: a.createdAt,
        opportunityId: a.opportunity.id,
        opportunityTitle: a.opportunity.title,
        business: a.opportunity.business.organisationName,
      }))
    );
  })
);

// POST /api/applications
router.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = applySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

    const { opportunityId, proposal } = parsed.data;
    const linkIds = [...new Set(parsed.data.portfolioLinkIds ?? [])];

    const profile = await prisma.talentProfile.findUnique({
      where: { userId: req.user!.id },
      select: { id: true, fullName: true },
    });
    if (!profile) return res.status(404).json({ message: 'Profile not found.' });

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, title: true, status: true, deadline: true, business: { select: { userId: true } } },
    });

    // Same answer for "does not exist", "not published" and "deadline passed"
    const today = new Date().toISOString().slice(0, 10);
    if (
      !opportunity ||
      opportunity.status !== 'PUBLISHED' ||
      opportunity.deadline.toISOString().slice(0, 10) < today
    ) {
      return res.status(409).json({ message: 'This opportunity is not open for applications.' });
    }

    // Portfolio links must belong to this talent
    if (linkIds.length > 0) {
      const owned = await prisma.portfolioLink.count({
        where: { id: { in: linkIds }, talentProfileId: profile.id },
      });
      if (owned !== linkIds.length) {
        return res.status(400).json({ errors: { portfolioLinkIds: 'One or more portfolio links are invalid.' } });
      }
    }

    const existing = await prisma.application.findUnique({
      where: { opportunityId_talentProfileId: { opportunityId, talentProfileId: profile.id } },
      select: { id: true },
    });
    if (existing) return res.status(409).json({ message: 'You have already applied to this opportunity.' });

    try {
      const created = await prisma.$transaction(async (tx) => {
        const application = await tx.application.create({
          data: {
            opportunityId,
            talentProfileId: profile.id,
            proposal,
            ...(linkIds.length
              ? { portfolioLinks: { create: linkIds.map((portfolioLinkId) => ({ portfolioLinkId })) } }
              : {}),
          },
          select: { id: true, status: true },
        });

        await tx.notification.create({
          data: {
            userId: opportunity.business.userId,
            type: 'APPLICATION_RECEIVED',
            message: `${profile.fullName} applied for "${opportunity.title}".`,
          },
        });

        await audit(tx, {
          actorUserId: req.user!.id,
          action: 'APPLICATION_SUBMITTED',
          targetType: 'application',
          targetId: application.id,
          metadata: { opportunityId },
        });

        return application;
      });

      res.status(201).json(created);
    } catch (err) {
      // Two simultaneous submissions: the unique constraint stops the second
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(409).json({ message: 'You have already applied to this opportunity.' });
      }
      throw err;
    }
  })
);

export default router;