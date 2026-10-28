import type { Request, Response, NextFunction  } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { UserRole } from "@prisma/client";
import { JWT_SECRET } from "../lib/config";
import { prisma } from '../lib/prisma';

export interface AuthedRequest extends Request {
    user?: { id: string, role: UserRole };
}

export async function requiredAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required.'});
    }
    
    let userId: string;
    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET, { algorithms:  ['HS256']}) as JwtPayload;
        if (typeof payload.sub !== 'string') throw new Error('Missing Subject');
        userId = payload.sub;
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token.'});
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true,  status: true},
        });
        if (!user || user.status !== 'ACTIVE') {
            return res.status(401).json({ message: 'Account is not active.' });
        }
        req.user = { id: user.id, role: user.role };
        next();
    } catch (err) {
        next(err);
    }
}

export function requiredRole(role: UserRole) {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ message: 'You do not have access to this resource.'})
        }
        next();
    };
}