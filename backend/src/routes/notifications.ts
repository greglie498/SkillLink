import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/asyncHandler';
import { requiredAuth, type AuthedRequest } from '../middleware/auth';

const router = Router();
router.use(requiredAuth);

// GET /api/notifications   (latest 50 of the signed-in user's notifications)
router.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const userId = req.user!.id;
    const [items, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, type: true, message: true, link: true, isRead: true, createdAt: true },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    res.json({ unread, items });
  })
);

// GET /api/notifications/unread-count
router.get(
    '/unread-count',
    asyncHandler(async (req: AuthedRequest, res) => {
        const unread = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
        res.json({ unread });
    })
);

// POST /api/notifications/read-all
router.post(
    '/read-all',
    asyncHandler(async (req: AuthedRequest, res) => {
        await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false }, data: { isRead: true } });
        res.status(204).send();
    })
);

// PATCH /api/notifications/:id/read   (own notifications only)
router.patch(
    '/:id/read',
    asyncHandler(async (req: AuthedRequest, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid notification id.' });

        const result = await prisma.notification.updateMany({
            where: { id: id.data, userId: req.user!.id },
            data: { isRead: true },
        });
        if (result.count === 0) return res.status(404).json({ message: 'Notification not found.' });
        res.status(204).send();
    })
);

export default router;