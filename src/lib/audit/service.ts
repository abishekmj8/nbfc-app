import { prisma } from "@/lib/db/prisma";

interface AuditLogInput {
  companyId?: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  metadata?: unknown;
}

/**
 * Create an audit log entry. Append-only — no updates or deletes.
 * Call this within the same transaction as the mutation when possible.
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      userEmail: input.userEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}

/**
 * Create an audit log entry within an existing Prisma transaction.
 */
export function createAuditLogTx(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  input: AuditLogInput
) {
  return tx.auditLog.create({
    data: {
      companyId: input.companyId,
      userId: input.userId,
      userEmail: input.userEmail,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ? JSON.stringify(input.before) : null,
      after: input.after ? JSON.stringify(input.after) : null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
