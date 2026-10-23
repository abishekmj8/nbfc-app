import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function LoanProductsPage() {
  const user = await requirePermission("settings", "VIEW");

  const products = await prisma.loanProduct.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loan Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} products configured</p>
        </div>
        <Link href="/settings/loan-products/new">
          <Button><Plus size={16} /> New Product</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</h3>
                    <Badge variant="outline">{p.code}</Badge>
                    <Badge variant={p.isActive ? "success" : "destructive"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{p.description || "No description"}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span>Type: {p.productType.replace(/_/g, " ")}</span>
                    <span>Rate: {(p.minInterestRate / 100).toFixed(2)}% — {(p.maxInterestRate / 100).toFixed(2)}%</span>
                    <span>Tenure: {p.minTenureMonths} — {p.maxTenureMonths} months</span>
                    <span>Amount: {formatMoney(p.minAmount)} — {formatMoney(p.maxAmount)}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>Method: {p.interestMethod.replace(/_/g, " ")}</span>
                    <span>Collateral: {p.collateralType}</span>
                    <span>Penal: +{(p.penalRateAdditional / 100).toFixed(2)}%</span>
                    <span>Processing: {(p.processingFeePercent / 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <p className="text-center text-gray-500 py-12">No loan products configured. Create your first product.</p>
        )}
      </div>
    </div>
  );
}
