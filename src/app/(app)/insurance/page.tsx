import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function InsurancePage() {
  const user = await requirePermission("loans", "VIEW");
  const policies = await prisma.insurancePolicy.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Insurance Policies</h1>
      <div className="space-y-2">
        {policies.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{p.provider} — {p.policyNumber}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {p.policyType} · Cover: {formatMoney(p.coverAmount)} · Premium: {formatMoney(p.premiumAmount)} ·
                  {formatDate(p.startDate)} to {formatDate(p.endDate)}
                </p>
              </div>
              <Badge variant={p.status === "ACTIVE" ? "success" : p.status === "CLAIMED" ? "warning" : "outline"}>{p.status}</Badge>
            </CardContent>
          </Card>
        ))}
        {policies.length === 0 && <p className="text-center text-gray-500 py-12">No insurance policies linked</p>}
      </div>
    </div>
  );
}
