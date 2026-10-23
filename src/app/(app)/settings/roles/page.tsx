import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MODULES = ["settings", "users", "audit", "branches", "company", "holidays", "loans", "leads", "customers", "accounting", "compliance", "reports"];
const ACTIONS = ["VIEW", "CREATE", "EDIT", "APPROVE", "DELETE", "EXPORT"];

export default async function RolesPage() {
  const user = await requirePermission("users", "VIEW");

  const roles = await prisma.role.findMany({
    where: { companyId: user.companyId },
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Roles & Permissions</h1>

      <div className="space-y-6">
        {roles.map((role) => {
          const permSet = new Set(role.permissions.map((p) => `${p.module}:${p.action}`));

          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>{role.name}</CardTitle>
                    {role.isSystem && <Badge variant="outline">System</Badge>}
                    <Badge variant="default">{role._count.users} users</Badge>
                  </div>
                </div>
                {role.description && <p className="text-sm text-gray-500 mt-1">{role.description}</p>}
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-2 px-2 font-medium text-gray-500 w-28">Module</th>
                        {ACTIONS.map((a) => (
                          <th key={a} className="text-center py-2 px-1 font-medium text-gray-500 w-16">{a}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map((mod) => (
                        <tr key={mod} className="border-t border-gray-100 dark:border-gray-800/50">
                          <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300 capitalize">{mod}</td>
                          {ACTIONS.map((action) => (
                            <td key={action} className="text-center py-1.5 px-1">
                              {permSet.has(`${mod}:${action}`) ? (
                                <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-700">—</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
