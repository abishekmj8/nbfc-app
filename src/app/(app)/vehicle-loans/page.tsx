import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function VehicleLoansPage() {
  const user = await requirePermission("loans", "VIEW");
  const vehicles = await prisma.vehicleDetail.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Vehicle Loan Operations</h1>
      <div className="space-y-2">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{v.make} {v.model} {v.variant ?? ""} ({v.yearOfMfg})</p>
                <p className="text-xs text-gray-500 mt-1">
                  {v.vehicleType} · Reg: {v.registrationNo ?? "—"} · Engine: {v.engineNo ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={v.hypothecationStatus === "FILED" ? "success" : v.hypothecationStatus === "REMOVED" ? "outline" : "warning"}>
                  Hyp: {v.hypothecationStatus}
                </Badge>
                {v.repossessed && <Badge variant="destructive">Repossessed</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {vehicles.length === 0 && <p className="text-center text-gray-500 py-12">No vehicle records. Add during vehicle loan origination.</p>}
      </div>
    </div>
  );
}
