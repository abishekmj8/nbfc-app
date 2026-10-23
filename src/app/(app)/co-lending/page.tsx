import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoLendingPage() {
  const user = await requirePermission("loans", "VIEW");
  const [partners, loans] = await Promise.all([
    prisma.coLendingPartner.findMany({ where: { companyId: user.companyId }, orderBy: { createdAt: "desc" } }),
    prisma.coLendingLoan.findMany({ orderBy: { createdAt: "desc" }, take: 50, include: { partner: { select: { partnerName: true } } } }),
  ]);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Co-Lending</h1>
      <Card className="mb-6">
        <CardHeader><CardTitle>Partners ({partners.length})</CardTitle></CardHeader>
        <CardContent>
          {partners.map((p) => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{p.partnerName}</p>
                <p className="text-xs text-gray-500">{p.partnerType} · Default split: NBFC {(p.defaultNbfcSharePct / 100)}%</p>
              </div>
              <Badge variant={p.status === "ACTIVE" ? "success" : "outline"}>{p.status}</Badge>
            </div>
          ))}
          {partners.length === 0 && <p className="text-sm text-gray-500">No co-lending partners configured</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Co-Lent Loans ({loans.length})</CardTitle></CardHeader>
        <CardContent>
          {loans.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
              <div>
                <p className="text-gray-900 dark:text-gray-100">{l.partner.partnerName} · {l.model}</p>
                <p className="text-xs text-gray-500">NBFC: {formatMoney(l.nbfcAmount)} · Partner: {formatMoney(l.partnerAmount)}</p>
              </div>
              <Badge variant="outline">{l.status}</Badge>
            </div>
          ))}
          {loans.length === 0 && <p className="text-sm text-gray-500">No co-lent loans</p>}
        </CardContent>
      </Card>
    </div>
  );
}
