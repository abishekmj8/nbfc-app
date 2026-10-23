import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDateTime } from "@/lib/utils/date";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    action?: string;
    entityType?: string;
    userId?: string;
  }>;
}

const PAGE_SIZE = 50;

export default async function AuditLogPage({ searchParams }: PageProps) {
  const user = await requirePermission("audit", "VIEW");
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const where = {
    companyId: user.companyId,
    ...(params.action && { action: params.action }),
    ...(params.entityType && { entityType: params.entityType }),
    ...(params.userId && { userId: params.userId }),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Audit Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Append-only record of all system changes. {total.toLocaleString()} entries.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">User</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Entity</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500 dark:text-gray-400">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {formatDateTime(log.createdAt)}
                </td>
                <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100">
                  {log.userEmail ?? "System"}
                </td>
                <td className="py-2.5 px-3">
                  <ActionBadge action={log.action} />
                </td>
                <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                  {log.entityType}
                  {log.entityId && (
                    <span className="text-gray-400 dark:text-gray-500 ml-1 font-mono text-xs">
                      {log.entityId.slice(0, 8)}
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
                  {log.ipAddress ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {logs.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">No audit log entries</p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/settings/audit-log?page=${page - 1}`}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Previous
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/settings/audit-log?page=${page + 1}`}
                className="px-3 py-1.5 rounded border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Next
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    LOGIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    LOGOUT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    EXPORT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    SETUP_COMPLETE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        colors[action] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      }`}
    >
      {action}
    </span>
  );
}
