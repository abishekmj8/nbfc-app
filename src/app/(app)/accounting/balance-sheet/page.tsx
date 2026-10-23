import { requirePermission } from "@/lib/auth/rbac";
import { generateBalanceSheet } from "@/lib/accounting/service";
import { formatMoney } from "@/lib/utils/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function BalanceSheetPage() {
  const user = await requirePermission("accounting", "VIEW");
  const bs = await generateBalanceSheet(user.companyId, new Date());

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Balance Sheet</h1>
          <p className="text-sm text-gray-500">As of {new Date().toLocaleDateString("en-IN")}</p>
        </div>
        <Badge variant={bs.isBalanced ? "success" : "destructive"}>
          {bs.isBalanced ? "Balanced" : "NOT BALANCED"}
        </Badge>
      </div>

      {bs.items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No balance sheet data yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {bs.items.filter((i) => i.accountType === "ASSET").map((item) => (
                  <div key={item.code} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-mono">{formatMoney(item.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <span>Total Assets</span>
                  <span className="font-mono">{formatMoney(bs.totalAssets)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Liabilities</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {bs.items.filter((i) => i.accountType === "LIABILITY").map((item) => (
                  <div key={item.code} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-mono">{formatMoney(item.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <span>Total Liabilities</span>
                  <span className="font-mono">{formatMoney(bs.totalLiabilities)}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Equity</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {bs.items.filter((i) => i.accountType === "EQUITY").map((item) => (
                  <div key={item.code} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <span className="font-mono">{formatMoney(item.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                  <span>Total Equity</span>
                  <span className="font-mono">{formatMoney(bs.totalEquity)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
