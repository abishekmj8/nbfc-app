import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateForm } from "./user-form";

export default async function UsersPage() {
  const admin = await requirePermission("users", "VIEW");

  const [users, roles, branches] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: admin.companyId, deletedAt: null },
      include: { role: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({ where: { companyId: admin.companyId }, select: { id: true, name: true } }),
    prisma.branch.findMany({ where: { companyId: admin.companyId, deletedAt: null }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Users</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} users</p>
      </div>

      <UserCreateForm roles={roles} branches={branches} />

      <div className="mt-6 space-y-2">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-medium text-blue-700 dark:text-blue-300">
                  {u.firstName.charAt(0)}{u.lastName?.charAt(0) ?? ""}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{u.role.name}</Badge>
                {u.branch && <span className="text-gray-500">{u.branch.name}</span>}
                <Badge variant={u.status === "ACTIVE" ? "success" : "destructive"}>{u.status}</Badge>
                {u.lastLoginAt && (
                  <span className="text-xs text-gray-400">Last login: {formatDate(u.lastLoginAt)}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
