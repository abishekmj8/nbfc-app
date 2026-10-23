import { requirePermission } from "@/lib/auth/rbac";
import { generateProfitAndLoss } from "@/lib/accounting/service";
import { formatMoney } from "@/lib/utils/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ProfitLossPage() {
  const user = await requirePermission("accounting", "VIEW");
  const now = new Date();
  const fyStart = new Date(now.getFullYear(), 3, 1); // April 1
  if (now < fyStart) fyStart.setFullYear(fyStart.getFullYear() - 1);

  const pnl = await generateProfitAndLoss(user.companyId, fyStart, now);
  const isProfit = pnl.netProfit >= 0n;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Profit & Loss Statement</h1>
      <p className="text-sm text-gray-500 mb-6">
        {fyStart.toLocaleDateString("en-IN")} to {now.toLocaleDateString("en-IN")}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Income" value={formatMoney(pnl.totalIncome)} color="text-green-600" />
        <StatCard label="Total Expenses" value={formatMoney(pnl.totalExpense)} color="text-red-600" />
        <StatCard label={isProfit ? "Net Profit" : "Net Loss"} value={formatMoney(isProfit ? pnl.netProfit : -pnl.netProfit)} color={isProfit ? "text-green-600" : "text-red-600"} />
      </div>

      {pnl.items.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-gray-500">No income or expense entries yet.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-green-700 dark:text-green-400">Income</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pnl.items.filter((i) => i.accountType === "INCOME").map((item) => (
                <div key={item.code} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{item.code} — {item.name}</span>
                  <span className="font-mono font-medium text-green-700 dark:text-green-400">{formatMoney(item.amount)}</span>
                </div>
              ))}
              {pnl.items.filter((i) => i.accountType === "INCOME").length === 0 && <p className="text-sm text-gray-500">No income</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-red-700 dark:text-red-400">Expenses</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {pnl.items.filter((i) => i.accountType === "EXPENSE").map((item) => (
                <div key={item.code} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-300">{item.code} — {item.name}</span>
                  <span className="font-mono font-medium text-red-700 dark:text-red-400">{formatMoney(item.amount)}</span>
                </div>
              ))}
              {pnl.items.filter((i) => i.accountType === "EXPENSE").length === 0 && <p className="text-sm text-gray-500">No expenses</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-xl font-bold mt-1 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
