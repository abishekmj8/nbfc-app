import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function LoanAccountsPage({ searchParams }: PageProps) {
  const user = await requirePermission("loans", "VIEW");
  const params = await searchParams;
  const statusFilter = params.status;

  const where = {
    companyId: user.companyId,
    ...(statusFilter && { status: statusFilter }),
  };

  const [loans, stats] = await Promise.all([
    prisma.loanAccount.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.loanAccount.groupBy({
      by: ["status"],
      where: { companyId: user.companyId },
      _count: true,
      _sum: { outstandingPrincipal: true },
    }),
  ]);

  const totalAum = stats.reduce((sum, s) => sum + Number(s._sum.outstandingPrincipal ?? 0), 0);
  const activeCount = stats.find((s) => s.status === "ACTIVE")?._count ?? 0;
  const overdueCount = stats.find((s) => s.status === "OVERDUE")?._count ?? 0;
  const npaCount = stats.find((s) => s.status === "NPA")?._count ?? 0;

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    OVERDUE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    NPA: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    WRITTEN_OFF: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  };

  return (
    <div className="p-8">
      {/* Portfolio Summary */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Loan Accounts</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total AUM" value={formatMoney(BigInt(totalAum))} />
        <StatCard label="Active Loans" value={String(activeCount)} color="text-green-600" />
        <StatCard label="Overdue" value={String(overdueCount)} color="text-yellow-600" />
        <StatCard label="NPA" value={String(npaCount)} color="text-red-600" />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {["", "ACTIVE", "OVERDUE", "NPA", "CLOSED"].map((s) => (
          <Link
            key={s}
            href={s ? `/loans?status=${s}` : "/loans"}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              (statusFilter ?? "") === s
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      {/* Loan Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="text-left py-3 px-3 font-medium text-gray-500">Account #</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Outstanding</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">EMI</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Rate</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">DPD</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-3 font-medium text-gray-500">Disbursed</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="py-3 px-3">
                  <Link href={`/loans/${loan.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {loan.accountNumber}
                  </Link>
                </td>
                <td className="py-3 px-3 text-gray-900 dark:text-gray-100 font-mono">
                  {formatMoney(loan.outstandingPrincipal)}
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400 font-mono">
                  {formatMoney(loan.emiAmount)}
                </td>
                <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                  {(loan.interestRateBps / 100).toFixed(2)}%
                </td>
                <td className="py-3 px-3">
                  <span className={`font-mono ${loan.dpd > 90 ? "text-red-600 font-bold" : loan.dpd > 0 ? "text-yellow-600" : "text-green-600"}`}>
                    {loan.dpd}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[loan.status] ?? ""}`}>
                    {loan.status}
                  </span>
                </td>
                <td className="py-3 px-3 text-gray-500">{formatDate(loan.disbursedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loans.length === 0 && (
          <p className="text-center text-gray-500 py-12">No loan accounts found</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? "text-gray-900 dark:text-gray-100"}`}>{value}</p>
    </div>
  );
}
