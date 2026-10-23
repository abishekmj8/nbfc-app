import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DsaPage() {
  const user = await requirePermission("loans", "VIEW");
  const [partners, payouts] = await Promise.all([
    prisma.dsaPartner.findMany({ where: { companyId: user.companyId, deletedAt: null }, orderBy: { createdAt: "desc" } }),
    prisma.dsaPayout.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { dsaPartner: { select: { name: true } } } }),
  ]);

  const totalCommission = payouts.reduce((s, p) => s + Number(p.commissionAmount), 0);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">DSA / Partner Channel</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>DSA Partners ({partners.length})</CardTitle></CardHeader>
        <CardContent>
          {partners.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                <p className="text-xs text-gray-500">{p.type} · Commission: {(p.commissionPct / 100).toFixed(2)}% · TDS: {(p.tdsRatePct / 100)}%</p>
              </div>
              <div className="flex items-center gap-2">
                {p.apiEnabled && <Badge variant="default">API</Badge>}
                <Badge variant={p.status === "ACTIVE" ? "success" : "outline"}>{p.status}</Badge>
              </div>
            </div>
          ))}
          {partners.length === 0 && <p className="text-sm text-gray-500">No DSA partners registered</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Recent Payouts (Total: {formatMoney(BigInt(totalCommission))})</CardTitle></CardHeader>
        <CardContent>
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
              <span className="text-gray-900 dark:text-gray-100">{p.dsaPartner.name}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono">{formatMoney(p.netPayout)}</span>
                <Badge variant={p.status === "PAID" ? "success" : p.clawedBack ? "destructive" : "outline"}>{p.clawedBack ? "CLAWED BACK" : p.status}</Badge>
              </div>
            </div>
          ))}
          {payouts.length === 0 && <p className="text-sm text-gray-500">No payouts yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
