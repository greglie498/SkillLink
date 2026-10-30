import { Router } from "express";
import z from "zod";
import { prisma } from '../lib/prisma';
import { asyncHandler } from "../lib/asyncHandler";
import { formatZodErrors } from "../lib/validate";
import { audit } from "../lib/audit";
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

export default router;