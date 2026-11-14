import { Router } from "express";
import z from "zod";
import { prisma } from '../lib/prisma';
import { asyncHandler } from "../lib/asyncHandler";
import { formatZodErrors } from "../lib/validate";
import { audit } from "../lib/audit";
import { csvCell, toCsv } from "../lib/csv";
import { requiredAuth, requiredRole, type AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requiredAuth, requiredRole('ADMIN'));

const uuid = z.string().uuid();

const paging = {
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
};

const listQuery = z.object({
    role: z.enum([ 'TALENT', 'BUSINESS', 'ADMIN']).optional(),
    status: z.enum([ 'ACTIVE', 'SUSPENDED', 'DEACTIVATED',]).optional(),
    q: z.string().trim().max(100).optional(),
    ...paging,
});

const auditQuery = z.object({
    action: z.string().trim().max(50).optional(),
    q: z.string().trim().max(100).optional(),
    days: z.coerce.number().int().min(1).max(365).optional(),
    ...paging,
});

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'SUSPENDED'])  });
const verificationSchema = z.object({ verification: z.enum([ 'VERIFIED', 'REJECTED']) });

// GET /api/admin/users?role=&status=&status=&page=&pagesize
router.get(
    '/users',
    asyncHandler(async (req, res) => {
        const parsed = listQuery.safeParse(req.query);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { role, status, q, page, pageSize }  = parsed.data;
        const where = {
            ...(role ?  { role  } : {}), 
            ...(status ? { status } : {}),
            ...(q ? { email: { contains: q, mode: 'insensitive' as const} } : {}),
        };

        const [total, rows] =  await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                // Explicit select: passwordHash  is never returned
                select: { 
                    id: true, 
                    email: true, 
                    role: true, 
                    status: true, 
                    emailVerified: true, 
                    createdAt: true, 
                    talentProfile: { select: { fullName: true} },
                    businessProfile: { select: { organisationName: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize, 
            }),
        ]);

        res.json({ 
            total, 
            page, 
            pageSize,  
            users: rows.map((u) => ({
                id: u.id,
                email: u.email,
                role: u.role,
                status: u.status,
                emailVerified: u.emailVerified,
                createdAt: u.createdAt,
                name: u.talentProfile?.fullName ?? u.businessProfile?.organisationName ?? null, 
            }))
        });
    })
);

// PATH /api/admin/users/:id/status body { status: 'ACTIVE' |  'SUSPENDED' }
router.patch(
    '/users/:id/status',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = uuid.safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid user id.'});

        const body = statusSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });

        if (id.data === req.user!.id) {
            return res.status(400).json({ message: 'You cannot change your own account status. ' });
        }

        const target = await prisma.user.findUnique({
            where: { id: id.data },
            select: { id: true, role:  true,  status: true },
        });
        if (!target) return res.status(404).json({ message: 'User not found.'});
        if (target.role === 'ADMIN') {
            return res.json(403).json({ message: 'Administrator accounts cannot be changed here. '});
        }

        // Status change and audit entry succeded or fail together
        const updated = await prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id: target.id},
                data: { status: body.data.status },
                select: { id: true, email: true, role: true, status: true },
            });
            await audit(tx, {
                actorUserId: req.user!.id,
                action: body.data.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
                targetType: 'user',
                targetId: target.id,
                metadata: { fromm: target.status },
            });
            return user;
        });

        res.json(updated);
    })
);

// PATH /api/admin/business/:id/verification (:id is the business PROFILE id)
router.patch(
    '/businesses/:id/verification',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = uuid.safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid business id.' });

        const body = verificationSchema.safeParse(req.body);
        if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });

        const business = await prisma.businessProfile.findUnique({
            where: { id:  id.data },
            select: { id: true, verification: true},
        });
        if (!business) return res.status(404).json({ message:  'Business not found.'});

        const updated = await prisma.$transaction(async (tx) => {
            const b =  await tx.businessProfile.update({
                where: { id: business.id },
                data: { verification: body.data.verification },
                select: { id: true, organisationName: true, verification: true},
            });
            await tx.verificationSubmission.updateMany({
                where: { businessProfileId: business.id, status: 'PENDING' },
                data: { status: body.data.verification, reviewedBy: req.user!.id, reviewedAt: new Date() },
            });
            await audit(tx, {
                actorUserId: req.user!.id,
                action: 'BUSINESS_VERIFICATION_UPDATED',
                targetType: 'business_profile',
                targetId: business.id,
                metadata: { from: business.verification, to: body.data.verification},
            });
            return b;
        });

        res.json(updated);
    })
);

