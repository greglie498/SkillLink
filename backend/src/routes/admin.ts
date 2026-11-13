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
    ...paging,
});

const auditQuery = z.object({
    action: z.string().trim().max(50).optional(),
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

        const { role, status,  page, pageSize }  = parsed.data;
        const where = {...(role ?  { role  } : {}), ...(status ? { status } : {}) };

        const [total, users] =  await Promise.all([
            prisma.user.count({ where }),
            prisma.user.findMany({
                where,
                // Explicit select: passwordHash  is never returned
                select: { id: true, email: true, role: true, status: true, emailVerified: true, createdAt: true },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize, 
            }),
        ]);

        res.json({ total, page, pageSize,  users });
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

// GET /api/admin/audit-logs?action=&page=&pageSize=
router.get(
    '/audit-logs',
    asyncHandler(async (requiredAuth, res) => {
        const parsed =  auditQuery.safeParse(requiredAuth.query);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { action, page, pageSize } = parsed.data;
        const where = action ? { action } : {};

        const [total,  logs] = await Promise.all([
            prisma.auditLog.count({ where }),
            prisma.auditLog.findMany({
                where,
                include: {actor: { select: { email: true} } },
                orderBy:  { createdAt: 'desc'},
                skip: (page - 1)  * pageSize,
                take: pageSize,
            }),
        ]);

        res.json({
            total,
            page,
            pageSize,
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
            rows.map((b) => ({
                id: b.id,
                name: b.organisationName,
                industry: b.industry,
                location: b.location,
                verification: b.verification,
                email: b.user.email,
                documentUrl: b.verificationSubmissions[0].documentUrl ?? null,
                submittedAt: b.verificationSubmissions[0].createdAt ?? null,
            }))
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

export default router;