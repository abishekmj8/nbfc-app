import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HrPage() {
  const user = await requirePermission("hr", "VIEW");
  const employees = await prisma.employee.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const active = employees.filter((e) => e.status === "ACTIVE").length;

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">HR & Employees</h1>
      <p className="text-sm text-gray-500 mb-6">{active} active of {employees.length} total</p>
      <div className="space-y-2">
        {employees.map((e) => (
          <Card key={e.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {e.firstName.charAt(0)}{e.lastName?.charAt(0) ?? ""}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{e.firstName} {e.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {e.employeeCode} · {e.designation ?? "—"} · {e.department ?? "—"} · Joined: {formatDate(e.dateOfJoining)}
                  </p>
                </div>
              </div>
              <Badge variant={e.status === "ACTIVE" ? "success" : e.status === "ON_LEAVE" ? "warning" : "outline"}>{e.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {employees.length === 0 && <p className="text-center text-gray-500 py-12">No employees. Add employees to track attendance and targets.</p>}
      </div>
    </div>
  );
}