const ADMIN_ACTIONS =[
    'USER_SUSPENDED',
    'USER_REACTIVATED',
    'BUSINESS_VERIFICATION_UPDATED',
    "OPPORTUNITY_UNPUBLISHED",
    'REPORT_EXPORTED',
]

// GET /api/admin/audit-logs?action=&page=&pageSize=
router.get(
    '/audit-logs',
    asyncHandler(async (req, res) => {
        const parsed =  auditQuery.safeParse(req.query);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { action, q, days, page, pageSize } = parsed.data;
        const now = Date.now();
        const where = {
            ...(action ? { action } : {}),
            ...(q ? { actor: { email: { contains: q, mode: 'insensitive' as const } } } : {}),
            ...(days ? { createdAt: { gte: new Date(now - days * 86_400_000) } } : {}),
        };
        const day = new Date(now - 86_400_000);
        const week = new Date(now - 7 * 86_400_000);

        const [total,  logs, last24h, failedLogins24h, adminActions7d] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                include: {actor: { select: { email: true} } },
                orderBy:  { createdAt: 'desc'},
                skip: (page - 1)  * pageSize,
                take: pageSize,
            }),
            prisma.auditLog.count({ where: { createdAt: { gte: day } } }),
            prisma.auditLog.count({ where: { action: 'LOGIN_FAILED', createdAt: { gte: day } } }),
            prisma.auditLog.count({ where: { action: { in: ADMIN_ACTIONS }, createdAt: { gte: week } } }),
        ]);

        res.json({
            total,
            page,
            pageSize,
            stats: { last24h, failedLogins24h, adminActions7d},
            logs: logs.map((l) => ({
                id: l.id,
                action: l.action,
                actor: l.actor?.email ?? null,
                targetType: l.targetType,
                targetId: l.targetId,
                metadata: l.metadata,
                createdAt: l.createdAt,
            })),
        });
    })
);

function tally(rows: {_count: {_all: number } }[], key: string): Record<string, number> {
    const out: Record<string, number> = {};
    for (const r of rows) out[(r as unknown as Record<string, string>)[key]] = r._count._all;
    return out;
}
const sum = (t: Record<string, number>) => Object.values(t).reduce((a, b) => a + b, 0);

// GET /api/admin/reports/summary
router.get(
    '/reports/summary',
    asyncHandler(async (_req, res) => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

        const [
            usersByRole,
            usersByStatus,
            businessByVerification,
            oppsByStatus,
            appsByStatus,
            projectsByStatus,
            publishedWithoutApplicants,
            stalled,
        ] = await Promise.all([
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            prisma.user.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.businessProfile.groupBy({ by: ['verification'], _count: { _all: true } }),
            prisma.opportunity.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.project.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.opportunity.count({ where: { status: 'PUBLISHED', applications: { none: {} } } }),
            prisma.application.count({ where: { status: 'SUBMITTED', createdAt: { lt: sevenDaysAgo } } }),
        ]);  

        const byRole = tally(usersByRole, 'role');
        const byStatus = tally(usersByStatus, 'status');
        const oppStatus = tally(oppsByStatus, 'status');
        const appStatus = tally(appsByStatus, 'status');
        const projStatus = tally(projectsByStatus, 'status');

        res.json({
            users: { total: sum(byRole), byRole, byStatus },
            businesses: { byVerification: tally(businessByVerification, 'verification') },
            opportunities: { total: sum(oppStatus), byStatus: oppStatus, publishedWithoutApplicants },
            applications: { total: sum(appStatus), byStatus: appStatus, stalled},
            projects: { total: sum(projStatus), byStatus: projStatus },
            generatedAt: new Date().toISOString(),
        });
    })
);

