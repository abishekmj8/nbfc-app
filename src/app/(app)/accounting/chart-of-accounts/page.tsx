import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ChartOfAccountsPage() {
  const user = await requirePermission("accounting", "VIEW");

  const accounts = await prisma.chartOfAccount.findMany({
    where: { companyId: user.companyId, isActive: true },
    orderBy: { code: "asc" },
  });

  const grouped = {
    ASSET: accounts.filter((a) => a.accountType === "ASSET"),
    LIABILITY: accounts.filter((a) => a.accountType === "LIABILITY"),
    EQUITY: accounts.filter((a) => a.accountType === "EQUITY"),
    INCOME: accounts.filter((a) => a.accountType === "INCOME"),
    EXPENSE: accounts.filter((a) => a.accountType === "EXPENSE"),
  };

  const typeColors: Record<string, string> = {
    ASSET: "success", LIABILITY: "destructive", EQUITY: "default", INCOME: "success", EXPENSE: "warning",
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Chart of Accounts</h1>
      {accounts.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No accounts configured. Run the Chart of Accounts seeder from Settings.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([type, accts]) => accts.length > 0 && (
            <Card key={type}>
              <CardHeader><CardTitle className="flex items-center gap-2">{type} <Badge variant={typeColors[type] as "success" | "destructive" | "default" | "warning"}>{accts.length}</Badge></CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {accts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 text-sm" style={{ paddingLeft: `${a.level * 20}px` }}>
                      <span className="text-gray-900 dark:text-gray-100">{a.code} — {a.name}</span>
                      {a.isSystem && <span className="text-xs text-gray-400">System</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
