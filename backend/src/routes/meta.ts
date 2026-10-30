import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler";
import { prisma } from "../lib/prisma";

const router = Router();

router.get (
    '/categories',
    asyncHandler(async (_req, res) => {
        res.json(await prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc'} }));
    })
);

router.get(
    '/types',
    asyncHandler(async (_req, res) => {
        res.json(await prisma.opportunityType.findMany({ select: {id: true, name: true}, orderBy: {name: 'asc'} }));
    })
);

export default router;