// GET /api/admin/businesses?verification=PENDING
router.get(
    '/businesses',
    asyncHandler(async (req, res) => {
        const parsed = z
            .object({ verification: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional() })
            .safeParse(req.query);
        if(!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const rows = await prisma.businessProfile.findMany({
            where: parsed.data.verification ? { verification: parsed.data.verification } : {},
            orderBy: { organisationName: 'asc'},
            take: 100,
            select: {
                id: true,
                organisationName: true,
                industry: true,
                location: true,
                verification: true,
                user: { select: { email: true } },
                verificationSubmissions: {
                    orderBy: { createdAt: 'desc'},
                    take: 1,
                    select: { documentUrl: true, createdAt: true },
                },
            },
        });
        
        res.json(
            rows.map((b) => {
                const latestSubmission = b.verificationSubmissions[0];
                return {
                    id: b.id,
                    name: b.organisationName,
                    industry: b.industry,
                    location: b.location,
                    verification: b.verification,
                    email: b.user?.email ?? null,
                    documentUrl: latestSubmission?.documentUrl ?? null,
                    submittedAt: latestSubmission?.createdAt ?? null,
                };
            })
        );
    })
);

// GET /api/admin/reports/export?type=users|applications|opportunities
router.get(
    '/reports/export',
    asyncHandler(async (req: AuthedRequest, res) => {
        const parsed = z.object({ type: z.enum(['users', 'applications', 'opportunities']) }).safeParse(req.query);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });
        const { type } = parsed.data;

        let csv: string;
        if (type === 'users') {
            const rows = await prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    status: true,
                    emailVerified: true, 
                    createdAt: true ,
                },
            });
            csv = toCsv(
                ['id', 'email', 'role', 'status', 'email.verified', 'created_at'],
                rows.map((r) => [
                    r.id,
                    r.email,
                    r.role,
                    r.status,
                    r.emailVerified,
                    r.createdAt,
                ])
            );
        } else if (type == 'applications') {
            const rows = await prisma.application.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    opportunity: { select: { title: true, business: { select: { organisationName: true } } } },
                    talentProfile: { select: { fullName: true } },
                },
            });
            csv = toCsv(
                ['id', 'opportunity', 'business', 'applicant', 'status', 'applied_at'],
                rows.map((r) => [
                    r.id,
                    r.opportunity.title,
                    r.opportunity.business.organisationName,
                    r.talentProfile?.fullName,
                    r.status,
                    r.createdAt,
                ])
            );
        } else {
            const rows = await prisma.opportunity.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    deadline: true,
                    createdAt: true,
                    business: { select: { organisationName: true } },
                    category: { select: { name: true } },
                    type: { select: { name: true} },
                    _count: { select: { applications: true } },
                },
            });
            csv = toCsv(
                ['id', 'title', 'business', 'category', 'type', 'status', 'deadline', 'applicants', 'created_at'],
                rows.map((r) => [
                    r.id,
                    r.title,
                    r.business.organisationName,
                    r.category.name,
                    r.type.name,
                    r.status,
                    r.deadline.toISOString().slice(0, 10),
                    r._count.applications,
                    r.createdAt,
                ])
            );
        }

        await audit(prisma, {
            actorUserId: req.user!.id,
            action: 'REPORT_EXPORTED',
            targetType: 'report',
            metadata: { type },
            targetId: ""
        });

        const stamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filenmae="skilllink-${type}-${stamp}.csv"');
        res.send('\uFEFF' + csv);
    })
);

class StateConflict extends Error {}

const DAY = 86_400_000;

const oppListQuery = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  q: z.string().trim().max(100).optional(),
  ...paging,
});

const unpublishSchema = z.object({
  status: z.literal('ARCHIVED'),
  reason: z
    .string()
    .trim()
    .min(5, 'Give a reason of at least 5 characters.')
    .max(300, 'Reason must be no more than 300 characters.'),
});

// GET /api/admin/opportunities?status=&q=&page=&pageSize=
router.get(
  '/opportunities',
  asyncHandler(async (req, res) => {
    const parsed = oppListQuery.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

    const { status, q, page, pageSize } = parsed.data;
    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { business: { organisationName: { contains: q, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [total, rows, byStatus] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          title: true,
          status: true,
          deadline: true,
          createdAt: true,
          business: { select: { organisationName: true } },
          category: { select: { name: true } },
          type: { select: { name: true } },
          _count: { select: { applications: true } },
        },
      }),
      prisma.opportunity.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    res.json({
      total,
      page,
      pageSize,
      stats: tally(byStatus, 'status'),
      opportunities: rows.map((o) => ({
        id: o.id,
        title: o.title,
        business: o.business.organisationName,
        category: o.category.name,
        type: o.type.name,
        status: o.status,
        deadline: o.deadline.toISOString().slice(0, 10),
        applicants: o._count.applications,
        createdAt: o.createdAt,
      })),
    });
  })
);

