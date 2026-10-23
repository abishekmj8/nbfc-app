import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TreasuryPage() {
  const user = await requirePermission("accounting", "VIEW");
  const [borrowings, investments] = await Promise.all([
    prisma.borrowing.findMany({ where: { companyId: user.companyId }, orderBy: { startDate: "desc" } }),
    prisma.investment.findMany({ where: { companyId: user.companyId }, orderBy: { startDate: "desc" } }),
  ]);

  const totalBorrowed = borrowings.reduce((s, b) => s + Number(b.outstandingAmount), 0);
  const totalInvested = investments.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Treasury</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Outstanding Borrowings</p><p className="text-xl font-bold text-red-600 mt-1">{formatMoney(BigInt(totalBorrowed))}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-gray-500">Total Investments</p><p className="text-xl font-bold text-green-600 mt-1">{formatMoney(BigInt(totalInvested))}</p></CardContent></Card>
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle>Borrowings ({borrowings.length})</CardTitle></CardHeader>
        <CardContent>
          {borrowings.map((b) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{b.lenderName} — {b.facilityType.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">{(b.interestRateBps / 100).toFixed(2)}% · {formatDate(b.startDate)} to {formatDate(b.maturityDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">{formatMoney(b.outstandingAmount)}</p>
                <Badge variant={b.status === "ACTIVE" ? "warning" : "success"}>{b.status}</Badge>
              </div>
            </div>
          ))}
          {borrowings.length === 0 && <p className="text-sm text-gray-500">No borrowings recorded</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Investments ({investments.length})</CardTitle></CardHeader>
        <CardContent>
          {investments.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{i.institution} — {i.investmentType.replace(/_/g, " ")}</p>
                <p className="text-xs text-gray-500">From {formatDate(i.startDate)}{i.maturityDate ? ` to ${formatDate(i.maturityDate)}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-mono">{formatMoney(i.amount)}</p>
                <Badge variant={i.status === "ACTIVE" ? "success" : "outline"}>{i.status}</Badge>
              </div>
            </div>
          ))}
          {investments.length === 0 && <p className="text-sm text-gray-500">No investments recorded</p>}
        </CardContent>
      </Card>
    </div>
  );
}
