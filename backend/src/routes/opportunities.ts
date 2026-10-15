import { Router } from "express";
import z from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../lib/asyncHandler";

const router = Router();

const include = {
    business: { select: { organisationName: true } },
    category: true,
    type: true,
    skills: { include: { skill: true } },
};

function toDto(o: any) {
    return {
        id: o.id,
        title: o.title,
        description: o.description,
        business: o.business.organisationName,
        category: o.category.name,
        type: o.type.name,
        skills: o.skills.map((s: any) => s.skill.name),
        compensationAmount: o.compensationAmount?.toString() ?? null,
        durationWeeks: o.durationWeeks,
        isRemote: o.isRemote,
        location: o.location,
        deadline: o.deadline.toISOString().slice(0, 10),
    };
}

// GET /api/opportunities?q=react&skill=PostgreSQL
router.get(
    '/',
    asyncHandler(async (req,res) => {
        const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
        const skill = typeof req.query.skill === 'string' ? req.query.skill.trim() : '';

        const opportunities = await prisma.opportunity.findMany({
            where: {
                status: 'PUBLISHED',
                ...(q ? { title: {contains: q, mode: 'insensitive' } } : {}),
                ...(skill
                    ? {skills: { some: { skill: { name: { equals: skill, mode: 'insensitive'} } } } }
                    : {}),
            },
            include,
            orderBy: { createdAt: 'desc' },
        });

        res.json(opportunities.map(toDto));
    })
);

// GET /api/opportunities/:id
router.get(
    ':/id',
    asyncHandler(async (req, res) => {
        const id = z.string().uuid().safeParse(req.params.id);
        if (!id.success) return res.status(400).json({ message: 'Invalid opportunity is.' });

        const opportunity = await prisma.opportunity.findFirst({
            where: { id: id.data, status: 'PUBLISHED' },
            include,
        });
        if(!opportunity) return res.status(404).json({ message: 'Opportunity not found.' });

        res.json(toDto(opportunity));
    })
);

export default router;