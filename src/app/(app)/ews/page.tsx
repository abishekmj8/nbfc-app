import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

export default async function EwsPage() {
  const user = await requirePermission("loans", "VIEW");

  const [scores, alerts] = await Promise.all([
    prisma.ewsScore.groupBy({
      by: ["riskBucket"],
      _count: true,
    }),
    prisma.ewsAlert.findMany({
      where: { companyId: user.companyId, status: { in: ["NEW", "ACKNOWLEDGED"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const bucketCounts: Record<string, number> = { GREEN: 0, YELLOW: 0, ORANGE: 0, RED: 0 };
  scores.forEach((s) => { bucketCounts[s.riskBucket] = s._count; });
  const total = Object.values(bucketCounts).reduce((s, c) => s + c, 0);

  const bucketColors: Record<string, string> = {
    GREEN: "bg-green-500", YELLOW: "bg-yellow-500", ORANGE: "bg-orange-500", RED: "bg-red-500",
  };
  const severityBadge: Record<string, "success" | "warning" | "destructive" | "default"> = {
    LOW: "default", MEDIUM: "warning", HIGH: "destructive", CRITICAL: "destructive",
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Early Warning System</h1>

      {/* Risk Buckets */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(["GREEN", "YELLOW", "ORANGE", "RED"] as const).map((bucket) => (
          <Card key={bucket}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${bucketColors[bucket]}`} />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{bucketCounts[bucket]}</p>
                <p className="text-xs text-gray-500">{bucket} ({total > 0 ? ((bucketCounts[bucket] / total) * 100).toFixed(0) : 0}%)</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader><CardTitle>Active Alerts ({alerts.length})</CardTitle></CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 rounded border border-gray-200 dark:border-gray-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={severityBadge[alert.severity]}>{alert.severity}</Badge>
                      <Link href={`/loans/${alert.loanAccountId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {alert.loanAccountId.slice(0, 12)}...
                      </Link>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{alert.signalType}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{alert.status}</Badge>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(alert.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No active alerts. Run the EWS processing job to generate alerts.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
