import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";

export default async function TasksPage() {
  const user = await requirePermission("task-workflow", "VIEW");

  const tasks = await prisma.task.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    take: 100,
  });

  const myTasks = tasks.filter((t) => t.assignedTo === user.id);
  const openTasks = tasks.filter((t) => ["OPEN", "IN_PROGRESS"].includes(t.status));

  const priorityBadge: Record<string, "destructive" | "warning" | "default" | "outline"> = {
    URGENT: "destructive", HIGH: "destructive", MEDIUM: "warning", LOW: "default",
  };
  const statusBadge: Record<string, "success" | "warning" | "default" | "outline" | "destructive"> = {
    OPEN: "default", IN_PROGRESS: "warning", COMPLETED: "success", CANCELLED: "outline", ESCALATED: "destructive",
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tasks</h1>
      <p className="text-sm text-gray-500 mb-6">{myTasks.length} assigned to you · {openTasks.length} open</p>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={priorityBadge[task.priority]}>{task.priority}</Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</span>
                </div>
                {task.description && <p className="text-xs text-gray-500 mt-1">{task.description}</p>}
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>Type: {task.taskType}</span>
                  {task.dueDate && <span>Due: {formatDate(task.dueDate)}</span>}
                  {task.assignedTo === user.id && <span className="text-blue-500">Assigned to you</span>}
                </div>
              </div>
              <Badge variant={statusBadge[task.status]}>{task.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {tasks.length === 0 && <p className="text-center text-gray-500 py-12">No tasks yet</p>}
      </div>
    </div>
  );
}
