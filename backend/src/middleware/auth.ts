import type { Request, Response, NextFunction  } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { UserRole } from "@prisma/client";
import { JWT_SECRET } from "../lib/config";

export interface AuthedRequest extends Request {
    user?: { id: string, role: UserRole };
}

export function requiredAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required.'});
    }
    try {
        const payload = jwt.verify(header.slice(7), JWT_SECRET) as JwtPayload;
        req.user = { id: payload.sub as string, role: payload.role as UserRole };
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token.'});
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