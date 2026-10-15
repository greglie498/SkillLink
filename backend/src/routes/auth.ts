import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { JWT_SECRET } from "../lib/config";
import { asyncHandler } from "../lib/asyncHandler"; 
import { formatZodErrors } from "../lib/validate";

const router = Router();

const emailSchema = z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .transform((v) => v.toLowerCase());

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must include at least one number');

const registerSchema = z.object({
    role: z.enum([ 'TALENT', 'BUSINESS']),
    name: z.string().trim().min(1, 'Name is required.').max(120, 'Name must be no more than 120 characters.'),
    email: emailSchema,
    password: passwordSchema,
});

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required.'),
});

function signToken(userId: string, role: UserRole) {
    return jwt.sign({ role }, JWT_SECRET, { subject: userId, expiresIn: '7d' });
}

// POST /api/auth/register
router.post(
    '/register',
    asyncHandler(async (req, res) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { role, name, email, password } = parsed.data;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ errors: { email: 'An account with this email already exists. '} });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email, 
                passwordHash,
                role,
                ...(role === 'TALENT'
                    ? { talentProfile: { create: { fullName: name } } }
                        : { businessProfile: { create: { organisationName: name } } })
                    } as unknown as Prisma.UserCreateInput,
            select: { id: true, email: true, role: true },
        });

        res.status(201).json({ user, token: signToken(user.id, user.role) });
    })
);

// POST /api/auth/login
router.post(
    '/login',
    asyncHandler(async (req, res) => {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        if(!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'This account is not active.'});
        }

        res.json({
            user: { id: user.id, email: user.email, role: user.role },
            token: signToken(user.id, user.role),
        });
    })
);

export default router;