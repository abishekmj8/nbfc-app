import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";

export default async function MicrofinancePage() {
  const user = await requirePermission("loans", "VIEW");
  const groups = await prisma.mfiGroup.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: { where: { status: "ACTIVE" } } } } },
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Microfinance Operations</h1>
      <div className="space-y-2">
        {groups.map((g) => (
          <Card key={g.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{g.groupName}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Code: {g.groupCode} · {g.groupType} · {g._count.members} members · Formed: {formatDate(g.formationDate)}
                </p>
              </div>
              <Badge variant={g.status === "ACTIVE" ? "success" : "outline"}>{g.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {groups.length === 0 && <p className="text-center text-gray-500 py-12">No MFI groups. Create groups to start microfinance operations.</p>}
      </div>
    </div>
  );
}
