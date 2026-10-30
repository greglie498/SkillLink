import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from  './prisma';

// Admin actions (e.g. USER_SUSPENDED)
export type AuditAction = 
    |'USER_REGISTERED' 
    | 'LOGIN_SUCCESS' 
    | 'LOGIN_FAILED' 
    | 'LOGIN_BLOCKED'
    | 'USER_SUSPENDED'
    | 'USER_REACTIVATED'
    | 'BUSINESS_VERIFICATION_UPDATED';

type Db = PrismaClient | Prisma.TransactionClient;

export interface AuditEntry {
    actorUserId?: string | null;
    action: AuditAction;
    targetType?: string;
    targetId: string;
    metadata?: Prisma.InputJsonObject;
}

// Use inside a transaction: if the audit write fails, the whole action rolls back
export async function audit(db: Db, entry: AuditEntry) {
    await db.auditLog.create({
        data: {
            actorUserId: entry.actorUserId ?? null,
            action: entry.action,
            targetType: entry.targetType ?? null,
            targetId: entry.targetId ?? null,
            ...(entry.metadata ? { metadata: entry.metadata } : {}),
        },
    });
}

// For events like login, where a logging failure must not block the user
export async function auditQuietly(entry: AuditEntry) {
    try {
        await audit(prisma, entry);
    } catch (err) {
        console.error('Audit log write failed', err);
    }
}