// PATCH /api/admin/opportunities/:id/status   body: { status: 'ARCHIVED', reason }
router.patch(
  '/opportunities/:id/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    const id = uuid.safeParse(req.params.id);
    if (!id.success) return res.status(400).json({ message: 'Invalid opportunity id.' });

    const body = unpublishSchema.safeParse(req.body);
    if (!body.success) return res.status(400).json({ errors: formatZodErrors(body.error) });

    const opportunity = await prisma.opportunity.findUnique({
      where: { id: id.data },
      select: { id: true, title: true, status: true, business: { select: { userId: true } } },
    });
    if (!opportunity) return res.status(404).json({ message: 'Opportunity not found.' });
    if (opportunity.status !== 'PUBLISHED') {
      return res.status(409).json({ message: 'Only published opportunities can be unpublished.' });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const changed = await tx.opportunity.updateMany({
          where: { id: opportunity.id, status: 'PUBLISHED' },
          data: { status: 'ARCHIVED' },
        });
        if (changed.count !== 1) throw new StateConflict();

        await tx.notification.create({
          data: {
            userId: opportunity.business.userId,
            type: 'OPPORTUNITY_UNPUBLISHED',
            message: `Your opportunity "${opportunity.title}" was removed by an administrator. Reason: ${body.data.reason}`,
          },
        });

        await audit(tx, {
          actorUserId: req.user!.id,
          action: 'OPPORTUNITY_UNPUBLISHED',
          targetType: 'opportunity',
          targetId: opportunity.id,
          metadata: { reason: body.data.reason },
        });
      });
    } catch (err) {
      if (err instanceof StateConflict) {
        return res.status(409).json({ message: 'This opportunity was already changed. Refresh and try again.' });
      }
      throw err;
    }

    res.json({ id: opportunity.id, status: 'ARCHIVED' });
  })
);

// GET /api/admin/reports/analytics
router.get(
    '/reports/analytics',
    asyncHandler(async (_req, res) => {
        const now = Date.now();

        const [newByRole, recentUsers, byCategory, skillDemand, appByStatus, categories] = await Promise.all([
        prisma.user.groupBy({
            by: ['role'],
            where: { createdAt: { gte: new Date(now - 30 * DAY) } },
            _count: { _all: true },
        }),
        prisma.user.findMany({
            where: { createdAt: { gte: new Date(now - 56 * DAY) }, role: { in: ['TALENT', 'BUSINESS'] } },
            select: { createdAt: true, role: true },
        }),
        prisma.opportunity.groupBy({
            by: ['categoryId'],
            where: { status: { not: 'DRAFT' } },
            _count: { _all: true },
        }),
        prisma.opportunitySkill.groupBy({
            by: ['skillId'],
            where: { opportunity: { status: 'PUBLISHED' } },
            _count: { _all: true },
            orderBy: { _count: { skillId: 'desc' } },
            take: 8,
        }),
        prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
        prisma.category.findMany({ select: { id: true, name: true } }),
        ]);

        const skillRows = await prisma.skill.findMany({
        where: { id: { in: skillDemand.map((s) => s.skillId) } },
        select: { id: true, name: true },
        });

        // Eight weekly buckets, oldest first
        const weeks = Array.from({ length: 8 }, (_, i) => ({
        weekStart: new Date(now - (8 - i) * 7 * DAY).toISOString().slice(0, 10),
        talent: 0,
        business: 0,
        }));
        for (const u of recentUsers) {
        const idx = 7 - Math.floor((now - u.createdAt.getTime()) / (7 * DAY));
        if (idx >= 0 && idx <= 7) {
            if (u.role === 'TALENT') weeks[idx].talent += 1;
            else weeks[idx].business += 1;
        }
        }

        const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
        const skillName = Object.fromEntries(skillRows.map((s) => [s.id, s.name]));
        const newTally = tally(newByRole, 'role');
        const appTally = tally(appByStatus, 'status');

        res.json({
        newUsers: { last30Days: sum(newTally), byRole: newTally },
        weeklySignups: weeks,
        opportunitiesByCategory: byCategory
            .map((c) => ({ name: categoryName[c.categoryId] ?? 'Unknown', count: c._count._all }))
            .sort((a, b) => b.count - a.count),
        topSkills: skillDemand.map((s) => ({ name: skillName[s.skillId] ?? 'Unknown', count: s._count._all })),
        applications: { total: sum(appTally), byStatus: appTally },
        generatedAt: new Date().toISOString(),
        });
    })
);

export default router;