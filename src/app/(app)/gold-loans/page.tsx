import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function GoldLoansPage() {
  const user = await requirePermission("loans", "VIEW");
  const appraisals = await prisma.goldAppraisal.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Gold Loan Operations</h1>
      <div className="space-y-2">
        {appraisals.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{a.itemDescription}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Net: {(a.netWeight / 1000).toFixed(2)}g · {a.purity}K · Valuation: {formatMoney(a.valuationAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">Max: {formatMoney(a.maxLoanAmount)}</p>
                <Badge variant="outline">{a.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {appraisals.length === 0 && <p className="text-center text-gray-500 py-12">No gold appraisals. Create one during loan origination for gold-backed loans.</p>}
      </div>
    </div>
  );
}
