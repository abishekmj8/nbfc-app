import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { CustomerTable } from "./customer-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function CustomersPage() {
  const user = await requirePermission("loans", "VIEW");

  const customers = await prisma.customer.findMany({
    where: { companyId: user.companyId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      identities: { where: { documentType: "PAN" }, select: { maskedNumber: true } },
      _count: { select: { bankAccounts: true } },
    },
  });

  const tableData = customers.map((c) => ({
    id: c.id,
    customerCode: c.customerCode ?? "",
    name: `${c.firstName} ${c.lastName ?? ""}`.trim(),
    phone: c.phone,
    email: c.email,
    pan: c.identities[0]?.maskedNumber ?? "—",
    kycStatus: c.kycStatus,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length} customers</p>
        </div>
        <Link href="/customers/new">
          <Button>
            <UserPlus size={16} />
            New Customer
          </Button>
        </Link>
      </div>

      <CustomerTable data={tableData} />
    </div>
  );
}
