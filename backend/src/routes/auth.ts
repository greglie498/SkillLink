import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_ROUNDS } from "../lib/config";
import { asyncHandler } from "../lib/asyncHandler"; 
import { formatZodErrors } from "../lib/validate";
import { audit, auditQuietly } from "../lib/audit";

const router = Router();

// Compared against when the email doesn't exist
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

const emailSchema = z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(254, 'Email is too long')
    .transform((v) => v.toLowerCase());

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter.')
    .regex(/[0-9]/, 'Password must include at least one number')
    .refine((v) => Buffer.byteLength(v, 'utf8') <= 72, 'Password must be at most 72 characters.');

const registerSchema = z.object({
    role: z.enum([ 'TALENT', 'BUSINESS']),
    name: z.string().trim().min(1, 'Name is required.').max(120, 'Name must be no more than 120 characters.'),
    email: emailSchema,
    password: passwordSchema,
});

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required.').max(128, 'Invalid email  or password'),
});

function signToken(userId: string, role: UserRole) {
    return jwt.sign({ role }, JWT_SECRET, {
        subject: userId, 
        expiresIn: '7d',
        algorithm: 'HS256',
    });
}

// POST /api/auth/register
router.post(
    '/register',
    asyncHandler(async (req, res) => {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ errors: formatZodErrors(parsed.error) });

        const { role, name, email, password } = parsed.data;

        try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ errors: { email: 'An account with this email already exists. '} });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
                data: {
                    email, 
                    passwordHash,
                    role,
                    ...(role === 'TALENT'
                        ? { talentProfile: { create: { fullName: name } } }
                            : { businessProfile: { create: { organisationName: name } } }),           
            },
                select: { id: true, email: true, role: true },
            });

            await audit(tx, {
                actorUserId: created.id,
                action: 'USER_REGISTERED',
                targetType: 'user',
                targetId: created.id,
                metadata: { role },
            });
                   
            return created;
        });

        res.status(201).json({ user, token: signToken(user.id, user.role) });
        } catch (err) {
            // Two simultaneous registrations with the same email: the unique constraint catches the loser
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code == 'P2002') {
                return res.status(409).json({ errors: { email: 'An account with this email already exists.'} });
            }
            throw err;
        }
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

        const valid = await bcrypt.compare(password,  user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid){
            if(user) {
                await auditQuietly({
                    actorUserId: user.id,
                    action: 'LOGIN_FAILED',
                    targetType: 'user',
                    targetId: user.id,
                    metadata: { reason: 'bad_password' },
                });
        }
            return res.status(401).json({ message: 'Invalid email or password.' });

        }
        if (user.status !== 'ACTIVE') {
            await auditQuietly({
                actorUserId: user.id,
                action: 'LOGIN_BLOCKED',
                targetType: 'user',
                targetId: user.id,
                metadata: { status: user.status },    
            });
            return res.status(403).json({ message: 'This account is not active.' });
        }

        await auditQuietly({
            actorUserId: user.id,
            action: 'LOGIN_SUCCESS',
            targetType: 'user',
            targetId: user.id,
        });
    

        res.json({
            user: { id: user.id, email: user.email, role: user.role },
            token: signToken(user.id, user.role),
        });
    })
);

export default router;