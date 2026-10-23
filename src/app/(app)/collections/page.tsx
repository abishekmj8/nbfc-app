import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import Link from "next/link";

export default async function CollectionsPage() {
  const user = await requirePermission("loans", "VIEW");

  // Overdue loans grouped by DPD buckets
  const overdueLoans = await prisma.loanAccount.findMany({
    where: {
      companyId: user.companyId,
      status: { in: ["OVERDUE", "NPA"] },
      dpd: { gt: 0 },
    },
    orderBy: { dpd: "desc" },
    take: 200,
  });

  const buckets = {
    "1-30": overdueLoans.filter((l) => l.dpd >= 1 && l.dpd <= 30),
    "31-60": overdueLoans.filter((l) => l.dpd >= 31 && l.dpd <= 60),
    "61-90": overdueLoans.filter((l) => l.dpd >= 61 && l.dpd <= 90),
    "90+": overdueLoans.filter((l) => l.dpd > 90),
  };

  const bucketTotals = Object.entries(buckets).map(([range, loans]) => ({
    range,
    count: loans.length,
    outstanding: loans.reduce((sum, l) => sum + Number(l.outstandingPrincipal), 0),
  }));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Collections</h1>

      {/* Overdue Buckets */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {bucketTotals.map((bucket) => (
          <div key={bucket.range} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">DPD {bucket.range}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{bucket.count}</p>
            <p className="text-sm text-gray-500 mt-1">{formatMoney(BigInt(bucket.outstanding))}</p>
          </div>
        ))}
      </div>

      {/* Overdue Loans List */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Overdue Accounts ({overdueLoans.length})
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Account</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Outstanding</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">DPD</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Classification</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {overdueLoans.map((loan) => (
              <tr key={loan.id} className={`border-b border-gray-100 dark:border-gray-800/50 ${
                loan.dpd > 90 ? "bg-red-50/50 dark:bg-red-950/20" : ""
              }`}>
                <td className="py-3 px-3">
                  <Link href={`/loans/${loan.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {loan.accountNumber}
                  </Link>
                </td>
                <td className="py-3 px-3 font-mono text-gray-900 dark:text-gray-100">
                  {formatMoney(loan.outstandingPrincipal)}
                </td>
                <td className="py-3 px-3">
                  <span className={`font-mono font-bold ${
                    loan.dpd > 90 ? "text-red-600" : loan.dpd > 60 ? "text-orange-600" : loan.dpd > 30 ? "text-yellow-600" : "text-gray-600"
                  }`}>
                    {loan.dpd}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {loan.smaClassification?.replace("_", "-") ?? loan.npaClassification?.replace("_", " ") ?? "—"}
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    loan.status === "NPA" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {loan.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {overdueLoans.length === 0 && (
          <p className="text-center text-gray-500 py-12">No overdue accounts. Great portfolio health!</p>
        )}
      </div>
    </div>
  );
}
