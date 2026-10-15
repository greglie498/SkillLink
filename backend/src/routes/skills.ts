import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

router.get(
    '/',
    asyncHandler(async (_req, res) => {
        const skills = await prisma.skill.findMany({
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
        res.json(skills);
    })
);

export default router;