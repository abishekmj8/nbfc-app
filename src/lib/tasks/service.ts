"use server";

import { prisma } from "@/lib/db/prisma";
import { createAuditLog } from "@/lib/audit/service";

/**
 * Create a task.
 */
export async function createTask(params: {
  companyId: string;
  title: string;
  description?: string;
  taskType: string;
  priority?: string;
  assignedTo?: string;
  relatedEntity?: string;
  dueDate?: Date;
  userId: string;
  userEmail: string;
}) {
  const task = await prisma.task.create({
    data: {
      companyId: params.companyId,
      title: params.title,
      description: params.description,
      taskType: params.taskType,
      priority: params.priority ?? "MEDIUM",
      assignedTo: params.assignedTo,
      assignedBy: params.userId,
      relatedEntity: params.relatedEntity,
      dueDate: params.dueDate,
    },
  });

  await createAuditLog({
    companyId: params.companyId,
    userId: params.userId,
    userEmail: params.userEmail,
    action: "CREATE",
    entityType: "Task",
    entityId: task.id,
    after: { title: params.title, assignedTo: params.assignedTo },
  });

  return task;
}

/**
 * Escalate overdue tasks to the assignee's manager.
 * Called by daily cron.
 */
export async function escalateOverdueTasks(companyId: string): Promise<number> {
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      companyId,
      status: { in: ["OPEN", "IN_PROGRESS"] },
      dueDate: { lt: now },
      escalatedAt: null,
    },
  });

  let escalated = 0;
  for (const task of overdueTasks) {
    // Find the assignee's manager
    if (task.assignedTo) {
      const assignee = await prisma.employee.findFirst({
        where: { userId: task.assignedTo, companyId },
        select: { reportingTo: true },
      });

      if (assignee?.reportingTo) {
        const manager = await prisma.employee.findFirst({
          where: { id: assignee.reportingTo },
          select: { userId: true },
        });

        await prisma.task.update({
          where: { id: task.id },
          data: {
            status: "ESCALATED",
            escalatedTo: manager?.userId,
            escalatedAt: now,
            escalationReason: "Task overdue — auto-escalated to manager",
          },
        });
        escalated++;
      }
    }
  }

  return escalated;
}
